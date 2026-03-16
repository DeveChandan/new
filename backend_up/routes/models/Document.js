const mongoose = require('mongoose');
const { DOCUMENT_TYPES, DOCUMENT_STATUSES } = require('../constants/statusEnums');

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: DOCUMENT_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: DOCUMENT_STATUSES,
      default: 'pending',
    },
    expiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
