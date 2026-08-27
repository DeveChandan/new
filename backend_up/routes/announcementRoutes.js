const express = require('express');
const router = express.Router();
const {
    getActiveAnnouncements,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    toggleAnnouncementStatus,
    deleteAnnouncement
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Public endpoint for clients to get active announcements / maintenance alerts
router.get('/active', getActiveAnnouncements);

// Protected admin endpoints
router.get('/admin', protect, admin, getAllAnnouncements);
router.post('/admin', protect, admin, createAnnouncement);
router.put('/admin/:id', protect, admin, updateAnnouncement);
router.patch('/admin/:id/toggle', protect, admin, toggleAnnouncementStatus);
router.delete('/admin/:id', protect, admin, deleteAnnouncement);

module.exports = router;
