const cron = require('node-cron');
const Notification = require('../models/Notification');

/**
 * Cron job to clean up old read notifications
 * Runs daily at 2 AM to delete read notifications older than 90 days
 */
const cleanupOldNotifications = () => {
    // Run every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        try {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            const result = await Notification.deleteMany({
                isRead: true,
                createdAt: { $lt: ninetyDaysAgo }
            });

            console.log(`🧹 Notification cleanup: Deleted ${result.deletedCount} old read notifications`);
        } catch (error) {
            console.error('Error cleaning up old notifications:', error);
        }
    });

    console.log('✅ Notification cleanup cron job scheduled (daily at 2:00 AM)');
};

/**
 * Archive old notifications instead of deleting
 * Moves notifications older than 90 days to an archived state
 */
const archiveOldNotifications = async () => {
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const result = await Notification.updateMany(
            {
                isRead: true,
                createdAt: { $lt: ninetyDaysAgo },
                archived: { $ne: true }
            },
            {
                $set: { archived: true }
            }
        );

        console.log(`📦 Archived ${result.modifiedCount} old notifications`);
        return result.modifiedCount;
    } catch (error) {
        console.error('Error archiving old notifications:', error);
        throw error;
    }
};

module.exports = cleanupOldNotifications;
