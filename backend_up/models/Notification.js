const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    userRole: {
        type: String,
        enum: ['worker', 'employer', 'admin'],
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            // Job & Applications
            'application_submitted',
            'application_approved',
            'application_rejected',
            'new_application',

            // Hiring
            'hire_request_received',
            'hire_request_accepted',
            'hire_request_rejected',
            'worker_hired',

            // Work Progress
            'work_started',
            'work_ended',
            'otp_generated',
            'work_log_updated',

            // Ratings
            'rating_received',
            'rating_prompt',

            // Messages
            'new_message',
            'new_conversation',

            // Documents
            'document_verified',
            'document_rejected',
            'document_expiring',

            // Payments
            'payment_received',
            'payment_failed',
            'subscription_created',
            'subscription_renewed',
            'subscription_renewed',
            'subscription_expiring',
            'subscription_updated',

            // Job Management
            'job_approved',
            'job_rejected',
            'job_expiring',
            'job_filled',

            // Profile
            'profile_approved',
            'profile_rejected',
            'system', // Generic system notifications
            'availability_changed',

            // Disputes
            'dispute_opened',
            'dispute_resolved',
            'dispute_status_changed'
        ]
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedModel'
    },
    relatedModel: {
        type: String,
        enum: ['Job', 'Application', 'WorkLog', 'Rating', 'Message', 'Document', 'User', 'Subscription', 'Conversation', 'Invoice', 'Dispute']
    },
    actionUrl: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, type: 1 });

// Auto-delete read notifications older than 7 days
notificationSchema.index({ createdAt: 1, isRead: 1 }, {
    expireAfterSeconds: 604800, // 7 days
    partialFilterExpression: { isRead: true }
});

module.exports = mongoose.model('Notification', notificationSchema);
