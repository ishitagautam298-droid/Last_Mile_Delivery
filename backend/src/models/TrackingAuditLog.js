const mongoose = require('mongoose');

const trackingAuditLogSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  trackingNumber: {
    type: String,
    required: true,
    index: true
  },
  previousStatus: {
    type: String,
    default: null
  },
  newStatus: {
    type: String,
    required: true
  },
  actor: {
    role: {
      type: String,
      enum: ['admin', 'agent', 'customer', 'system'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      default: 'System Automator'
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  location: {
    lat: Number,
    lng: Number,
    description: String
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Immutable logs: created once
});

module.exports = mongoose.model('TrackingAuditLog', trackingAuditLogSchema);
