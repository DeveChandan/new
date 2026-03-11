/**
 * Global error handler middleware
 * Catches all errors and returns consistent error responses
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `${field} already exists`,
            error: 'Duplicate key error'
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            error: err.message
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: err.message
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired',
            error: err.message
        });
    }

    // Default error
    const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejections = () => {
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        // Don't exit in production, just log
        if (process.env.NODE_ENV === 'development') {
            process.exit(1);
        }
    });
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtExceptions = () => {
    process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught Exception:', error);
        // Exit on uncaught exceptions
        process.exit(1);
    });
};

module.exports = {
    errorHandler,
    notFound,
    handleUnhandledRejections,
    handleUncaughtExceptions
};
