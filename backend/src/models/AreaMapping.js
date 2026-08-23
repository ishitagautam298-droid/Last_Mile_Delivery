const mongoose = require('mongoose');

const areaMappingSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    index: true
  },
  areaName: {
    type: String,
    required: [true, 'Area name is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    default: 'Karnataka',
    trim: true
  },
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: [true, 'Assigned Zone is required']
  },
  approxCoordinates: {
    lat: { type: Number, default: 12.9716 },
    lng: { type: Number, default: 77.5946 }
  }
}, {
  timestamps: true
});

areaMappingSchema.index({ pincode: 1, areaName: 1 });

module.exports = mongoose.model('AreaMapping', areaMappingSchema);
