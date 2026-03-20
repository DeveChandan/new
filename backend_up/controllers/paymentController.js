const { activateSubscription, plans } = require('../services/subscriptionService');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const { User } = require('../models/User');
const Invoice = require('../models/Invoice');
const path = require('path');
const fs = require('fs');

/**
 * Get available subscription plans
 */
const getSubscriptionPlans = async (req, res) => {
  try {
    const plansArray = Object.entries(plans).map(([key, value]) => ({
      ...value,
      planKey: key
    }));
    res.status(200).json(plansArray);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Legacy/Manual subscription creation
 */
const createSubscription = async (req, res) => {
  const { plan } = req.body;
  const employerId = req.user._id;

  try {
    const subscription = await activateSubscription(employerId, plan);
    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get current active subscription
 */
const getCurrentSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      employer: req.user._id,
      status: 'active',
      endDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      const recentSubscription = await Subscription.findOne({ employer: req.user._id }).sort({ endDate: -1 });
      return res.status(200).json(recentSubscription || null);
    }

    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all invoices for employer
 */
const getInvoices = async (req, res) => {
  try {
    const employerId = req.user._id;
    const invoices = await Invoice.find({ employer: employerId })
      .populate('subscription')
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get specific invoice
 */
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const employerId = req.user._id;

    const invoice = await Invoice.findOne({ _id: id, employer: employerId })
      .populate('subscription')
      .populate('employer', 'name email phone');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Download invoice PDF
 */
const downloadInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const employerId = req.user._id;

    const invoice = await Invoice.findOne({ _id: id, employer: employerId });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!invoice.pdfUrl) {
      return res.status(404).json({ message: 'PDF not available' });
    }

    const pdfPath = path.join(__dirname, '../..', invoice.pdfUrl);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }

    res.download(pdfPath, `${invoice.invoiceNumber}.pdf`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Check if employer can post a job
 */
const canPostJob = async (req, res) => {
  try {
    const employerId = req.user._id;

    const subscription = await Subscription.findOne({
      employer: employerId,
      status: 'active',
      endDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      const lastSubscription = await Subscription.findOne({ employer: employerId }).sort({ endDate: -1 });
      if (lastSubscription && lastSubscription.endDate < new Date()) {
        return res.json({
          canPostJob: false,
          reason: 'expired',
          message: 'Your subscription has expired. Please renew to post new jobs.'
        });
      }

      return res.json({
        canPostJob: false,
        reason: 'no_subscription',
        message: 'You need an active subscription to post jobs.'
      });
    }

    const Job = require('../models/Job'); // Import here to avoid circular dependency
    const activeJobsCount = await Job.countDocuments({
      employer: employerId,
      status: { $in: ['open', 'in-progress'] }
    });

    if (activeJobsCount >= subscription.maxActiveJobs) {
      return res.json({
        canPostJob: false,
        reason: 'limit_reached',
        message: `You have reached your limit of ${subscription.maxActiveJobs} active job(s). Close existing jobs or upgrade your plan.`,
        subscription: {
          name: subscription.planType,
          maxActiveJobs: subscription.maxActiveJobs,
          activeJobsCount,
          remainingSlots: Math.max(0, subscription.maxActiveJobs - activeJobsCount),
          daysRemaining: Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        }
      });
    }

    return res.json({
      canPostJob: true,
      message: 'You can post a job.',
      subscription: {
        name: subscription.planType,
        maxActiveJobs: subscription.maxActiveJobs,
        activeJobsCount,
        remainingSlots: Math.max(0, subscription.maxActiveJobs - activeJobsCount),
        daysRemaining: Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin: Get all invoices with filtering
 */
const getAdminInvoices = async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query;
    let query = {};

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search filter (Invoice Number, Employer Name, Employer Email)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const employers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
        role: 'employer'
      }).select('_id');

      const employerIds = employers.map(e => e._id);

      query.$or = [
        { invoiceNumber: searchRegex },
        { employer: { $in: employerIds } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        let end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const invoices = await Invoice.find(query)
      .populate('employer', 'name email companyName phone')
      .populate('subscription', 'planType')
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin: Update invoice status
 */
const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'paid', 'overdue', 'refunded', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    invoice.status = status;
    await invoice.save();

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin: Send payment reminder
 */
const sendPaymentReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id).populate('employer', 'name email');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!invoice.employer.email) {
      return res.status(400).json({ message: 'Employer has no email address on file' });
    }

    // Send real payment reminder email
    const emailService = require('../services/emailService');
    await emailService.sendPaymentReminderEmail({
      to: invoice.employer.email,
      employerName: invoice.employer.name,
      invoice,
    });

    // Mark reminder as sent
    invoice.emailSent = true;
    invoice.reminderSentAt = new Date();
    await invoice.save();

    res.status(200).json({ message: 'Payment reminder sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Purchase the worklog tracking add-on
 * Grants 30-day worklog access to basic/pro employers.
 */
const purchaseWorklogAddon = async (req, res) => {
  const employerId = req.user._id;

  try {
    // Find the employer's active subscription
    const subscription = await Subscription.findOne({
      employer: employerId,
      status: 'active',
      endDate: { $gte: new Date() },
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(400).json({
        message: 'You need an active subscription to purchase add-ons.',
      });
    }

    // Premium plan already includes worklog tracking
    if (subscription.planType === 'premium') {
      return res.status(400).json({
        message: 'Worklog tracking is already included in your Premium plan.',
      });
    }

    // Prevent double-purchase if access is still active
    if (
      subscription.worklogAccessExpiry &&
      new Date(subscription.worklogAccessExpiry) > new Date()
    ) {
      const daysLeft = Math.ceil(
        (new Date(subscription.worklogAccessExpiry) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return res.status(400).json({
        message: `Worklog access is already active for ${daysLeft} more day(s).`,
      });
    }

    const ADDON_PRICE = 2499;
    const TAX_RATE = 0.18; // 18% GST
    const taxAmount = Math.round(ADDON_PRICE * TAX_RATE);
    const totalAmount = ADDON_PRICE + taxAmount;

    // Set worklog access for 30 days
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    subscription.worklogAccessExpiry = expiry;
    await subscription.save();

    // Create invoice record for this add-on purchase
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const invoice = await Invoice.create({
      employer: employerId,
      subscription: subscription._id,
      items: [{
        description: 'Worklog Tracking Add-on (30 Days)',
        quantity: 1,
        unitPrice: ADDON_PRICE,
        amount: ADDON_PRICE,
      }],
      subtotal: ADDON_PRICE,
      taxAmount,
      totalAmount,
      dueDate,
      status: 'paid',
    });

    res.status(200).json({
      message: 'Worklog tracking add-on activated successfully for 30 days.',
      worklogAccessExpiry: subscription.worklogAccessExpiry,
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Admin: Process refund for a subscription
 * Refund Policy: Full refund within 48 hours if no features used.
 * No refund after 48 hours or if features have been used.
 */
const processRefund = async (req, res) => {
  try {
    const { subscriptionId, reason } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ message: 'Subscription ID is required' });
    }

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const employer = await User.findById(subscription.employer);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    // Check if already cancelled/refunded
    if (subscription.status === 'cancelled') {
      return res.status(400).json({ message: 'Subscription is already cancelled' });
    }

    // Free plans don't need refunds
    if (subscription.price === 0 || subscription.planType === 'free') {
      return res.status(400).json({ message: 'Free plan subscriptions cannot be refunded' });
    }

    // Calculate hours since subscription started
    const hoursSinceStart = (new Date() - new Date(subscription.startDate)) / (1000 * 60 * 60);
    const within48Hours = hoursSinceStart <= 48;

    // Check if features have been used
    const featuresUsed = subscription.databaseUnlocksUsed > 0 || subscription.locationChangesUsed > 0;

    // Check if any jobs were posted with this subscription
    const Job = require('../models/Job');
    const jobsPosted = await Job.countDocuments({
      employer: subscription.employer,
      createdAt: { $gte: subscription.startDate }
    });

    let refundEligible = false;
    let refundAmount = 0;
    let refundType = 'none';

    if (within48Hours && !featuresUsed && jobsPosted === 0) {
      // Full refund — within 48 hours, no features used
      refundEligible = true;
      const TAX_RATE = 0.18;
      refundAmount = subscription.price + Math.round(subscription.price * TAX_RATE);
      refundType = 'full';
    } else if (!within48Hours || featuresUsed || jobsPosted > 0) {
      // Not eligible per policy
      refundEligible = false;
      refundType = 'ineligible';
    }

    if (!refundEligible) {
      return res.status(400).json({
        message: 'Refund not eligible. Policy: Full refund only within 48 hours of purchase and if no plan features have been used.',
        details: {
          hoursSinceStart: Math.round(hoursSinceStart),
          within48Hours,
          featuresUsed,
          jobsPosted,
        }
      });
    }

    // Cancel the subscription
    subscription.status = 'cancelled';
    subscription.endDate = new Date();
    await subscription.save();

    // Mark related invoice as refunded
    await Invoice.updateMany(
      { subscription: subscription._id, status: 'paid' },
      { $set: { status: 'refunded' } }
    );

    // Mark related payment as refunded
    const payment = await Payment.findOne({
      user: subscription.employer,
      planId: subscription.planType,
      status: 'success'
    }).sort({ createdAt: -1 });

    if (payment) {
      payment.status = 'refunded';
      await payment.save();
    }

    // Clear subscription reference from user
    employer.subscription = null;
    await employer.save();

    // Send notification to employer
    const notificationService = require('../services/notificationService');
    await notificationService.createAndSend({
      userId: subscription.employer,
      userRole: 'employer',
      type: 'subscription_cancelled',
      title: 'Subscription Refunded',
      message: `Your ${subscription.planType} subscription has been refunded. ₹${refundAmount} will be credited within 5-7 business days.`,
      relatedId: subscription._id,
      relatedModel: 'Subscription',
      actionUrl: '/subscriptions'
    });

    res.status(200).json({
      message: 'Refund processed successfully',
      refundAmount,
      refundType,
      reason: reason || 'Admin processed refund',
      note: 'Amount will be credited to original payment method within 5-7 business days via Paytm.',
      subscription: {
        id: subscription._id,
        plan: subscription.planType,
        status: subscription.status,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a preview of the payment (including tax and any credits)
 */
const getPaymentPreview = async (req, res) => {
  try {
    const { planId } = req.query;
    const employerId = req.user._id;

    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }

    const { calculatePlanPrice } = require('../services/subscriptionService');
    const pricing = await calculatePlanPrice(employerId, planId);

    res.status(200).json(pricing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSubscription,
  getSubscriptionPlans,
  getCurrentSubscription,
  canPostJob,
  getInvoices,
  getInvoiceById,
  downloadInvoicePdf,
  getAdminInvoices,
  updateInvoiceStatus,
  sendPaymentReminder,
  purchaseWorklogAddon,
  processRefund,
  getPaymentPreview,
};
