const Announcement = require('../models/Announcement');
const { User } = require('../models/User');
const { getIo } = require('../socket');
const notificationService = require('../services/notificationService');
const { logActivity } = require('../services/activityService');

/**
 * GET /api/announcements/active
 * Public / client endpoint to fetch active announcements & maintenance alerts
 */
const getActiveAnnouncements = async (req, res) => {
    try {
        const platform = (req.query.platform || 'all').toLowerCase();
        const role = (req.query.role || req.user?.role || 'all').toLowerCase();
        const now = new Date();

        const query = {
            isActive: true,
            startDate: { $lte: now },
            $or: [
                { endDate: { $exists: false } },
                { endDate: null },
                { endDate: { $gte: now } }
            ]
        };

        if (platform !== 'all') {
            query.platform = { $in: ['all', platform] };
        }

        if (role !== 'all') {
            query.targetAudience = { $in: ['all', role] };
        }

        const announcements = await Announcement.find(query)
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        res.status(200).json({
            success: true,
            count: announcements.length,
            announcements
        });
    } catch (error) {
        console.error('[AnnouncementController] Error fetching active announcements:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/announcements/admin
 * Admin endpoint to list all past & active announcements
 */
const getAllAnnouncements = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 20;
        const skip = (page - 1) * pageSize;

        const [announcements, total] = await Promise.all([
            Announcement.find()
                .populate('createdBy', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .lean(),
            Announcement.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            announcements,
            total,
            page,
            pages: Math.ceil(total / pageSize)
        });
    } catch (error) {
        console.error('[AnnouncementController] Error fetching all announcements:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/announcements/admin
 * Admin endpoint to create and broadcast a new service alert or maintenance notification
 */
const createAnnouncement = async (req, res) => {
    try {
        const {
            title,
            message,
            type = 'info',
            targetAudience = 'all',
            platform = 'all',
            isDismissible = true,
            actionUrl,
            actionLabel = 'Learn More',
            startDate,
            endDate,
            sendPush = false
        } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required' });
        }

        const announcement = await Announcement.create({
            title,
            message,
            type,
            targetAudience,
            platform,
            isActive: true,
            isDismissible,
            actionUrl,
            actionLabel,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : undefined,
            sendPush,
            createdBy: req.user._id
        });

        // 1. Broadcast real-time event via Socket.IO
        try {
            const io = getIo();
            io.emit('announcement:active', announcement);
        } catch (socketErr) {
            console.warn('[AnnouncementController] Socket broadcast error:', socketErr.message);
        }

        // 2. If sendPush is true, dispatch notifications to all target users in batches
        let totalRecipients = 0;
        let inAppSent = 0;

        if (sendPush) {
            const userQuery = {};
            if (targetAudience !== 'all') {
                userQuery.role = targetAudience;
            }

            const recipients = await User.find(userQuery).select('_id role email mobile');
            totalRecipients = recipients.length;

            const batchSize = 30;
            for (let i = 0; i < recipients.length; i += batchSize) {
                const batch = recipients.slice(i, i + batchSize);
                await Promise.allSettled(batch.map(async (u) => {
                    try {
                        await notificationService.createAndSend({
                            userId: u._id,
                            userRole: u.role,
                            type: 'system',
                            title: `[Service Notice] ${title}`,
                            message,
                            actionUrl: actionUrl || null
                        });
                        inAppSent++;
                    } catch (e) {
                        // ignore individual failures
                    }
                }));
            }

            announcement.pushDeliveryStats = {
                totalRecipients,
                inAppSent,
                pushSent: inAppSent
            };
            await announcement.save();
        }

        // 3. Log admin activity
        logActivity({
            user: req.user._id,
            userName: req.user.name,
            role: 'admin',
            action: 'BROADCAST_ANNOUNCEMENT_CREATED',
            category: 'system',
            description: `Admin created broadcast announcement: "${title}" (${type})`,
            metadata: {
                announcementId: announcement._id,
                type,
                targetAudience,
                platform,
                sendPush,
                totalRecipients
            },
            req
        });

        res.status(201).json({
            success: true,
            message: 'Announcement broadcasted successfully',
            announcement
        });
    } catch (error) {
        console.error('[AnnouncementController] Error creating announcement:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PUT /api/announcements/admin/:id
 * Admin endpoint to update an announcement
 */
const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByIdAndUpdate(id, req.body, { new: true });

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        // Re-broadcast updated announcement via Socket.io
        try {
            const io = getIo();
            io.emit('announcement:active', announcement);
        } catch (socketErr) {
            // ignore
        }

        res.status(200).json({
            success: true,
            message: 'Announcement updated successfully',
            announcement
        });
    } catch (error) {
        console.error('[AnnouncementController] Error updating announcement:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PATCH /api/announcements/admin/:id/toggle
 * Admin endpoint to toggle active status on/off
 */
const toggleAnnouncementStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findById(id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        announcement.isActive = !announcement.isActive;
        await announcement.save();

        try {
            const io = getIo();
            io.emit('announcement:active', announcement);
        } catch (socketErr) {
            // ignore
        }

        res.status(200).json({
            success: true,
            message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'} successfully`,
            announcement
        });
    } catch (error) {
        console.error('[AnnouncementController] Error toggling announcement:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/announcements/admin/:id
 * Admin endpoint to delete an announcement
 */
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByIdAndDelete(id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('[AnnouncementController] Error deleting announcement:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getActiveAnnouncements,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    toggleAnnouncementStatus,
    deleteAnnouncement
};
