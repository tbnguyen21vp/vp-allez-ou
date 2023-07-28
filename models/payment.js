const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    recipientAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentAccount', required: true }
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
