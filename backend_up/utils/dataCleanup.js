const Application = require('../models/Application');
const Notification = require('../models/Notification');
const Otp = require('../models/Otp');
const Job = require('../models/Job');

/**
 * Clean up orphaned applications (applications for deleted jobs)
 */
const cleanOrphanedApplications = async () => {
    try {
        console.log('🧹 Cleaning orphaned applications...');

        // Find all applications
        const applications = await Application.find({}).populate('job');

        // Filter applications where job is null (deleted)
        const orphanedApplications = applications.filter(app => !app.job);

        if (orphanedApplications.length === 0) {
            console.log('✅ No orphaned applications found');
            return { deleted: 0 };
        }

        // Delete orphaned applications
        const orphanedIds = orphanedApplications.map(app => app._id);
        const result = await Application.deleteMany({ _id: { $in: orphanedIds } });

        console.log(`✅ Deleted ${result.deletedCount} orphaned applications`);
        return { deleted: result.deletedCount };
    } catch (error) {
        console.error('❌ Error cleaning orphaned applications:', error);
        throw error;
    }
};

/**
 * Clean up old read notifications (older than 30 days)
 */
const cleanOldNotifications = async () => {
    try {
        console.log('🧹 Cleaning old read notifications...');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await Notification.deleteMany({
            isRead: true,
            createdAt: { $lt: thirtyDaysAgo }
        });

        console.log(`✅ Deleted ${result.deletedCount} old read notifications`);
        return { deleted: result.deletedCount };
    } catch (error) {
        console.error('❌ Error cleaning old notifications:', error);
        throw error;
    }
};

/**
 * Clean up expired OTPs (older than 10 minutes)
 */
const cleanExpiredOtps = async () => {
    try {
        console.log('🧹 Cleaning expired OTPs...');

        const tenMinutesAgo = new Date();
        tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

        const result = await Otp.deleteMany({
            createdAt: { $lt: tenMinutesAgo }
        });

        console.log(`✅ Deleted ${result.deletedCount} expired OTPs`);
        return { deleted: result.deletedCount };
    } catch (error) {
        console.error('❌ Error cleaning expired OTPs:', error);
        throw error;
    }
};

/**
 * Validate data integrity
 */
const validateDataIntegrity = async () => {
    try {
        console.log('🔍 Validating data integrity...');

        const issues = [];

        // Check for jobs with invalid employer references
        const jobs = await Job.find({}).populate('employer');
        const jobsWithInvalidEmployer = jobs.filter(job => !job.employer);
        if (jobsWithInvalidEmployer.length > 0) {
            issues.push({
                type: 'invalid_employer_reference',
                count: jobsWithInvalidEmployer.length,
                ids: jobsWithInvalidEmployer.map(j => j._id)
            });
        }

        // Check for applications with invalid worker references
        const applications = await Application.find({}).populate('worker');
        const appsWithInvalidWorker = applications.filter(app => !app.worker);
        if (appsWithInvalidWorker.length > 0) {
            issues.push({
                type: 'invalid_worker_reference',
                count: appsWithInvalidWorker.length,
                ids: appsWithInvalidWorker.map(a => a._id)
            });
        }

        if (issues.length === 0) {
            console.log('✅ No data integrity issues found');
        } else {
            console.log(`⚠️  Found ${issues.length} data integrity issue(s):`);
            issues.forEach(issue => {
                console.log(`   - ${issue.type}: ${issue.count} records`);
            });
        }

        return { issues };
    } catch (error) {
        console.error('❌ Error validating data integrity:', error);
        throw error;
    }
};

const { cleanUnusedFiles } = require('./cleanUnusedFiles');

/**
 * Run all cleanup tasks
 */
const runAllCleanupTasks = async () => {
    console.log('🚀 Starting data cleanup tasks...');

    const results = {
        orphanedApplications: await cleanOrphanedApplications(),
        oldNotifications: await cleanOldNotifications(),
        expiredOtps: await cleanExpiredOtps(),
        unusedFiles: await cleanUnusedFiles(),
        dataIntegrity: await validateDataIntegrity()
    };

    console.log('✅ All cleanup tasks completed');
    return results;
};

module.exports = {
    cleanOrphanedApplications,
    cleanOldNotifications,
    cleanExpiredOtps,
    validateDataIntegrity,
    runAllCleanupTasks
};
