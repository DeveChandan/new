const notificationService = require('../services/notificationService');
const { getLocale } = require('../utils');
const { translateNotification } = require('../services/translationService');

/**
 * Get all notifications for authenticated user
 * GET /api/notifications
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page, limit, type, isRead } = req.query;

        const result = await notificationService.getNotifications(userId, {
            page,
            limit,
            type,
            isRead
        });

        // Translation support
        const locale = getLocale(req);
        if (locale !== 'en' && result.notifications) {
            result.notifications = await Promise.all(
                result.notifications.map(notif => translateNotification(notif, locale))
            );
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error in getNotifications:', error);
        res.status(500).json({
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await notificationService.getUnreadCount(userId);

        res.status(200).json({ count });
    } catch (error) {
        console.error('Error in getUnreadCount:', error);
        res.status(500).json({
            message: 'Failed to get unread count',
            error: error.message
        });
    }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const notificationId = req.params.id;

        const notification = await notificationService.markAsRead(notificationId, userId);

        res.status(200).json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Error in markAsRead:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            message: error.message || 'Failed to mark notification as read'
        });
    }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/mark-all-read
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const updatedCount = await notificationService.markAllAsRead(userId);

        res.status(200).json({
            success: true,
            updatedCount
        });
    } catch (error) {
        console.error('Error in markAllAsRead:', error);
        res.status(500).json({
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        const notificationId = req.params.id;

        await notificationService.deleteNotification(notificationId, userId);

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteNotification:', error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            message: error.message || 'Failed to delete notification'
        });
    }
};

/**
 * Clear all read notifications
 * DELETE /api/notifications/clear-all
 */
exports.clearReadNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const deletedCount = await notificationService.clearReadNotifications(userId);

        res.status(200).json({
            success: true,
            deletedCount,
            message: `${deletedCount} read notification(s) cleared`
        });
    } catch (error) {
        console.error('Error in clearReadNotifications:', error);
        res.status(500).json({
            message: 'Failed to clear read notifications',
            error: error.message
        });
    }
};
