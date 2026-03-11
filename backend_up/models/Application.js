const mongoose = require('mongoose');
const { APPLICATION_STATUSES } = require('../constants/statusEnums');

const applicationSchema = mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Job',
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'pending',
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    selectedCV: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ worker: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
