const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware
const { messageLimiter } = require('../middleware/rateLimiter');
const { addMessage, getMessages, markMessagesAsRead } = require('../controllers/messageController');

router.post('/', protect, messageLimiter, addMessage); // Add protect & rate limit middleware
router.get('/:conversationId', protect, getMessages); // Add protect middleware
router.put('/:conversationId/read', protect, markMessagesAsRead); // Mark messages as read

module.exports = router;
