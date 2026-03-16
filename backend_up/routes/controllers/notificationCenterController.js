const { User } = require('../models/User');
const Job = require('../models/Job');
const NotificationTemplate = require('../models/NotificationTemplate');
const notificationService = require('../services/notificationService');
const whatsappService = require('../services/whatsappService');

// Get filtered workers based on job role and location
const getFilteredWorkers = async (req, res) => {
    try {
        const { workerTypes, location, radius } = req.body;

        let query = { role: 'worker' };

        // Filter by worker types (job roles)
        if (workerTypes && workerTypes.length > 0) {
            query.workerType = { $in: workerTypes };
        }

        // Filter by location if provided (text search)
        if (location) {
            // Check formattedAddress, city, or locationName
            query.$or = [
                { 'location.city': { $regex: new RegExp(location, 'i') } },
                { 'location.formattedAddress': { $regex: new RegExp(location, 'i') } },
                { 'locationName': { $regex: new RegExp(location, 'i') } }
            ];
        }

        const workers = await User.find(query)
            .select('name email mobile workerType location')
            .limit(1000); // Safety limit

        res.status(200).json({
            count: workers.length,
            workers
        });
    } catch (error) {
        console.error('Error filtering workers:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get filtered employers based on active job openings
const getFilteredEmployers = async (req, res) => {
    try {
        const { hasActiveJobs, jobTypes, location } = req.body;

        let employerIds = null; // null means no job-based filtering applied yet

        // 1. Filter by Job Types / Active Jobs
        if (hasActiveJobs || (jobTypes && jobTypes.length > 0)) {
            const jobQuery = {};

            if (hasActiveJobs) {
                jobQuery.status = { $in: ['open', 'in-progress'] };
            }

            if (jobTypes && jobTypes.length > 0) {
                jobQuery.workerType = { $in: jobTypes };
            }

            // Find all employers who have matching jobs
            employerIds = await Job.find(jobQuery).distinct('employer');
        }

        const query = { role: 'employer' };

        // 2. Apply Job-based ID filter if any
        if (employerIds !== null) {
            query._id = { $in: employerIds };
        }

        // 3. Filter by Location
        if (location) {
            query.$or = [
                { 'companyDetails.address.city': { $regex: new RegExp(location, 'i') } },
                { 'companyDetails.address.state': { $regex: new RegExp(location, 'i') } },
                { 'locationName': { $regex: new RegExp(location, 'i') } }
            ];
        }

        const employers = await User.find(query)
            .select('name email mobile companyName')
            .limit(1000);

        res.status(200).json({
            count: employers.length,
            employers
        });
    } catch (error) {
        console.error('Error filtering employers:', error);
        res.status(500).json({ message: error.message });
    }
};

// Replace variables in message
const replaceVariables = (template, user, extraData = {}) => {
    let message = template;

    // Replace common variables
    message = message.replace(/{name}/g, user.name || '');
    message = message.replace(/{email}/g, user.email || '');
    message = message.replace(/{mobile}/g, user.mobile || '');

    // Worker-specific
    if (user.workerType) {
        message = message.replace(/{jobRole}/g, user.workerType.join(', ') || '');
    }

    // Location replacement with fallbacks
    let locationStr = '';
    if (user.location && user.location.city) {
        locationStr = user.location.city;
    } else if (user.location && user.location.formattedAddress) {
        locationStr = user.location.formattedAddress;
    } else if (user.locationName) {
        locationStr = user.locationName;
    } else if (user.companyDetails && user.companyDetails.address && user.companyDetails.address.city) {
        locationStr = user.companyDetails.address.city;
    }

    // Replace {location} with found value or generic fallback
    message = message.replace(/{location}/g, locationStr || 'your area');

    // Employer-specific
    if (user.companyName) {
        message = message.replace(/{companyName}/g, user.companyName || '');
    }

    // Extra data
    Object.keys(extraData).forEach(key => {
        const regex = new RegExp(`{${key}}`, 'g');
        message = message.replace(regex, extraData[key] || '');
    });

    return message;
};

// Send bulk notifications
const sendBulkNotification = async (req, res) => {
    try {
        const { userIds, title, message, channels, actionUrl } = req.body;

        // Validate
        if (!userIds || userIds.length === 0) {
            return res.status(400).json({ message: 'No recipients selected' });
        }

        if (!channels || (!channels.inApp && !channels.whatsApp)) {
            return res.status(400).json({ message: 'At least one delivery channel must be selected' });
        }

        const users = await User.find({ _id: { $in: userIds } });

        let inAppSuccess = 0;
        let inAppFailed = 0;
        let whatsAppSuccess = 0;
        let whatsAppFailed = 0;

        // Send notifications
        for (const user of users) {
            const personalizedTitle = replaceVariables(title, user);
            const personalizedMessage = replaceVariables(message, user);

            // In-app notification
            if (channels.inApp) {
                try {
                    await notificationService.createAndSend({
                        userId: user._id,
                        userRole: user.role,
                        type: 'system',
                        title: personalizedTitle,
                        message: personalizedMessage,
                        actionUrl: actionUrl || null
                    });
                    inAppSuccess++;
                } catch (error) {
                    console.error(`Failed to send in-app notification to ${user.email}:`, error);
                    inAppFailed++;
                }
            }

            // WhatsApp message
            if (channels.whatsApp && user.mobile) {
                try {
                    await whatsappService.sendMessage(
                        user.mobile,
                        `*${personalizedTitle}*\n\n${personalizedMessage}`
                    );
                    whatsAppSuccess++;
                } catch (error) {
                    console.error(`Failed to send WhatsApp to ${user.mobile}:`, error);
                    whatsAppFailed++;
                }
            }
        }

        res.status(200).json({
            message: 'Bulk notification sent',
            results: {
                totalRecipients: users.length,
                inApp: { success: inAppSuccess, failed: inAppFailed },
                whatsApp: { success: whatsAppSuccess, failed: whatsAppFailed }
            }
        });
    } catch (error) {
        console.error('Error sending bulk notification:', error);
        res.status(500).json({ message: error.message });
    }
};

// Preview notification with sample data
const previewNotification = async (req, res) => {
    try {
        const { title, message, targetAudience } = req.body;

        // Get a sample user
        const sampleUser = await User.findOne({ role: targetAudience });

        if (!sampleUser) {
            return res.status(404).json({ message: 'No sample user found' });
        }

        const previewTitle = replaceVariables(title, sampleUser);
        const previewMessage = replaceVariables(message, sampleUser);

        res.status(200).json({
            preview: {
                title: previewTitle,
                message: previewMessage,
                sampleUser: {
                    name: sampleUser.name,
                    role: sampleUser.role
                }
            }
        });
    } catch (error) {
        console.error('Error previewing notification:', error);
        res.status(500).json({ message: error.message });
    }
};

// Template CRUD operations
const createTemplate = async (req, res) => {
    try {
        const { name, targetAudience, title, message, variables, actionUrl } = req.body;

        const template = await NotificationTemplate.create({
            name,
            targetAudience,
            title,
            message,
            variables: variables || [],
            actionUrl,
            createdBy: req.user._id
        });

        res.status(201).json(template);
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ message: error.message });
    }
};

const getTemplates = async (req, res) => {
    try {
        const { targetAudience } = req.query;

        const query = {};
        if (targetAudience) {
            query.targetAudience = targetAudience;
        }

        const templates = await NotificationTemplate.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, title, message, variables, actionUrl } = req.body;

        const template = await NotificationTemplate.findByIdAndUpdate(
            id,
            { name, title, message, variables, actionUrl },
            { new: true }
        );

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.status(200).json(template);
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ message: error.message });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const template = await NotificationTemplate.findByIdAndDelete(id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.status(200).json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getFilteredWorkers,
    getFilteredEmployers,
    sendBulkNotification,
    previewNotification,
    createTemplate,
    getTemplates,
    updateTemplate,
    deleteTemplate
};
