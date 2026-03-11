const express = require('express');
const router = express.Router();
const {
  newConversation,
  getConversations,
  getConversationById,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, newConversation);
router.get('/details/:conversationId', protect, getConversationById);
router.get('/:userId', protect, getConversations);

module.exports = router;
