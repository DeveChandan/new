const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userName: {
      type: String,
    },
    userMobile: {
      type: String,
    },
    role: {
      type: String,
      enum: ['worker', 'employer', 'admin', 'guest'],
      default: 'guest',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['auth', 'job', 'application', 'worklog', 'payment', 'profile', 'search', 'system'],
      default: 'system',
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    platform: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast Admin queries and analytics
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
