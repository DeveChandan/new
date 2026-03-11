const mongoose = require('mongoose');
const { INVOICE_STATUSES } = require('../constants/statusEnums');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
    },
    items: [
      {
        description: String,
        quantity: Number,
        unitPrice: Number,
        amount: Number,
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: INVOICE_STATUSES,
      default: 'pending',
    },
    pdfUrl: {
      type: String,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: {
      type: Date,
    },
  },

  {
    timestamps: true,
  }
);

// Auto-increment invoice number
invoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const year = new Date().getFullYear();
    const prefix = process.env.INVOICE_PREFIX || 'INV';

    // Find the last invoice for this year
    const lastInvoice = await this.constructor
      .findOne({ invoiceNumber: new RegExp(`^${prefix}-${year}-`) })
      .sort({ invoiceNumber: -1 });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    this.invoiceNumber = `${prefix}-${year}-${String(nextNumber).padStart(4, '0')}`;
  }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
