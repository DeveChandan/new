const { User } = require('../models/User');
const Job = require('../models/Job');
const NotificationTemplate = require('../models/NotificationTemplate');
const notificationService = require('../services/notificationService');
const whatsappService = require('../services/whatsappService');
const { logActivity } = require('../services/activityService');

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
            // Check city, formattedAddress, or locationName
            query.$or = [
                { 'city': { $regex: new RegExp(location, 'i') } },
                { 'location.city': { $regex: new RegExp(location, 'i') } },
                { 'location.formattedAddress': { $regex: new RegExp(location, 'i') } },
                { 'locationName': { $regex: new RegExp(location, 'i') } }
            ];
        }

        const workers = await User.find(query)
            .select('name email mobile workerType location locationName city state expectedSalary')
            .limit(1000); // Safety limit

        const formattedWorkers = workers.map(worker => {
            const wObj = worker.toObject ? worker.toObject() : worker;
            let resolvedCity = wObj.city || (wObj.location && wObj.location.city) || '';
            if (!resolvedCity && wObj.locationName) {
                resolvedCity = wObj.locationName.split(',')[0].trim();
            }
            return {
                ...wObj,
                city: resolvedCity || 'N/A'
            };
        });

        res.status(200).json({
            count: formattedWorkers.length,
            workers: formattedWorkers
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
            .select('name email mobile companyName companyDetails locationName location')
            .limit(1000);

        const formattedEmployers = employers.map(emp => {
            const eObj = emp.toObject ? emp.toObject() : emp;
            let resolvedCity = eObj.companyDetails?.address?.city || (eObj.location && eObj.location.city) || '';
            if (!resolvedCity && eObj.locationName) {
                resolvedCity = eObj.locationName.split(',')[0].trim();
            }
            return {
                ...eObj,
                city: resolvedCity || 'N/A'
            };
        });

        res.status(200).json({
            count: formattedEmployers.length,
            employers: formattedEmployers
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
        const { userIds, title, message, channels, actionUrl, type } = req.body;

        // Validate
        if (!userIds || userIds.length === 0) {
            return res.status(400).json({ message: 'No recipients selected' });
        }

        const hasInApp = !!channels?.inApp;
        const hasPush = !!(channels?.push || channels?.pushNotification);
        const hasWhatsApp = !!channels?.whatsApp;

        if (!channels || (!hasInApp && !hasPush && !hasWhatsApp)) {
            return res.status(400).json({ message: 'At least one delivery channel must be selected' });
        }

        const users = await User.find({ _id: { $in: userIds } });

        let inAppSuccess = 0;
        let inAppFailed = 0;
        let pushSuccess = 0;
        let pushFailed = 0;
        let whatsAppSuccess = 0;
        let whatsAppFailed = 0;

        const notifType = type || 'system';

        // Send notifications concurrently in batches of 25 to optimize throughput
        const batchSize = 25;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            await Promise.allSettled(batch.map(async (user) => {
                const personalizedTitle = replaceVariables(title, user);
                const personalizedMessage = replaceVariables(message, user);

                let createdNotif = null;

                // 1. In-app notification (DB save + Socket.IO real-time emission)
                if (hasInApp) {
                    try {
                        createdNotif = await notificationService.createNotification({
                            userId: user._id,
                            userRole: user.role,
                            type: notifType,
                            title: personalizedTitle,
                            message: personalizedMessage,
                            actionUrl: actionUrl || null
                        });
                        notificationService.sendNotification(user._id, createdNotif);
                        inAppSuccess++;
                    } catch (error) {
                        console.error(`Failed to send in-app notification to ${user.email}:`, error.message);
                        inAppFailed++;
                    }
                }

                // 2. Mobile Push Notification (Expo Push API to all registered user devices)
                // Always fires if explicitly selected OR when In-App notification is sent
                if (hasPush || hasInApp) {
                    try {
                        const notifPayload = createdNotif || {
                            type: notifType,
                            title: personalizedTitle,
                            message: personalizedMessage,
                            actionUrl: actionUrl || null
                        };
                        await notificationService.sendPushNotification(user._id, notifPayload);
                        pushSuccess++;
                    } catch (error) {
                        console.error(`Failed to send push notification to ${user.email}:`, error.message);
                        pushFailed++;
                    }
                }

                // 3. WhatsApp message
                if (hasWhatsApp && user.mobile) {
                    try {
                        const waResult = await whatsappService.sendAdminAnnouncement(
                            user.mobile,
                            personalizedTitle,
                            personalizedMessage
                        );
                        if (waResult?.success) {
                            whatsAppSuccess++;
                        } else {
                            whatsAppFailed++;
                        }
                    } catch (error) {
                        console.error(`Failed to send WhatsApp to ${user.mobile}:`, error.message);
                        whatsAppFailed++;
                    }
                }
            }));
        }

        // Audit Log
        logActivity({
            user: req.user._id,
            userName: req.user.name,
            userMobile: req.user.mobile,
            role: 'admin',
            action: 'BULK_NOTIFICATION_SENT',
            category: 'system',
            description: `Admin sent bulk notification to ${users.length} recipients across channels: ${[hasInApp && 'In-App', (hasPush || hasInApp) && 'Push', hasWhatsApp && 'WhatsApp'].filter(Boolean).join(', ')}`,
            metadata: {
                totalRecipients: users.length,
                channels,
                type: notifType,
                inAppSuccess,
                inAppFailed,
                pushSuccess,
                pushFailed,
                whatsAppSuccess,
                whatsAppFailed
            },
            req
        });

        res.status(200).json({
            message: 'Bulk notification sent',
            results: {
                totalRecipients: users.length,
                inApp: { success: inAppSuccess, failed: inAppFailed },
                push: { success: pushSuccess, failed: pushFailed },
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
