const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const http = require('http');
const path = require('path');
const { initSocket, getIo } = require('./socket');
const resetOtps = require('./cron/otpReset');
const dailyWorkLog = require('./cron/dailyWorkLog');
const ratingPrompt = require('./cron/ratingPrompt');
const notificationCleanup = require('./cron/notificationCleanup');
const dataCleanup = require('./cron/dataCleanup');
const { errorHandler, notFound, handleUnhandledRejections, handleUncaughtExceptions } = require('./middleware/errorHandler');
const { validateEnv } = require('./config/validateEnv');
const { securityHeaders, corsOptions, sanitizeRequest, requestLogger } = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiter');
const { performanceMonitoring, getMetrics } = require('./middleware/monitoring');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Validate environment variables before starting
try {
  validateEnv();
} catch (error) {
  console.error('Failed to start server:', error.message);
  process.exit(1);
}

// Handle process-level errors
handleUnhandledRejections();
handleUncaughtExceptions();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
initSocket(server);

// Security middleware (must be early in the chain)
app.use(securityHeaders);
app.use(performanceMonitoring); // Add performance monitoring
app.use(requestLogger);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request sanitization
app.use(sanitizeRequest);

// Static files - CORS middleware MUST come before express.static
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for ALL responses from /uploads
  // Note: cannot use credentials:true with wildcard origin per CORS spec
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
  });

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Serve static files AFTER CORS headers are set
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Import routes
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const documentRoutes = require('./routes/documentRoutes');
const geolocationRoutes = require('./routes/geolocationRoutes');
const workLogRoutes = require('./routes/workLogRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const notificationCenterRoutes = require('./routes/notificationCenterRoutes');
const translationRoutes = require('./routes/translationRoutes');
const siteRoutes = require('./routes/siteRoutes');

// API routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/geolocation', geolocationRoutes);
app.use('/api/worklogs', workLogRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notification-center', notificationCenterRoutes);
app.use('/api/translate', translationRoutes);
app.use('/api/site', siteRoutes);

// Favicon handler (prevent 404 errors)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Shramik Seva API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Metrics endpoint (protected - only in development or with valid auth)
app.get('/api/metrics', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    try {
      const token = authHeader.split(' ')[1];
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Only allow admin access
      if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden — admin only' });
      }
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  }

  const metrics = getMetrics();
  res.json({
    success: true,
    metrics,
  });
});

// 404 handler - must be after all routes
app.use(notFound);

// Error handler - must be last
app.use(errorHandler);

// Initialize cron jobs
console.log('🔄 Initializing cron jobs...');
resetOtps();
dailyWorkLog();
ratingPrompt();
notificationCleanup();
dataCleanup();
console.log('✅ All cron jobs initialized');

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Shramik Seva Backend Server');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
});