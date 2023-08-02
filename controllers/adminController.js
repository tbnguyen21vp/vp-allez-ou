const User = require('../models/user');

const getClientList = async (req, res) => {
    try {
        const clientList = await User.find({ isAdmin: 0 }, '_id fullName gender dateCreate email phoneNumber');

        res.status(200).json(clientList);
    } catch (error) {
        console.error('Error in get client list:', error);
        res.status(500).json({ message: error });
    }
};

const getAdminList = async (req, res) => {
    try {
        const clientList = await User.find({ isAdmin: 1 }, '_id fullName');

        res.status(200).json(clientList);
    } catch (error) {
        console.error('Error in get client list:', error);
        res.status(500).json({ message: error });
    }
};

const createAdminAccount = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = new User({
            fullName,
            email,
            password: hashedPassword,
            verificationCode: undefined,
            isVerified: true,
            isAdmin: true
        });
        await admin.save();
        res.status(200).json({ message: "admin created successfully" });
    } catch (error) {
        console.error('Error in create admin account:', error);
        res.status(500).json({ message: error });
    }
}

const deleteAdminAccount = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Cannot find account' });
        }
        if (user.isAdmin) {
            await User.findByIdAndRemove(userId);
            return res.status(200).json({ message: 'Completed' });
        } else {
            return res.status(403).json({ message: 'Account is not admin' });
        }
    } catch (error) {
        console.error('Error in delete admin account:', error);
        res.status(500).json({ message: error });
    }
};




module.exports = { getAdminList, getClientList,  createAdminAccount, deleteAdminAccount}