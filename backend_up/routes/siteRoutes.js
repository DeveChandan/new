const express = require('express');
const router = express.Router();
const { getSiteStats, submitContactForm, getSettings, updateSetting } = require('../controllers/siteController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { getActiveTestimonials } = require('../controllers/testimonialController');

// GET /api/site/stats — Public, no auth required
router.get('/stats', getSiteStats);

// POST /api/site/contact — Public, handles contact form submissions
router.post('/contact', submitContactForm);

// GET /api/site/testimonials — Public
router.get('/testimonials', getActiveTestimonials);

// Settings
router.get('/settings', getSettings);
router.patch('/settings/:key', protect, admin, updateSetting);

module.exports = router;
