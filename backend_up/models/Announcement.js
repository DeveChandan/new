const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    type: {
        type: String,
        enum: ['maintenance', 'info', 'warning', 'critical', 'success'],
        default: 'info'
    },
    targetAudience: {
        type: String,
        enum: ['all', 'worker', 'employer'],
        default: 'all'
    },
    platform: {
        type: String,
        enum: ['all', 'web', 'mobile'],
        default: 'all'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDismissible: {
        type: Boolean,
        default: true
    },
    actionUrl: {
        type: String,
        trim: true
    },
    actionLabel: {
        type: String,
        trim: true,
        default: 'Learn More'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    sendPush: {
        type: Boolean,
        default: false
    },
    pushDeliveryStats: {
        totalRecipients: { type: Number, default: 0 },
        inAppSent: { type: Number, default: 0 },
        pushSent: { type: Number, default: 0 }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for query performance on active announcements
announcementSchema.index({ isActive: 1, startDate: 1, endDate: 1, targetAudience: 1, platform: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
