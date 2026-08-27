const rateLimit = require('express-rate-limit');

/**
 * Standard factory defaults for all rate limiters
 */
const DEFAULT_RATE_LIMITS = {
    apiMax: 300,
    apiWindowMin: 15,
    otpMax: 4,
    otpWindowMin: 10,
    authMax: 10,
    authWindowMin: 15,
    jobMax: 20,
    jobWindowHours: 1,
    uploadMax: 25,
    uploadWindowHours: 1,
    messageMax: 100,
    messageWindowMin: 15,
};

// In-memory active configuration (hot-reloaded in real-time)
let activeLimits = { ...DEFAULT_RATE_LIMITS };

/**
 * Load saved rate limits from MongoDB Setting collection on startup
 */
const loadRateLimitsFromDb = async () => {
    try {
        const Setting = require('../models/Setting');
        const setting = await Setting.findOne({ key: 'rate_limits' });
        if (setting && setting.value) {
            activeLimits = {
                ...DEFAULT_RATE_LIMITS,
                ...setting.value,
            };
            console.log('⚡ [RateLimiter] Loaded dynamic rate limits from database:', activeLimits);
        } else {
            console.log('⚡ [RateLimiter] Using default rate limits:', activeLimits);
        }
    } catch (err) {
        console.error('⚠️ [RateLimiter] Failed to load rate limits from DB, using defaults:', err.message);
    }
};

/**
 * Hot-reload active in-memory limits in real time
 */
const updateActiveRateLimits = (newLimits) => {
    activeLimits = {
        ...activeLimits,
        ...newLimits,
    };
    console.log('⚡ [RateLimiter] Updated in-memory active rate limits:', activeLimits);
    return activeLimits;
};

/**
 * Get current active and default limits
 */
const getActiveRateLimits = () => {
    return {
        active: { ...activeLimits },
        defaults: { ...DEFAULT_RATE_LIMITS },
    };
};

/**
 * Factory helper for creating clean in-memory rate limiters with standardized error responses.
 */
const createLimiter = ({
    windowMs,
    limitKey,
    defaultMax,
    message,
    keyGenerator,
    skipSuccessfulRequests = false,
}) => {
    return rateLimit({
        windowMs,
        max: () => Number(activeLimits[limitKey]) || defaultMax,
        standardHeaders: true, // Return standard RateLimit-* headers
        legacyHeaders: false,  // Disable X-RateLimit-* headers
        skip: () => process.env.NODE_ENV === 'test',
        skipSuccessfulRequests,
        keyGenerator: keyGenerator || ((req) => req.user?._id?.toString() || req.ip),
        handler: (req, res, next, options) => {
            const retryAfter = Math.ceil(windowMs / 1000);
            res.status(options.statusCode || 429).json({
                success: false,
                code: 'RATE_LIMIT_EXCEEDED',
                message: typeof message === 'string' ? message : 'Too many requests, please try again later.',
                retryAfter,
            });
        },
        validate: { keyGeneratorIpFallback: false },
    });
};

/**
 * 1. General API Rate Limiter
 * Applied globally to /api/
 */
const apiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limitKey: 'apiMax',
    defaultMax: DEFAULT_RATE_LIMITS.apiMax,
    message: 'Too many requests. Please slow down and try again later.',
});

/**
 * 2. Strict OTP Request Limiter (Protects Fast2SMS wallet & prevents spam)
 */
const otpLimiter = createLimiter({
    windowMs: 10 * 60 * 1000,
    limitKey: 'otpMax',
    defaultMax: DEFAULT_RATE_LIMITS.otpMax,
    keyGenerator: (req) => `otp:${(req.body?.mobile || req.ip || 'unknown').toString().trim()}`,
    message: 'Too many OTP requests for this number. Please wait 10 minutes before requesting again.',
});

/**
 * 3. Strict Rate Limiter for Authentication & Password / Login Attempts
 */
const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limitKey: 'authMax',
    defaultMax: DEFAULT_RATE_LIMITS.authMax,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `auth:${(req.body?.mobile || req.body?.email || req.ip || 'unknown').toString().trim()}`,
    message: 'Too many failed login attempts. Please try again after 15 minutes.',
});

/**
 * 4. Rate Limiter for Job Creation
 */
const jobCreationLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    limitKey: 'jobMax',
    defaultMax: DEFAULT_RATE_LIMITS.jobMax,
    message: 'Too many jobs posted. Please wait before posting more jobs.',
});

/**
 * 5. Rate Limiter for File Uploads
 */
const uploadLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    limitKey: 'uploadMax',
    defaultMax: DEFAULT_RATE_LIMITS.uploadMax,
    message: 'File upload limit reached. Please wait before uploading more files.',
});

/**
 * 6. Rate Limiter for Messaging
 */
const messageLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    limitKey: 'messageMax',
    defaultMax: DEFAULT_RATE_LIMITS.messageMax,
    message: 'Too many messages sent. Please slow down.',
});

module.exports = {
    DEFAULT_RATE_LIMITS,
    loadRateLimitsFromDb,
    updateActiveRateLimits,
    getActiveRateLimits,
    apiLimiter,
    otpLimiter,
    authLimiter,
    jobCreationLimiter,
    uploadLimiter,
    messageLimiter,
};
