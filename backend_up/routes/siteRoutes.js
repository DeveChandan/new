const express = require('express');
const router = express.Router();
const { getSiteStats } = require('../controllers/siteController');

// GET /api/site/stats — Public, no auth required
router.get('/stats', getSiteStats);

module.exports = router;
