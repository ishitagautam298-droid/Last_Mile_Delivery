const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Zone = require('../models/Zone');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_lastmile_2026', {
    expiresIn: '30d'
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, agentDetails } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'customer',
      phone: phone || '+91 98765 43210',
      agentDetails: role === 'agent' ? {
        assignedZone: agentDetails?.assignedZone,
        status: agentDetails?.status || 'available',
        vehicleType: agentDetails?.vehicleType || 'bike',
        maxActiveDeliveries: agentDetails?.maxActiveDeliveries || 5,
        currentLocation: agentDetails?.currentLocation || { lat: 12.9716, lng: 77.5946, address: 'Bangalore Central' }
      } : undefined
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        agentDetails: user.agentDetails
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('agentDetails.assignedZone');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        agentDetails: user.agentDetails
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('agentDetails.assignedZone');
    res.json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/agent-status (Agents update duty status & location)
router.put('/agent-status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({ success: false, message: 'Only delivery agents can update agent status.' });
    }

    const { status, lat, lng, address } = req.body;
    const user = await User.findById(req.user._id);

    if (status) user.agentDetails.status = status;
    if (lat && lng) {
      user.agentDetails.currentLocation = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: address || user.agentDetails.currentLocation?.address || 'Bangalore',
        updatedAt: new Date()
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Agent status updated successfully',
      agentDetails: user.agentDetails
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/agents (List all agents for assignment)
router.get('/agents', protect, async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' })
      .populate('agentDetails.assignedZone')
      .select('-password');

    res.json({
      success: true,
      count: agents.length,
      agents
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
