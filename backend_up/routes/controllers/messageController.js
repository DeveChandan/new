const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { User } = require('../models/User');
const notificationService = require('../services/notificationService');
const { getIo, emitMessage } = require('../socket');
const { getLocale } = require('../utils');
const { translateMessage } = require('../services/translationService');

const addMessage = async (req, res) => {
  // Security: Override sender with the authenticated user's ID
  const newMessageData = {
    ...req.body,
    sender: req.user._id
  };
  const newMessage = new Message(newMessageData);

  try {
    // Security: Verify the user is a member of the conversation
    const conversation = await Conversation.findById(newMessage.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.members.includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'You are not a member of this conversation' });
    }

    const savedMessage = await newMessage.save();
    const io = getIo();

    // Ensure the chat UI updates
    io.to(savedMessage.conversationId.toString()).emit('receiveMessage', savedMessage);

    // Handle notification logic
    const senderId = savedMessage.sender.toString();
    const receiverId = conversation.members.find(member => member.toString() !== senderId);

    if (receiverId) {
      // Emit globally to receiver via personal room to trigger delivery tick
      emitMessage(receiverId, savedMessage);
    }

    console.log(`[MessageController] Sender: ${senderId}, Receiver: ${receiverId}, Members: ${conversation.members}`);

    if (receiverId) {
      const receiverUser = await User.findById(receiverId).select('role');
      if (receiverUser) {
        // Use the centralized service to create and send the notification
        await notificationService.createAndSend({
          userId: receiverId,
          userRole: receiverUser.role,
          type: 'new_message',
          title: 'New Message',
          message: `You have a new message.`,
          relatedId: savedMessage.conversationId,
          relatedModel: 'Conversation',
          actionUrl: `/messages?conversationId=${savedMessage.conversationId}`
        });
      }
    }

    res.status(200).json(savedMessage);
  } catch (err) {
    console.error("Error in addMessage:", err);
    res.status(500).json(err);
  }
};

const getMessages = async (req, res) => {
  console.log('API Hit: getMessages', req.params.conversationId);
  const locale = getLocale(req); // Get locale from query params or header
  const userId = req.user._id; // Define userId here

  try {
    // Security: Verify the user is a member of the conversation
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if the requesting user is a member
    // Check if the current user is a member of the conversation
    if (!conversation.members.some(memberId => memberId.toString() === userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({
      conversationId: req.params.conversationId,
    });

    // Mark messages as delivered (messages sent by other user)
    const io = getIo();
    const messagesToMarkDelivered = messages.filter(
      msg => msg.sender.toString() !== userId.toString() && msg.status === 'sent'
    );

    if (messagesToMarkDelivered.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: messagesToMarkDelivered.map(m => m._id) },
          status: 'sent'
        },
        { status: 'delivered' }
      );

      // Emit socket events for each message
      messagesToMarkDelivered.forEach(msg => {
        const msgId = msg._id.toString();
        const convId = req.params.conversationId;
        const senderId = msg.sender.toString();
        
        const messageBody = { 
          messageId: msgId, 
          conversationId: convId, 
          clientMessageId: msg.clientMessageId 
        };

        // Emit to room
        io.to(convId).emit('message:delivered', messageBody);
        
        // Also emit to sender's personal room
        io.to(`user:${senderId}`).emit('message:delivered', messageBody);
        
        // Legacy support
        io.to(convId).emit('messageDelivered', { messageId: msgId });
      });
    }

    // Fetch updated messages
    const updatedMessages = await Message.find({
      conversationId: req.params.conversationId,
    });

    // Translate messages if locale is not English
    let translatedMessages = updatedMessages;
    if (locale !== 'en') {
      translatedMessages = await Promise.all(
        updatedMessages.map(message => translateMessage(message, locale))
      );
    }

    console.log('API Response: getMessages', translatedMessages);
    res.status(200).json(translatedMessages);
  } catch (err) {
    console.error("Error in getMessages:", err);
    res.status(500).json(err);
  }
};

const markMessagesAsRead = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  try {
    // Security: Verify the user is a member of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.members.some(memberId => memberId.toString() === userId.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Clear notifications for this conversation
    await notificationService.markAsReadByRelatedId(conversationId, userId);

    // Find messages sent by other user that are not yet read
    const messagesToMarkRead = await Message.find({
      conversationId: conversationId,
      sender: { $ne: userId },
      status: { $in: ['sent', 'delivered'] }
    });

    if (messagesToMarkRead.length > 0) {
      // Update messages to read status
      await Message.updateMany(
        {
          _id: { $in: messagesToMarkRead.map(m => m._id) }
        },
        { status: 'read' }
      );

      // Emit socket events
      const io = getIo();
      messagesToMarkRead.forEach(msg => {
        const msgId = msg._id.toString();
        const convId = conversationId;
        const senderId = msg.sender.toString();

        const messageBody = {
          messageId: msgId,
          conversationId: convId,
          readBy: userId.toString(),
          clientMessageId: msg.clientMessageId
        };

        // Emit to room
        io.to(convId).emit('message:read', messageBody);
        
        // Also emit to sender's personal room
        io.to(`user:${senderId}`).emit('message:read', messageBody);

        // Legacy support
        io.to(convId).emit('messageRead', { messageId: msgId });
      });
    }

    res.status(200).json({ success: true, markedCount: messagesToMarkRead.length });
  } catch (err) {
    console.error("Error in markMessagesAsRead:", err);
    res.status(500).json(err);
  }
};

module.exports = { addMessage, getMessages, markMessagesAsRead };
