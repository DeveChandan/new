const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Limits each IP to 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increased limit to 200 requests per windowMs
    keyGenerator: (req) => {
        return req.user ? req.user._id.toString() : req.ip;
    },
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return process.env.NODE_ENV === 'test'; // Only skip in tests if needed
    },
    validate: { keyGeneratorIpFallback: false },
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits each IP to 5 requests per 15 minutes
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Increased from 5 to 10
    keyGenerator: (req) => {
        return req.user ? req.user._id.toString() : req.ip;
    },
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    validate: { keyGeneratorIpFallback: false },
});

/**
 * Rate limiter for job creation
 * Limits each IP to 10 job posts per hour
 */
const jobCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Increased from 10 to 20
    keyGenerator: (req) => {
        return req.user ? req.user._id.toString() : req.ip;
    },
    message: {
        success: false,
        message: 'Too many jobs posted, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false },
});

/**
 * Rate limiter for file uploads
 * Limits each IP to 20 uploads per hour
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // Increased from 20 to 30
    keyGenerator: (req) => {
        return req.user ? req.user._id.toString() : req.ip;
    },
    message: {
        success: false,
        message: 'Too many file uploads, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false },
});

/**
 * Rate limiter for messaging
 * Limits each IP to 50 messages per 15 minutes
 */
const messageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Increased from 50 to 100
    keyGenerator: (req) => {
        return req.user ? req.user._id.toString() : req.ip;
    },
    message: {
        success: false,
        message: 'Too many messages sent, please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false },
});

module.exports = {
    apiLimiter,
    authLimiter,
    jobCreationLimiter,
    uploadLimiter,
    messageLimiter,
};
