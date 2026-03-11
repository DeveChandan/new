const cron = require('node-cron');
const WorkLog = require('../models/WorkLog');

const resetOtps = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('Running a daily task to reset expired OTPs');
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        try {
            const result = await WorkLog.updateMany(
                { 
                    $or: [
                        { startOtpExpires: { $lt: yesterday } },
                        { endOtpExpires: { $lt: yesterday } }
                    ] 
                },
                {
                    $unset: {
                        startOtp: "",
                        startOtpExpires: "",
                        endOtp: "",
                        endOtpExpires: ""
                    }
                }
            );
            console.log(`Reset ${result.nModified} expired OTPs.`);
        } catch (error) {
            console.error('Error resetting expired OTPs:', error);
        }
    });
};

module.exports = resetOtps;
