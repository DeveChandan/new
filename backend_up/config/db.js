const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Initialize indexes after connection
    await initializeIndexes();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const initializeIndexes = async () => {
  try {
    console.log('Initializing database indexes...');

    const db = mongoose.connection.db;

    // Create geospatial index on Job.location for $near queries
    const jobsCollection = db.collection('jobs');
    await jobsCollection.createIndex({ location: '2dsphere' });
    console.log('✅ Created 2dsphere index on jobs.location');

    // Create compound indexes for common queries
    await jobsCollection.createIndex({ employer: 1, status: 1 });
    console.log('✅ Created compound index on jobs.employer+status');

    await jobsCollection.createIndex({ status: 1, createdAt: -1 });
    console.log('✅ Created compound index on jobs.status+createdAt');

    // Application indexes
    const applicationsCollection = db.collection('applications');
    await applicationsCollection.createIndex({ worker: 1, job: 1 }, { unique: true });
    console.log('✅ Created unique compound index on applications.worker+job');

    await applicationsCollection.createIndex({ job: 1, status: 1 });
    console.log('✅ Created compound index on applications.job+status');

    // Notification indexes
    const notificationsCollection = db.collection('notifications');
    await notificationsCollection.createIndex({ userId: 1, isRead: 1, createdAt: -1 });
    console.log('✅ Created compound index on notifications.userId+isRead+createdAt');

    // WorkLog indexes
    const workLogsCollection = db.collection('worklogs');
    await workLogsCollection.createIndex({ job: 1, worker: 1, date: -1 });
    console.log('✅ Created compound index on worklogs.job+worker+date');

    console.log('✅ All database indexes initialized successfully');
  } catch (error) {
    // Log error but don't crash - indexes might already exist
    if (error.code === 85 || error.code === 86) {
      console.log('ℹ️  Some indexes already exist, skipping...');
    } else {
      console.error('⚠️  Error initializing indexes:', error.message);
    }
  }
};

module.exports = connectDB;
