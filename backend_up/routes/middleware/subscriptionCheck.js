const Subscription = require('../models/Subscription');

// Check if employer has active subscription
const requireActiveSubscription = async (req, res, next) => {
    try {
        const subscription = await Subscription.findOne({
            employer: req.user._id,
            endDate: { $gte: new Date() },
            status: 'active'
        });

        if (!subscription) {
            return res.status(403).json({
                message: 'Active subscription required to access this feature',
                requiresSubscription: true
            });
        }

        req.subscription = subscription;
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Check database unlock limit
const checkDatabaseUnlockLimit = async (req, res, next) => {
    try {
        const subscription = req.subscription;

        if (subscription.databaseUnlocksUsed >= subscription.maxDatabaseUnlocks) {
            return res.status(403).json({
                message: `Database unlock limit reached (${subscription.maxDatabaseUnlocks}). Please upgrade your plan to unlock more worker profiles.`,
                requiresUpgrade: true,
                feature: 'databaseUnlocks',
                limit: subscription.maxDatabaseUnlocks,
                used: subscription.databaseUnlocksUsed,
                currentPlan: subscription.planType
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Check job location change limit
const checkLocationChangeLimit = async (req, res, next) => {
    try {
        const subscription = req.subscription;

        if (subscription.locationChangesUsed >= subscription.maxLocationChanges) {
            return res.status(403).json({
                message: `Job location change limit reached (${subscription.maxLocationChanges}). You cannot change job location anymore with your current plan.`,
                limitReached: true,
                feature: 'locationChanges',
                limit: subscription.maxLocationChanges,
                used: subscription.locationChangesUsed
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    requireActiveSubscription,
    checkDatabaseUnlockLimit,
    checkLocationChangeLimit
};
