const User = require('../models/user');
const Tour = require('../models/tour'); 
const Item = require('../models/item'); 
const cron = require('node-cron');

function convertGenderToVietnamese(gender) {
    if (gender === "Male") {
        return "Nam";
    } else if (gender === "Female") {
        return "Nữ";
    } else {
        return gender;
    }
}
function changeDateToString(currentTime) {
    let day = currentTime.getDate();
    let month = currentTime.getMonth() + 1;
    let year = currentTime.getFullYear();
  
    if (day.toString().length === 1) {
      day = "0" + day.toString();
    }
    if (month.toString().length === 1) {
      month = "0" + month.toString();
    }
  
    return day + "/" + month + "/" + year;
}

const addNewItem = async (req, res) => {
    try {
        const userId = req.userId;
        const { tourCode } = req.body;

        const tour = await Tour.findOne({ code: tourCode });
        if (!tour) {
            return res.status(404).json({ message: 'Tour not found' });
        }

        const cartItem = new Item({
            tourCode: tour.code,
            tickets: [],
            totalPrice: tour.price,
        });

        await cartItem.save();

        // Thêm item vào giỏ hàng của người dùng
        const user = await User.findByIdAndUpdate(userId, {
            $push: { cart: cartItem._id }
        });

        res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getCartPage = async (req, res) => {
    try {
        const userId = req.userId;

        const userCart = await User.findById(userId).populate('cart');
        if (!userCart) {
            return res.status(404).send('There are no products in the shopping cart');
        }

        let cartItems = await Promise.all(userCart.cart.map(async (item) => {
            let tour = await Tour.findOne({ code: item.tourCode });
            const formattedStartDate = changeDateToString(tour.date);
            tour = { ...tour.toObject(), date: formattedStartDate };

            return {
                imgURL: tour.cardImgUrl,
                code: item.tourCode,
                name: tour.name,
                date: tour.date,
                price: tour.price,
                itemId: item._id,
            };
        }));

        const user = req.user;
        res.render('cart', { user, cartItems, title: 'null' });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};

const deleteItem = async (req, res) => {
    try {
        const userId = req.userId;
        const { itemId } = req.body;
      
        const user = await User.findById(userId);

        // Tìm và loại bỏ phần tử có _id trùng với itemId
        user.cart = user.cart.filter(item => !item._id.equals(itemId));
        await user.save();
        res.status(200).json({ message: 'Item removed from cart successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getOrderHistoryPage = async (req, res) => {
    try {
        const userId = req.userId;

        const userOrders = await User.findById(userId).populate('orders');
        if (!userOrders) {
            return res.status(404).send('There are no orders in the order history');
        }
        let orderItems = await Promise.all(userOrders.orders.map(async (item) => {
            let tour = await Tour.findOne({ code: item.tourCode }).select('cardImgUrl name date startPlace.name');
            const formattedStartDate = changeDateToString(tour.date);
            tour = { ...tour.toObject(), date: formattedStartDate };

            return {
                tour,
                item,
            };
        }));

        const orderSuccess = orderItems.filter(order => order.item.status === 'Success');
        const orderCompleted = orderItems.filter(order => order.item.status === 'Completed');
        const orderCancelled = orderItems.filter(order => order.item.status === 'Cancelled');

        const user = req.user;
        res.render('orderHistory', { user, orderSuccess, orderCompleted, orderCancelled, title: 'null' });

    } catch (error) {
        console.error(error);
        res.status(500).send( 'Internal server error' );
    }
};


//---------------------------------------------------------------------------------
const updateItemStatus = async () => {
    try {
        const currentDate = new Date();
        const orders = await Item.find({ isPaid: true });
        
        for (const order of orders) {
            const tour = await Tour.findOne({ code: order.tourCode });

            if (!tour) {
                console.log(`Tour not found for order with tourCode: ${order.tourCode}`);
                continue;
            }

            for (const item of tour.items) {
                if (item._id.toString() === order._id.toString()) {
                    const startDate = new Date(tour.date);
                    startDate.setDate(startDate.getDate() + item.startDateOffset);

                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + tour.numOfDays);

                    if (endDate < currentDate) {
                        // Nếu endDate đã qua thì cập nhật trạng thái của item thành 'Completed'
                        await Item.updateOne({ _id: order._id }, { status: 'Completed' });
                    }
                }
            }
        }
        

        console.log('Updated item statuses');
    } catch (error) {
        console.error('Error updating item statuses:', error.message);
    }
};

cron.schedule('0 0 * * *', () => {
    updateItemStatus();
});
//---------------------------------------------------------------------------

const getOrderDetails = async (req, res) => {
    try {
        const userId = req.userId;
        const { itemId } = req.params;
        console.log(itemId + ' ' + userID);

        const userOrders = await User.findById(userId).populate('orders');
        if (!userOrders) {
            return res.status(404).send('There are no products in the order history');
        }

        const orderDetails = userOrders.orders.find(item => item._id.toString() === itemId);
        if (!orderDetails) {
            return res.status(404).json({ error: 'Order not found' });
        }

        console.log(orderDetails);
        res.render('orderDetails', { user, orderDetails, title: 'null' });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const userId = req.userId;
        const orderId = req.params.code;
        console.log(orderId);

        const user = await User.findById(userId).populate('orders');

        const order = user.orders.find(order => order._id.equals(orderId));
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status === 'Completed' || order.status === 'Cancelled') {
            return res.status(400).json({ message: 'Completed or canceled orders cannot be canceled' });
        }

        order.status = 'Cancelled';
        await order.save();

        res.status(200).json({ message: 'Order has been successfully canceled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const getPaymentHistoryPage = async (req, res) => {
    try {
        const userId = req.userId;

        const userOrders = await User.findById(userId).populate('orders');
        if (!userOrders) {
            return res.status(404).send('There are no orders in the order history');
        }
        let orderItems = await Promise.all(userOrders.orders.map(async (item) => {
            let tour = await Tour.findOne({ code: item.tourCode }).select('cardImgUrl name date startPlace.name');
            const formattedStartDate = changeDateToString(tour.date);
            tour = { ...tour.toObject(), date: formattedStartDate };

            return {
                tour,
                item,
            };
        }));

        const paid = orderItems.filter(order => order.item.status === 'Completed' || order.item.status === 'Success' );
        const refunded = orderItems.filter(order => order.item.status === 'Cancelled');

        const user = req.user;
        res.render('paymentHistory', { user, paid, refunded, title: 'null' });
        // res.status(200).json({ paid, refunded })

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    addNewItem,
    getCartPage,
    deleteItem,
    getOrderHistoryPage,
    getOrderDetails,
    cancelOrder,
    getPaymentHistoryPage,

    updateItemStatus,
};
