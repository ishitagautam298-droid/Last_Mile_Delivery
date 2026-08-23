const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['customer', 'agent', 'admin'],
    default: 'customer'
  },
  phone: {
    type: String,
    trim: true,
    default: '+91 98765 43210'
  },
  agentDetails: {
    assignedZone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone'
    },
    currentLocation: {
      lat: { type: Number, default: 23.2332 },
      lng: { type: Number, default: 77.4344 },
      address: { type: String, default: 'Bhopal Central Hub' },
      updatedAt: { type: Date, default: Date.now }
    },
    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available'
    },
    maxActiveDeliveries: {
      type: Number,
      default: 5
    },
    activeDeliveriesCount: {
      type: Number,
      default: 0
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'van', 'scooter', 'truck'],
      default: 'bike'
    }
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
