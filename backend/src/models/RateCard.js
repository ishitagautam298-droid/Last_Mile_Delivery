const mongoose = require('mongoose');

const rateCardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  orderType: {
    type: String,
    enum: ['B2B', 'B2C'],
    required: true
  },
  scope: {
    type: String,
    enum: ['intra_zone', 'inter_zone'],
    required: true
  },
  baseWeightLimitKg: {
    type: Number,
    required: true,
    default: 0.5,
    min: 0.1
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  incrementalPricePerKg: {
    type: Number,
    required: true,
    min: 0
  },
  codSurchargeType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed'
  },
  codSurchargeValue: {
    type: Number,
    default: 30,
    min: 0
  },
  minCodFee: {
    type: Number,
    default: 25,
    min: 0
  },
  taxPercentage: {
    type: Number,
    default: 18, // 18% GST
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

rateCardSchema.index({ orderType: 1, scope: 1, isActive: 1 });

module.exports = mongoose.model('RateCard', rateCardSchema);
