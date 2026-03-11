const mongoose = require('mongoose');
const { SUBSCRIPTION_STATUSES } = require('../constants/statusEnums');

const subscriptionSchema = new mongoose.Schema(
  {
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planType: {
      type: String,
      enum: ['free', 'basic', 'pro', 'premium'],

      required: true,
    },
    // Limits based on plan
    maxActiveJobs: {
      type: Number,
      default: 1, // Only 1 active job at a time for all plans
    },
    maxDatabaseUnlocks: {
      type: Number,
      required: true,
    },
    maxLocationChanges: {
      type: Number,
      default: 5, // 3-5 times can change job location
    },
    // Usage tracking
    databaseUnlocksUsed: {
      type: Number,
      default: 0,
    },
    locationChangesUsed: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      default: 0,
    },
    features: [
      {
        type: String,
      },
    ],
    // Track unlocked workers to prevent double counting
    unlockedWorkers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Worklog Add-on Expiry (For non-Premium plans)
    worklogAccessExpiry: {
      type: Date,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field to provide 'plan' as alias for 'planType'
subscriptionSchema.virtual('plan').get(function () {
  return this.planType;
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
