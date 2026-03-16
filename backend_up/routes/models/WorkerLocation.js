const mongoose = require('mongoose');

const workerLocationSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Create a compound index to quickly find the latest location for a worker on a specific job
workerLocationSchema.index({ worker: 1, job: 1, timestamp: -1 });

const WorkerLocation = mongoose.model('WorkerLocation', workerLocationSchema);

module.exports = WorkerLocation;