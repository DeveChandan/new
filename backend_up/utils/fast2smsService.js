const axios = require('axios');

/**
 * Fast2SMS OTP Service
 * Handles sending OTPs via Fast2SMS API
 * API Documentation: https://docs.fast2sms.com/
 */

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
// Route can be 'otp', 'dlt', or 'v3'. Defaulting to 'otp' for simplest integration.
const FAST2SMS_ROUTE = process.env.FAST2SMS_ROUTE || 'otp';
// Required for 'dlt' route
const FAST2SMS_SENDER_ID = process.env.FAST2SMS_SENDER_ID;
const FAST2SMS_TEMPLATE_ID = process.env.FAST2SMS_TEMPLATE_ID;

/**
 * Send OTP via Fast2SMS
 * @param {string} mobile - Mobile number
 * @param {string} otp - OTP to send
 * @returns {Promise<Object>} - Result of SMS sending
 */
const sendOTP = async (mobile, otp) => {
    try {
        if (!FAST2SMS_API_KEY) {
            console.error('FAST2SMS_API_KEY not configured');
            // For development, just log the OTP
            console.log(`Development OTP for ${mobile}: ${otp}`);
            return {
                success: true,
                message: 'OTP logged to console (Fast2SMS not configured)',
                development: true
            };
        }

        // Fast2SMS expects numbers without +91 usually, but handles 10 digits efficiently.
        // We'll strip non-numeric characters just in case, keeping last 10 digits if it's longer.
        let cleanMobile = mobile.replace(/\D/g, '');
        if (cleanMobile.length > 10) {
            cleanMobile = cleanMobile.slice(-10);
        }

        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=dlt&sender_id=${FAST2SMS_SENDER_ID}&message=${FAST2SMS_TEMPLATE_ID}&variables_values=${otp}&flash=0&numbers=${cleanMobile}`;

        console.log('Sending OTP request to Fast2SMS URL:', url.replace(FAST2SMS_API_KEY, 'HIDDEN_API_KEY'));

        const response = await axios.get(url, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('Fast2SMS API Response:', response.data);

        return {
            success: response.data.return,
            message: response.data.message[0] || 'OTP sent successfully',
            data: response.data
        };
    } catch (error) {
        console.error('Error sending OTP via Fast2SMS:', error.response?.data || error.message);

        // For development, still log the OTP even if Fast2SMS fails
        console.log(`\n========================================`);
        console.log(`⚠️  Fast2SMS ERROR - DEVELOPMENT FALLBACK`);
        console.log(`Mobile: ${mobile}`);
        console.log(`OTP: ${otp}`);
        console.log(`Error: ${JSON.stringify(error.response?.data || error.message)}`);
        console.log(`========================================\n`);

        return {
            success: false,
            message: 'Failed to send OTP via Fast2SMS',
            error: error.response?.data || error.message,
            development: true,
            otp: otp // Include OTP in development mode
        };
    }
};

/**
 * Resend OTP (Mock wrapper for consistency)
 * Fast2SMS doesn't have a specific "retry" endpoint,
 * so we just send the OTP again.
 */
const resendOTP = async (mobile, otp) => {
    return sendOTP(mobile, otp);
};

module.exports = {
    sendOTP,
    resendOTP
};
