const express = require('express');
const router = express.Router();
const paytmController = require('../controllers/paytmController');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// --- Standard Subscription Routes ---

// GET /api/payments/plans
router.get('/plans', paymentController.getSubscriptionPlans);

// GET /api/payments/current
router.get('/current', protect, paymentController.getCurrentSubscription);

// GET /api/payments/can-post
router.get('/can-post', protect, paymentController.canPostJob);

// POST /api/payments/subscribe
router.post('/subscribe', protect, paymentController.createSubscription);

// POST /api/payments/addon
router.post('/addon', protect, paymentController.purchaseWorklogAddon);

// GET /api/payments/preview
router.get('/preview', protect, paymentController.getPaymentPreview);

// --- Invoice Routes ---

// GET /api/payments/invoices
router.get('/invoices', protect, paymentController.getInvoices);

// GET /api/payments/invoices/:id
router.get('/invoices/:id', protect, paymentController.getInvoiceById);

// GET /api/payments/invoices/:id/download
// GET /api/payments/invoices/:id/download
router.get('/invoices/:id/download', protect, paymentController.downloadInvoicePdf);

// --- Admin Invoice Routes ---

// GET /api/payments/admin/invoices
router.get('/admin/invoices', protect, admin, paymentController.getAdminInvoices);

// PATCH /api/payments/admin/invoices/:id/status
router.patch('/admin/invoices/:id/status', protect, admin, paymentController.updateInvoiceStatus);

// POST /api/payments/admin/invoices/:id/remind
router.post('/admin/invoices/:id/remind', protect, admin, paymentController.sendPaymentReminder);

// POST /api/payments/admin/refund
router.post('/admin/refund', protect, admin, paymentController.processRefund);

// --- Paytm Specific Routes ---

// POST /api/payments/paytm/initiate
router.post('/paytm/initiate', protect, paytmController.initiateWithPaytm);
// router.post('/paytm/initiate', paytmController.initiateWithPaytm); // Temporary bypass for testing

// POST /api/payments/paytm/callback
router.post('/paytm/callback', paytmController.handlePaytmCallback);

// GET /api/payments/paytm/pay
router.get('/paytm/pay', paytmController.renderPaytmForm);

module.exports = router;
