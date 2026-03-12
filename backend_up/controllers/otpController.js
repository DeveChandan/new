const Otp = require('../models/Otp');
const { User } = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../utils/fast2smsService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Helper to set cookie
const setTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };
  res.cookie('access_token', token, cookieOptions);
};

// Request OTP via Fast2SMS
const requestOtp = async (req, res) => {
  console.log('API Hit: requestOtp', req.body);
  const { mobile } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // For login, verify that the user exists before dispatching the OTP to save SMS costs
    const userExists = await User.findOne({ mobile });
    if (!userExists) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    // Save OTP to database
    await Otp.create({ mobile, otp });

    // Send OTP via Fast2SMS
    console.log(`Attempting to send OTP to ${mobile} via Fast2SMS...`);
    const result = await sendOTP(mobile, otp);
    console.log('Fast2SMS Response:', JSON.stringify(result, null, 2));

    if (result.development) {
      // Development mode - OTP logged to console
      console.log(`\n========================================`);
      console.log(`📱 DEVELOPMENT MODE OTP`);
      console.log(`Mobile: ${mobile}`);
      console.log(`OTP: ${otp}`);
      console.log(`========================================\n`);
      res.status(200).json({ message: 'OTP sent successfully (logged to console for development)' });
    } else if (result.success) {
      // Production mode - OTP sent via Fast2SMS
      console.log(`✅ OTP sent successfully via Fast2SMS to ${mobile}`);
      res.status(200).json({ message: 'OTP sent successfully' });
    } else {
      // Fast2SMS failed but OTP is in database
      console.log(`\n========================================`);
      console.log(`⚠️  Fast2SMS FAILED - DEVELOPMENT FALLBACK`);
      console.log(`Mobile: ${mobile}`);
      console.log(`OTP: ${otp}`);
      console.log(`Error: ${result.error || 'Unknown error'}`);
      console.log(`========================================\n`);
      res.status(200).json({ message: 'OTP sent (logged to console, Fast2SMS unavailable)' });
    }
  } catch (error) {
    console.error('Error in requestOtp:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Verify OTP (works for both legacy and new flow)
const verifyOtp = async (req, res) => {
  console.log('API Hit: verifyOtp', req.body);
  const { mobile, otp } = req.body;

  try {
    const otpRecord = await Otp.findOne({ mobile, otp });

    if (!otpRecord) {
      console.log('API Response: verifyOtp - Invalid OTP');
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired (10 minutes)
    const otpAge = Date.now() - new Date(otpRecord.createdAt).getTime();
    if (otpAge > 10 * 60 * 1000) {
      await Otp.deleteOne({ _id: otpRecord._id });
      console.log('API Response: verifyOtp - OTP expired');
      return res.status(400).json({ message: 'OTP expired' });
    }

    // OTP is valid, check if user exists
    let user = await User.findOne({ mobile });

    if (!user) {
      console.log('API Response: verifyOtp - User not found, needs registration');
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    console.log('API Response: verifyOtp - Success');
    const token = generateToken(user._id);
    setTokenCookie(res, token);
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      companyName: user.companyName,
      token,
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  requestOtp,
  verifyOtp,
};
