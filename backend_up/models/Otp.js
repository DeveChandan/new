const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  purpose: {
    type: String,
    enum: ['registration', 'change_mobile', 'login', 'forgot_password'],
    default: 'registration',
  },
  registrationData: { // To store data during registration
    type: Object,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // 10 minutes
  },
});

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
