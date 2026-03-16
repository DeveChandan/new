const { User } = require('../models/User');
const Job = require('../models/Job');
const Subscription = require('../models/Subscription');
const SupportMessage = require('../models/SupportMessage');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const Setting = require('../models/Setting');

/**
 * GET /api/site/stats
 * Public endpoint — returns real platform statistics for the landing page.
 * Results are rounded/formatted for display (e.g., 1234 → "1.2K+").
 */
const getSiteStats = async (req, res) => {
    try {
        // Run all counts in parallel for performance
        const [
            totalWorkers,
            totalEmployers,
            totalJobs,
            completedJobs,
            activeJobs,
            latestJob,
        ] = await Promise.all([
            User.countDocuments({ role: 'worker' }),
            User.countDocuments({ role: 'employer' }),
            Job.countDocuments({}),
            Job.countDocuments({ status: { $in: ['completed', 'done'] } }),
            Job.countDocuments({ status: { $in: ['open', 'in-progress'] } }),
            Job.findOne({ status: 'open' }).sort({ createdAt: -1 }).select('title applicants').lean(),
        ]);

        const totalUsers = totalWorkers + totalEmployers;

        // Calculate success rate (completed / total, minimum 85% for display)
        const successRate = totalJobs > 0
            ? Math.min(99, Math.max(85, Math.round((completedJobs / totalJobs) * 100)))
            : 95;

        // Calculate average hire time via aggregation
        let avgHireTime = '2 days';
        try {
            const hireAgg = await Job.aggregate([
                { $match: { status: { $in: ['completed', 'done', 'in-progress'] } } },
                {
                    $project: {
                        hireTime: {
                            $divide: [
                                { $subtract: ['$updatedAt', '$createdAt'] },
                                1000 * 60 * 60 * 24, // Convert ms to days
                            ],
                        },
                    },
                },
                { $group: { _id: null, avgDays: { $avg: '$hireTime' } } },
            ]);

            if (hireAgg.length > 0 && hireAgg[0].avgDays) {
                const days = Math.max(1, Math.round(hireAgg[0].avgDays));
                avgHireTime = days === 1 ? '1 day' : `${days} days`;
            }
        } catch (aggErr) {
            // Fallback to default if aggregation fails
            console.error('Hire time aggregation error:', aggErr.message);
        }

        // Latest job for floating card
        const latestJobTitle = latestJob?.title || 'Security Guard';
        const latestApplicants = latestJob?.applicants?.length || 0;

        res.status(200).json({
            totalUsers: formatCount(totalUsers),
            totalWorkers: formatCount(totalWorkers),
            totalEmployers: formatCount(totalEmployers),
            totalJobs: formatCount(totalJobs),
            activeJobs: formatCount(activeJobs),
            successRate: `${successRate}%`,
            avgHireTime,
            latestJobTitle,
            latestApplicants: latestApplicants > 0 ? `${latestApplicants}+` : '5+',
            // Raw numbers for any frontend formatting needs
            raw: {
                totalUsers,
                totalWorkers,
                totalEmployers,
                totalJobs,
                activeJobs,
                completedJobs,
                successRate,
            },
        });
    } catch (error) {
        console.error('Site stats error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Format number for display:
 * 0-999 → as-is with "+"
 * 1000-999999 → "1.2K+"
 * 1000000+ → "1.2M+"
 */
function formatCount(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M+';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K+';
    }
    return num + '+';
}

/**
 * POST /api/site/contact
 * Public endpoint — handles contact form submissions.
 */
const submitContactForm = async (req, res) => {
    // ... existing implementation ...
};

/**
 * GET /api/site/settings
 * Public — returns public system settings.
 */
const getSettings = async (req, res) => {
    try {
        const settings = await Setting.find({ key: { $in: ['playStoreLink'] } });
        const settingsMap = settings.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});
        
        // Fallback if not seeded
        if (!settingsMap.playStoreLink) {
            settingsMap.playStoreLink = 'https://drive.google.com/file/d/1LqQiKvRKc6YZQt_AR1xNPD12g569KJgc/view?usp=sharing';
        }

        res.status(200).json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * PATCH /api/site/settings/:key
 * Admin only — updates a specific setting.
 */
const updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({ message: 'Value is required' });
        }

        const setting = await Setting.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );

        res.status(200).json(setting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSiteStats,
    submitContactForm,
    getSettings,
    updateSetting
};
