/**
 * Validate required environment variables
 * Throws error if any required variable is missing
 */
const validateEnv = () => {
    const required = [
        'MONGO_URI',
        'JWT_SECRET',
        'PORT',
        'FRONTEND_URL',
    ];

    const optional = [
        'NODE_ENV',
        'ALLOWED_ORIGINS',
        'PAYTM_MID',
        'PAYTM_MERCHANT_KEY',
        'PAYTM_WEBSITE',
        'PAYTM_INDUSTRY_TYPE_ID',
        'PAYTM_CALLBACK_URL',
    ];

    const missing = [];
    const warnings = [];

    // Check required variables
    required.forEach(key => {
        if (!process.env[key]) {
            missing.push(key);
        }
    });

    // Check optional variables
    optional.forEach(key => {
        if (!process.env[key]) {
            warnings.push(key);
            // If it's a critical payment var in production, treat as error/warning
            if (process.env.NODE_ENV === 'production' && key.startsWith('PAYTM_')) {
                console.warn(`⚠️  Missing Paytm config: ${key}`);
            }
        }
    });

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        throw new Error('Missing required environment variables. Please check your .env file.');
    }

    if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
        console.warn('⚠️  Missing optional environment variables (some features may not work):');
        warnings.forEach(key => console.warn(`   - ${key}`));
    }

    // Validate specific formats
    if (process.env.MONGO_URI && !process.env.MONGO_URI.startsWith('mongodb')) {
        throw new Error('Invalid MONGO_URI format. Must start with mongodb:// or mongodb+srv://');
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        console.warn('⚠️  JWT_SECRET should be at least 32 characters long for better security');
    }

    // Production checks
    if (process.env.NODE_ENV === 'production') {
        if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('localhost')) {
            console.warn('⚠️  FRONTEND_URL is set to localhost in production mode!');
        }
        if (process.env.PAYTM_CALLBACK_URL && process.env.PAYTM_CALLBACK_URL.includes('localhost')) {
            console.warn('⚠️  PAYTM_CALLBACK_URL is set to localhost in production mode!');
        }
    }

    console.log('✅ Environment variables validated successfully');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Port: ${process.env.PORT || 5000}`);
};

/**
 * Get environment-specific configuration
 */
const getConfig = () => {
    return {
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '5000', 10),
        mongoUri: process.env.MONGO_URI,
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiry: process.env.JWT_EXPIRY || '30d',
        allowedOrigins: process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3000', 'http://localhost:3001'],
    };
};


module.exports = {
    validateEnv,
    getConfig,
};
