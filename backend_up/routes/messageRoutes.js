const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware
const { addMessage, getMessages, markMessagesAsRead } = require('../controllers/messageController');

router.post('/', protect, addMessage); // Add protect middleware
router.get('/:conversationId', protect, getMessages); // Add protect middleware
router.put('/:conversationId/read', protect, markMessagesAsRead); // Mark messages as read

module.exports = router;
