const helmet = require('helmet');

/**
 * Security headers configuration
 * Uses Helmet to set various HTTP headers for security
 */
const securityHeaders = helmet({
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:', process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : ''],
            connectSrc: ["'self'", process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : ''],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    // ALLOW CROSS-ORIGIN RESOURCES (Fix for image display)
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Prevent clickjacking
    frameguard: {
        action: 'deny',
    },
    // Hide X-Powered-By header
    hidePoweredBy: true,
    // Prevent MIME type sniffing
    noSniff: true,
    // Enable XSS filter
    xssFilter: true,
    // Enforce HTTPS (only in production)
    hsts: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    } : false,
});

/**
 * CORS configuration
 */
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.1.5:3000'];

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

/**
 * Request sanitization middleware
 * Prevents NoSQL injection and XSS attacks
 */
const sanitizeRequest = (req, res, next) => {
    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                // Remove potential NoSQL injection operators
                req.query[key] = req.query[key].replace(/\$/g, '');
            }
        });
    }

    // Sanitize body
    if (req.body) {
        sanitizeObject(req.body);
    }

    next();
};

/**
 * Recursively sanitize object
 */
const sanitizeObject = (obj) => {
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
            // Remove potential NoSQL injection operators
            obj[key] = obj[key].replace(/\$/g, '');
            // Basic XSS prevention (more comprehensive sanitization should be done on frontend)
            obj[key] = obj[key].replace(/<script>/gi, '').replace(/<\/script>/gi, '');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
        }
    });
};

/**
 * Request logging middleware (for production monitoring)
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            timestamp: new Date().toISOString(),
        };

        // Log errors and slow requests
        if (res.statusCode >= 400 || duration > 1000) {
            console.warn('⚠️  Request:', JSON.stringify(logData));
        } else if (process.env.NODE_ENV === 'development') {
            console.log('📝 Request:', JSON.stringify(logData));
        }
    });

    next();
};

module.exports = {
    securityHeaders,
    corsOptions,
    sanitizeRequest,
    requestLogger,
};
