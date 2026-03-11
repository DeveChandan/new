const Subscription = require('../models/Subscription');
const { User } = require('../models/User');
const Invoice = require('../models/Invoice');
const notificationService = require('./notificationService');
const pdfService = require('./pdfService');
const emailService = require('./emailService');

// Hardcoded subscription plans (keep in sync with paymentController)
const plans = {
    free: {
        name: 'Free Trial',
        price: 0,
        duration: 7,
        maxActiveJobs: 1,
        maxDatabaseUnlocks: 10,
        maxLocationChanges: 1,
        features: [
            '1 Active Job Post',
            '10 Database Unlocks',
            'Valid for 7 days',
            'Basic Support'
        ]
    },
    basic: {

        name: '30 Days Plan',
        price: 2350,
        duration: 30,
        maxActiveJobs: 1,
        maxDatabaseUnlocks: 100,
        maxLocationChanges: 5,
        features: [
            '1 Active Job Post',
            '100 Database Unlocks',
            'Unlimited Calls',
            '3-5 times can change post job location',
            'Valid for 30 days'
        ]
    },
    pro: {
        name: '90 Days Plan',
        price: 4999,
        duration: 90,
        maxActiveJobs: 3,
        maxDatabaseUnlocks: 300,
        maxLocationChanges: 5,
        features: [
            '3 Active Job Post',
            '300 Database Unlocks',
            'Unlimited Calls',
            '3-5 times can change post job location',
            'Valid for 90 days'
        ]
    },
    premium: {
        name: '365 Days Plan',
        price: 11000,
        duration: 365,
        maxActiveJobs: 5,
        maxDatabaseUnlocks: 800,
        maxLocationChanges: 5,
        features: [
            '5 Active Job Post',
            '800 Database Unlocks',
            'View Worker Worklogs',
            'Unlimited Calls',
            '3-5 times can change post job location',
            'Valid for 365 days'
        ]
    },
    worklog_access: {
        name: 'Worklog Access Add-on',
        price: 2499,
        duration: 30,
        isAddon: true,
        features: ['View Worker Worklogs for all assigned jobs']
    }
};

/**
 * Activate a subscription plan for an employer
 * @param {string} employerId - User ID
 * @param {string} plan - 'basic', 'pro', or 'premium'
 * @returns {Promise<Object>} The created subscription
 */
