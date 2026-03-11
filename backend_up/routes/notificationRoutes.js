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

// Delete specific notification
router.delete('/:id', notificationController.deleteNotification);

// Clear all read notifications
router.delete('/clear-all', notificationController.clearReadNotifications);

module.exports = router;
