const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Limits each IP to 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip rate limiting in development
    skip: (req) => {
        // Disable rate limiting completely in development
        return process.env.NODE_ENV !== 'production';
    },
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits each IP to 5 requests per 15 minutes
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Rate limiter for job creation
 * Limits each IP to 10 job posts per hour
 */
const jobCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        success: false,
        message: 'Too many jobs posted, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for file uploads
 * Limits each IP to 20 uploads per hour
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: {
        success: false,
        message: 'Too many file uploads, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for messaging
 * Limits each IP to 50 messages per 15 minutes
 */
const messageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: {
        success: false,
        message: 'Too many messages sent, please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    authLimiter,
    jobCreationLimiter,
    uploadLimiter,
    messageLimiter,
};
