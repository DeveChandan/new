const cron = require('node-cron');
const { runAllCleanupTasks } = require('../utils/dataCleanup');

/**
 * Schedule daily data cleanup at 2 AM
 */
const scheduleDataCleanup = () => {
    // Run every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('⏰ Running scheduled data cleanup at', new Date().toISOString());

        try {
            const results = await runAllCleanupTasks();
            console.log('📊 Cleanup results:', JSON.stringify(results, null, 2));
        } catch (error) {
            console.error('❌ Scheduled cleanup failed:', error);
        }
    }, {
        timezone: 'Asia/Kolkata' // Adjust to your timezone
    });

    console.log('✅ Data cleanup cron job scheduled (daily at 2:00 AM IST)');
};

module.exports = scheduleDataCleanup;
