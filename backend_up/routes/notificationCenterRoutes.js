const express = require('express');
const router = express.Router();
const {
    getFilteredWorkers,
    getFilteredEmployers,
    sendBulkNotification,
    previewNotification,
    createTemplate,
    getTemplates,
    updateTemplate,
    deleteTemplate
} = require('../controllers/notificationCenterController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// All routes require admin authentication
router.use(protect, admin);

// Template routes
router.get('/templates', getTemplates);
router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);

// Filtering routes
router.post('/filter/workers', getFilteredWorkers);
router.post('/filter/employers', getFilteredEmployers);

// Sending routes
router.post('/send', sendBulkNotification);
router.post('/preview', previewNotification);

module.exports = router;
