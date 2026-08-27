const express = require('express');
const router = express.Router();
const {
    checkAppVersion,
    getAppVersionConfig,
    updateAppVersionConfig
} = require('../controllers/appVersionController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Public version check endpoint used by mobile app
router.get('/check', checkAppVersion);

// Protected admin endpoints to manage version updates
router.get('/config', protect, admin, getAppVersionConfig);
router.put('/config', protect, admin, updateAppVersionConfig);

module.exports = router;