const activateSubscription = async (employerId, plan) => {
    const user = await User.findById(employerId);
    if (!user || user.role !== 'employer') {
        throw new Error('Only employers can have subscriptions');
    }

    const planConfig = plans[plan];
    if (!planConfig) {
        throw new Error('Invalid plan');
    }

    // Calculate pro-rata upgrade credit from existing active subscription
    let upgradeCredit = 0;
    const existingSubscription = await Subscription.findOne({
        employer: employerId,
        status: 'active',
        endDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    if (existingSubscription && existingSubscription.price > 0) {
        const totalDays = Math.ceil(
            (new Date(existingSubscription.endDate) - new Date(existingSubscription.startDate)) / (1000 * 60 * 60 * 24)
        );
        const remainingDays = Math.ceil(
            (new Date(existingSubscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (remainingDays > 0 && totalDays > 0) {
            // Pro-rata: (remaining days / total days) * plan price
            upgradeCredit = Math.round((remainingDays / totalDays) * existingSubscription.price);
        }
    }

    // Deactivate previous active subscriptions
    await Subscription.updateMany(
        { employer: employerId, status: 'active' },
        { $set: { status: 'upgraded', endDate: new Date() } }
    );

    // Calculate end date
    let endDate = new Date();
    endDate.setDate(endDate.getDate() + planConfig.duration);

    const subscription = await Subscription.create({
        employer: employerId,
        planType: plan,
        endDate,
        price: planConfig.price,
        features: planConfig.features,
        maxActiveJobs: planConfig.maxActiveJobs,
        maxDatabaseUnlocks: planConfig.maxDatabaseUnlocks,
        maxLocationChanges: planConfig.maxLocationChanges,
        worklogAccessExpiry: (plan === 'premium' || plan === 'standard') ? endDate : null,
        status: 'active'
    });

    user.subscription = subscription._id;
    await user.save();

    // Auto-generate invoice (with upgrade credit if applicable)
    try {
        await autoGenerateInvoice(subscription, user, planConfig, upgradeCredit);
    } catch (invoiceError) {
        console.error('Error in post-subscription invoice generation:', invoiceError);
    }

    // Send Notification
    const creditMsg = upgradeCredit > 0 ? ` A pro-rata credit of ₹${upgradeCredit} has been applied from your previous plan.` : '';
    await notificationService.createAndSend({
        userId: employerId,
        userRole: 'employer',
        type: 'subscription_created',
        title: 'Subscription Activated',
        message: `Your ${plan} subscription has been successfully activated.${creditMsg}`,
        relatedId: subscription._id,
        relatedModel: 'Subscription',
        actionUrl: '/subscriptions'
    });

    return subscription;
};

/**
 * Helper to auto-generate invoice
 */
const autoGenerateInvoice = async (subscription, employer, planConfig, upgradeCredit = 0) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const items = [{
        description: `${planConfig.name} Subscription`,
        quantity: 1,
        unitPrice: planConfig.price,
        amount: planConfig.price,
    }];

    // Add upgrade credit as a discount line item if applicable
    if (upgradeCredit > 0) {
        items.push({
            description: 'Pro-rata upgrade credit (from previous plan)',
            quantity: 1,
            unitPrice: -upgradeCredit,
            amount: -upgradeCredit,
        });
    }

    const subtotal = Math.max(0, planConfig.price - upgradeCredit);
    const TAX_RATE = 0.18; // 18% GST as per Terms & Conditions
    const taxAmount = Math.round(subtotal * TAX_RATE);
    const totalAmount = subtotal + taxAmount;

    const invoice = await Invoice.create({
        employer: subscription.employer,
        subscription: subscription._id,
        items,
        subtotal,
        taxAmount,
        totalAmount,
        dueDate,
        status: 'paid' // Assuming this is called after successful payment
    });

    // Generate PDF
    try {
        const pdfPath = await pdfService.generateInvoicePDF(invoice, employer);
        invoice.pdfUrl = pdfPath;
        await invoice.save();

        await emailService.sendInvoiceEmail({
            to: employer.email,
            employerName: employer.name,
            invoice,
            pdfPath,
        });
        invoice.emailSent = true;
        await invoice.save();
    } catch (err) {
        console.error('Invoice PDF/Email Error:', err);
    }

    return invoice;
};

/**
 * Activate worklog addon for employer
 * @param {string} employerId - User ID
 * @returns {Promise<Object>} The updated subscription
 */
const activateWorklogAddon = async (employerId) => {
    const user = await User.findById(employerId);
    if (!user || user.role !== 'employer') {
        throw new Error('Only employers can purchase addons');
    }

    const addonConfig = plans.worklog_access;

    // Find active subscription to attach addon to
    let subscription = await Subscription.findOne({
        employer: employerId,
        status: 'active'
    }).sort({ createdAt: -1 });

    if (!subscription) {
        // If no active subscription, create a "ghost" subscription for the addon
        // though typically they should have at least a basic one or it's a standalone access
        let endDate = new Date();
        endDate.setDate(endDate.getDate() + addonConfig.duration);

        subscription = await Subscription.create({
            employer: employerId,
            planType: 'basic', // Default to basic if none exists
            endDate,
            price: 0, // Standalone addon price is handled in invoice
            features: [],
            maxActiveJobs: 0,
            maxDatabaseUnlocks: 0,
            maxLocationChanges: 0,
            worklogAccessExpiry: endDate,
            status: 'active'
        });

        user.subscription = subscription._id;
        await user.save();
    } else {
        // Extend existing subscription
        let currentExpiry = subscription.worklogAccessExpiry && subscription.worklogAccessExpiry > new Date()
            ? new Date(subscription.worklogAccessExpiry)
            : new Date();

        currentExpiry.setDate(currentExpiry.getDate() + addonConfig.duration);
        subscription.worklogAccessExpiry = currentExpiry;
        await subscription.save();
    }

    // Auto-generate invoice for addon
    try {
        await autoGenerateInvoice(subscription, user, addonConfig);
    } catch (invoiceError) {
        console.error('Error in addon invoice generation:', invoiceError);
    }

    // Send Notification
    await notificationService.createAndSend({
        userId: employerId,
        userRole: 'employer',
        type: 'subscription_updated',
        title: 'Worklog Access Activated',
        message: `Your Worklog Access addon has been successfully activated for 1 year.`,
        relatedId: subscription._id,
        relatedModel: 'Subscription',
        actionUrl: '/dashboard/employer'
    });

    return subscription;
};

/**
 * Calculate the total price for a plan or addon (including pro-rata credit and tax)
 * @param {string} employerId - User ID
 * @param {string} plan - 'basic', 'pro', 'premium', or 'worklog_access'
 * @returns {Promise<number>} The total amount in INR
 */
const calculatePlanPrice = async (employerId, plan) => {
    const planConfig = plans[plan];
    if (!planConfig) {
        throw new Error('Invalid plan');
    }

    let upgradeCredit = 0;

    // For regular subscriptions, calculate pro-rata credit
    if (!planConfig.isAddon && planConfig.price > 0) {
        const existingSubscription = await Subscription.findOne({
            employer: employerId,
            status: 'active',
            endDate: { $gte: new Date() }
        }).sort({ createdAt: -1 });

        if (existingSubscription && existingSubscription.price > 0) {
            const totalDays = Math.ceil(
                (new Date(existingSubscription.endDate) - new Date(existingSubscription.startDate)) / (1000 * 60 * 60 * 24)
            );
            const remainingDays = Math.ceil(
                (new Date(existingSubscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
            );
            if (remainingDays > 0 && totalDays > 0) {
                upgradeCredit = Math.round((remainingDays / totalDays) * existingSubscription.price);
            }
        }
    }

    const subtotal = Math.max(0, planConfig.price - upgradeCredit);
    const TAX_RATE = 0.18;
    const taxAmount = Math.round(subtotal * TAX_RATE);
    return subtotal + taxAmount;
};

module.exports = {
    activateSubscription,
    activateWorklogAddon,
    calculatePlanPrice,
    plans
};
