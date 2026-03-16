const Notification = require('../models/Notification');
const { getIo } = require('../socket');
const { User } = require('../models/User');
const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client (optional accessToken can be provided if needed)
let expo = new Expo();

/**
 * Notification Service
 * Centralized service for creating and managing notifications
 */

class NotificationService {
    /**
     * Create a notification in the database
     * @param {Object} data - Notification data
     * @returns {Promise<Object>} Created notification
     */
    async createNotification(data) {
        try {
            const notification = new Notification({
                userId: data.userId,
                userRole: data.userRole,
                type: data.type,
                title: data.title,
                message: data.message,
                relatedId: data.relatedId,
                relatedModel: data.relatedModel,
                actionUrl: data.actionUrl,
                metadata: data.metadata || {}
            });

            await notification.save();
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Send notification via Socket.io
     * @param {String} userId - User ID to send notification to
     * @param {Object} notification - Notification object
     */
    sendNotification(userId, notification) {
        try {
            const io = getIo();
            // Use the correct room format: user:${userId}
            const userRoom = `user:${userId.toString()}`;
            // Use the correct event name: notification:new
            io.to(userRoom).emit('notification:new', notification);
            console.log(`📢 Notification sent to user ${userId}:`, notification.title);
        } catch (error) {
            console.error('Error sending notification via socket:', error);
            // Don't throw - notification is already saved in DB
        }
    }

    /**
     * Broadcast notification to all admins
     * @param {Object} data - Notification data
     */
    async notifyAdmins(data) {
        try {
            const admins = await User.find({ role: 'admin' }).select('_id');
            const notifications = await Promise.all(admins.map(async (admin) => {
                return await this.createAndSend({
                    ...data,
                    userId: admin._id,
                    userRole: 'admin'
                });
            }));
            return notifications;
        } catch (error) {
            console.error('Error notifying admins:', error);
            // Don't throw to avoid breaking the main flow
        }
    }

    /**
     * Send push notification via Expo Push API
     * @param {String} userId - User ID to send notification to
     * @param {Object} notification - Notification object
     */
    async sendPushNotification(userId, notification) {
        try {
            const user = await User.findById(userId).select('+pushToken');

            if (!user?.pushToken) {
                console.log(`[NotificationService] No push token for user ${userId} (Possibly web/emulator)`);
            }

            // Validate that we have a valid Expo push token
            if (user && user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
                const message = {
                    to: user.pushToken,
                    sound: 'default',
                    title: notification.title,
                    body: notification.message,
                    data: { actionUrl: notification.actionUrl, relatedId: notification.relatedId, type: notification.type },
                    priority: 'high',
                };

                // The Expo SDK automatically creates chunks that comply with their API limits
                let chunks = expo.chunkPushNotifications([message]);

                for (let chunk of chunks) {
                    try {
                        await expo.sendPushNotificationsAsync(chunk);
                        console.log(`📲 Push notification sent to user ${userId}`);
                    } catch (error) {
                        console.error('Error sending chunk:', error);
                    }
                }
            } else if (user && user.pushToken) {
                console.warn(`⚠️ Invalid Expo Push Token for user ${userId}: ${user.pushToken}`);
            }
        } catch (error) {
            // Log error but don't crash
            console.error('Error sending push notification:', error.message);
        }
    }

    /**
     * Create notification and send via socket and push
     * @param {Object} data - Notification data
     * @returns {Promise<Object>} Created notification
     */
    async createAndSend(data) {
        try {
            const notification = await this.createNotification(data);
            this.sendNotification(data.userId, notification);
            // functionality fire and forget
            this.sendPushNotification(data.userId, notification);
            return notification;
        } catch (error) {
            console.error('Error in createAndSend:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     * @param {String} notificationId - Notification ID
     * @param {String} userId - User ID (for authorization)
     * @returns {Promise<Object>} Updated notification
     */
    async markAsRead(notificationId, userId) {
        try {
            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, userId: userId },
                { isRead: true },
                { new: true }
            );

            if (!notification) {
                throw new Error('Notification not found or unauthorized');
            }

            // Emit socket event for real-time update
            const io = getIo();
            const userRoom = `user:${userId.toString()}`;
            io.to(userRoom).emit('notification:read', { notificationId });

            return notification;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark notifications as read by related ID (e.g. conversationId)
     * @param {String} relatedId - Related ID
     * @param {String} userId - User ID
     * @returns {Promise<Number>} Number of updated notifications
     */
    async markAsReadByRelatedId(relatedId, userId) {
        try {
            const result = await Notification.updateMany(
                { relatedId, userId, isRead: false },
                { isRead: true }
            );

            if (result.modifiedCount > 0) {
                // Emit socket event for real-time update
                const io = getIo();
                const userRoom = `user:${userId.toString()}`;
                // We emit a special generic read event to trigger count refresh
                io.to(userRoom).emit('notification:read', { relatedId });
            }

            return result.modifiedCount;
        } catch (error) {
            console.error('Error marking notifications as read by relatedId:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     * @param {String} userId - User ID
     * @returns {Promise<Number>} Number of updated notifications
     */
    async markAllAsRead(userId) {
        try {
            const result = await Notification.updateMany(
                { userId: userId, isRead: false },
                { isRead: true }
            );

            // Emit socket event for real-time update
            const io = getIo();
            const userRoom = `user:${userId.toString()}`;
            io.to(userRoom).emit('notification:allRead');

            return result.modifiedCount;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    /**
     * Delete a notification
     * @param {String} notificationId - Notification ID
     * @param {String} userId - User ID (for authorization)
     * @returns {Promise<Object>} Deleted notification
     */
    async deleteNotification(notificationId, userId) {
        try {
            const notification = await Notification.findOneAndDelete({
                _id: notificationId,
                userId: userId
            });

            if (!notification) {
                throw new Error('Notification not found or unauthorized');
            }

            return notification;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    /**
     * Clear all read notifications for a user
     * @param {String} userId - User ID
     * @returns {Promise<Number>} Number of deleted notifications
     */
    async clearReadNotifications(userId) {
        try {
            const result = await Notification.deleteMany({
                userId: userId,
                isRead: true
            });

            return result.deletedCount;
        } catch (error) {
            console.error('Error clearing read notifications:', error);
            throw error;
        }
    }

    /**
     * Get unread notification count for a user
     * @param {String} userId - User ID
     * @returns {Promise<Number>} Unread count
     */
    async getUnreadCount(userId) {
        try {
            const count = await Notification.countDocuments({
                userId: userId,
                isRead: false
            });

            return count;
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw error;
        }
    }

    /**
     * Get notifications for a user with pagination and filtering
     * @param {String} userId - User ID
     * @param {Object} options - Query options (page, limit, type, isRead)
     * @returns {Promise<Object>} Notifications and metadata
     */
    async getNotifications(userId, options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                type,
                isRead
            } = options;

            const query = { userId: userId };

            if (type) {
                query.type = type;
            }

            if (isRead !== undefined) {
                query.isRead = isRead === 'true' || isRead === true;
            }

            const skip = (page - 1) * limit;

            const [notifications, totalCount, unreadCount] = await Promise.all([
                Notification.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                Notification.countDocuments(query),
                Notification.countDocuments({ userId: userId, isRead: false })
            ]);

            return {
                notifications,
                totalCount,
                unreadCount,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit)
            };
        } catch (error) {
            console.error('Error getting notifications:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();
