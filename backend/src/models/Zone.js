const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Zone name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Zone code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  centerCoordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Zone', zoneSchema);
