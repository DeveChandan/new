const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { getIo } = require('../socket');

const newConversation = async (req, res) => {
  // Security: always use the authenticated user as the sender, ignore client-supplied senderId
  const senderId = req.user._id.toString();
  const { receiverId } = req.body;

  if (!receiverId) {
    return res.status(400).json({ message: 'receiverId is required' });
  }

  try {
    const existingConversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (existingConversation) {
      return res.status(200).json(existingConversation);
    }

    const newConversation = new Conversation({
      members: [senderId, receiverId],
    });

    const savedConversation = await newConversation.save();

    // Populate members to send to the client
    const populatedConversation = await Conversation.findById(savedConversation._id).populate("members", "name profilePicture");

    // Emit an event to the receiver so their UI updates in real-time
    const io = getIo();
    io.to(`user:${receiverId}`).emit('newConversation', populatedConversation);

    res.status(200).json(populatedConversation);
  } catch (err) {
    console.error("Error in newConversation:", err);
    res.status(500).json(err);
  }
};

const getConversations = async (req, res) => {
  // Security: enforce that the requesting user can only fetch their own conversations
  if (req.user._id.toString() !== req.params.userId) {
    return res.status(403).json({ message: 'Not authorized to view these conversations' });
  }

  try {
    const conversations = await Conversation.find({
      members: { $in: [req.params.userId] },
    })
      .populate("members", "name profilePicture")
      .lean();

    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (convo) => {
        const lastMessage = await Message.findOne({ conversationId: convo._id })
          .sort({ createdAt: -1 })
          .lean();
        return {
          ...convo,
          lastMessage: lastMessage || null,
        };
      })
    );

    conversationsWithLastMessage.sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
      return dateB - dateA;
    });

    res.status(200).json(conversationsWithLastMessage);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json(err);
  }
};

const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate("members", "name profilePicture");

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Security: only members of the conversation can view it
    const isMember = conversation.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    res.status(200).json(conversation);
  } catch (err) {
    console.error("Error fetching conversation:", err);
    res.status(500).json(err);
  }
};

module.exports = { newConversation, getConversations, getConversationById };
