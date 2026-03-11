const mongoose = require('mongoose');
const { WORKLOG_STATUSES } = require('../constants/statusEnums');

const workLogSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    startPhoto: {
      type: String,
    },
    startPhotoLocation: {
      latitude: String,
      longitude: String,
    },
    startPhotoAddress: {
      type: String,
    },
    endPhoto: {
      type: String,
    },
    endPhotoLocation: {
      latitude: String,
      longitude: String,
    },
    endPhotoAddress: {
      type: String,
    },
    startOtp: {
      type: String,
    },
    endOtp: {
      type: String,
    },
    startOtpVerified: {
      type: Boolean,
      default: false,
    },
    endOtpVerified: {
      type: Boolean,
      default: false,
    },
    startOtpExpires: {
      type: Date,
    },
    endOtpExpires: {
      type: Date,
    },
    status: {
      type: String,
      enum: WORKLOG_STATUSES,
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const WorkLog = mongoose.model('WorkLog', workLogSchema);

module.exports = WorkLog;
