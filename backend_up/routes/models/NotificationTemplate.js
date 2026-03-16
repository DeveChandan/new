const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    targetAudience: {
        type: String,
        enum: ['worker', 'employer'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    actionUrl: {
        type: String, // Optional URL to redirect to
        trim: true
    },
    variables: [{
        type: String,
        // Common variables: {name}, {jobRole}, {location}, {companyName}, {jobTitle}
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for faster queries
notificationTemplateSchema.index({ targetAudience: 1 });
notificationTemplateSchema.index({ createdBy: 1 });

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
