const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  pickupAddress: {
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    state: { type: String, default: 'Karnataka' },
    coordinates: {
      lat: { type: Number, default: 12.9716 },
      lng: { type: Number, default: 77.5946 }
    }
  },
  pickupZone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: true
  },
  dropAddress: {
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    state: { type: String, default: 'Karnataka' },
    coordinates: {
      lat: { type: Number, default: 12.9352 },
      lng: { type: Number, default: 77.6245 }
    }
  },
  dropZone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: true
  },
  isZoneIntra: {
    type: Boolean,
    required: true
  },
  packageDetails: {
    lengthCm: { type: Number, required: true, min: 1 },
    breadthCm: { type: Number, required: true, min: 1 },
    heightCm: { type: Number, required: true, min: 1 },
    actualWeightKg: { type: Number, required: true, min: 0.05 },
    volumetricWeightKg: { type: Number, required: true },
    chargeableWeightKg: { type: Number, required: true },
    description: { type: String, default: 'Standard Parcel' },
    declaredValue: { type: Number, default: 1000 }
  },
  orderType: {
    type: String,
    enum: ['B2B', 'B2C'],
    required: true
  },
  paymentType: {
    type: String,
    enum: ['Prepaid', 'COD'],
    required: true
  },
  pricing: {
    rateCardApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RateCard'
    },
    rateCardName: String,
    baseWeightLimitKg: Number,
    basePrice: Number,
    extraWeightKg: Number,
    incrementalPricePerKg: Number,
    extraWeightCharge: Number,
    codSurcharge: Number,
    subtotal: Number,
    taxPercentage: Number,
    taxAmount: Number,
    totalAmount: Number,
    currency: { type: String, default: 'INR' }
  },
  status: {
    type: String,
    enum: [
      'Created',
      'Assigned',
      'Picked Up',
      'In Transit',
      'Out for Delivery',
      'Delivered',
      'Failed',
      'Rescheduled',
      'Cancelled'
    ],
    default: 'Created',
    index: true
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  estimatedDeliveryDate: Date,
  deliveredAt: Date,
  failedDetails: {
    failedAt: Date,
    reason: String,
    notes: String,
    attemptCount: { type: Number, default: 0 },
    rescheduledDate: Date,
    rescheduledTimeSlot: String,
    rescheduledAt: Date
  },
  liveLocation: {
    lat: { type: Number, default: 12.9716 },
    lng: { type: Number, default: 77.5946 },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
