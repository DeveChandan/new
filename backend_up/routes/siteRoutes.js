const express = require('express');
const router = express.Router();
const { getSiteStats, submitContactForm } = require('../controllers/siteController');
const { getActiveTestimonials } = require('../controllers/testimonialController');

// GET /api/site/stats — Public, no auth required
router.get('/stats', getSiteStats);

// POST /api/site/contact — Public, handles contact form submissions
router.post('/contact', submitContactForm);

// GET /api/site/testimonials — Public
router.get('/testimonials', getActiveTestimonials);

module.exports = router;
