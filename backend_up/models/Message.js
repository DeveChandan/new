const mongoose = require('mongoose');
const { MESSAGE_STATUSES } = require('../constants/statusEnums');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    text: {
      type: String,
    },
    status: {
      type: String,
      enum: MESSAGE_STATUSES,
      default: 'sent'
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
