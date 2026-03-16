const mongoose = require('mongoose');
const { JOB_WORK_TYPES, WORKER_TYPES, JOB_STATUSES, JOB_WORKER_STATUSES } = require('../constants/statusEnums');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    skills: [
      {
        type: String,
        required: true,
      },
    ],
    workerType: [
      {
        type: String,
        enum: WORKER_TYPES,
      },
    ],
    salary: {
      type: Number,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
      address: {
        type: String,
      },
    },
    workType: {
      type: String,
      enum: JOB_WORK_TYPES,
      required: true,
    },
    durationDays: { // New field
      type: Number,
      required: function () { return this.workType === 'temporary'; }, // Required only for temporary jobs
      min: 1, // Minimum 1 day
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    minExperience: {
      type: Number,
      default: 0,
    },
    maxExperience: {
      type: Number,
      default: 0,
    },
    totalOpenings: {
      type: Number,
      required: true,
      default: 1,
    },
    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: JOB_STATUSES,
      default: 'open',
    },
    otpVerificationRequired: {
      type: Boolean,
      default: false,
    },
    geoTaggingRequired: {
      type: Boolean,
      default: false,
    },
    workers: [{ // Renamed 'hiredWorkers' to 'workers' for clarity as it's an array
      workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      status: {
        type: String,
        enum: JOB_WORKER_STATUSES,
        default: 'open'
      },
      assignedAt: { // New field to track when the worker was assigned
        type: Date,
        default: Date.now
      },
      completedAt: { // New field to track when the worker completed their part
        type: Date
      }
    }],
    isApproved: { // Field to indicate if the job has been approved by an admin
      type: Boolean,
      default: false,
    },
    lastEmployerRatingPromptDate: { // Date when employer was last prompted to rate
      type: Date,
    },
    lastWorkerRatingPromptDate: { // Date when worker was last prompted to rate
      type: Date,
    },
    ratingPromptThresholdDays: { // For permanent jobs, how many worklogs before next rating prompt
      type: Number,
      default: 3,
    },
    // Temporary field for backward compatibility with old documents
    hiredWorkers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      select: false // Don't return by default
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Post-init hook to migrate hiredWorkers to workers array for old documents
jobSchema.post('init', function (doc) {
  // Check if hiredWorkers exists and workers is empty or missing
  if (doc.hiredWorkers && doc.hiredWorkers.length > 0 && (!doc.workers || doc.workers.length === 0)) {
    doc.workers = doc.hiredWorkers.map(workerId => ({
      workerId: workerId,
      status: 'in-progress', // Default status for migrated workers
      assignedAt: doc.createdAt, // Use job creation date as assigned date
      completedAt: null // Assume not completed yet
    }));
    // Clear hiredWorkers from the document instance to avoid confusion
    doc.hiredWorkers = undefined;
  }
});

// Create 2dsphere index on location field for geospatial queries
// Create indexes for efficient queries
jobSchema.index({ employer: 1, status: 1 });
jobSchema.index({ location: '2dsphere' });

jobSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'job',
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
