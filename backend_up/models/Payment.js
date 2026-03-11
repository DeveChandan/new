const mongoose = require('mongoose');
const { PAYMENT_STATUSES } = require('../constants/statusEnums');

const paymentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        txnId: {
            type: String,
        },
        bankTxnId: {
            type: String,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        status: {
            type: String,
            enum: PAYMENT_STATUSES,
            default: 'pending',
        },
        paymentMethod: {
            type: String, // Wallet, NetBanking, Card, etc.
        },
        gatewayResponse: {
            type: Object, // Raw response from Paytm for auditing
        },
        planId: {
            type: String, // Which plan was being purchased
        },
        platform: {
            type: String,
            enum: ['mobile', 'web'],
            default: 'mobile',
        }
    },
    {
        timestamps: true,
    }
);

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
