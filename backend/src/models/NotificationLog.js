const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  trackingNumber: String,
  recipient: {
    name: String,
    email: String,
    phone: String,
    role: { type: String, default: 'customer' }
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'in_app'],
    required: true
  },
  type: {
    type: String,
    required: true
  },
  subject: String,
  message: {
    type: String,
    required: true
  },
  previewUrl: String, // Ethereal preview link
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed', 'mocked'],
    default: 'sent'
  },
  meta: mongoose.Schema.Types.Mixed,
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
