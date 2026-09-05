const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get all notifications with pagination and filtering
router.get('/', notificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark all notifications as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Mark specific notification as read
router.put('/:id/read', notificationController.markAsRead);

// Clear all read notifications (must be before /:id)
router.delete('/clear-all', notificationController.clearReadNotifications);

// Delete specific notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
