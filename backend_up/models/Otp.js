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
  registrationData: { // Add this field
    type: Object, // To store the entire req.body for registration
    required: false, // Not all OTPs will be for registration
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // 10 minutes
  },
});

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
