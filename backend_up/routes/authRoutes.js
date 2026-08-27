const express = require('express');
const router = express.Router();
const { requestOtp, verifyOtp } = require('../controllers/otpController');
const { otpLimiter, authLimiter } = require('../middleware/rateLimiter');

router.post('/request-otp', otpLimiter, requestOtp);
router.post('/verify-otp', authLimiter, verifyOtp);

module.exports = router;
