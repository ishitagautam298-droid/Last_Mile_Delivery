const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const TrackingAuditLog = require('../models/TrackingAuditLog');
const NotificationLog = require('../models/NotificationLog');

// GET /api/track/:trackingNumber (Public tracking endpoint)
router.get('/:trackingNumber', async (req, res) => {
  try {
    const trackingNumber = req.params.trackingNumber.trim().toUpperCase();

    const order = await Order.findOne({ trackingNumber })
      .populate('pickupZone dropZone')
      .populate('assignedAgent', 'name phone agentDetails vehicleType')
      .populate('pricing.rateCardApplied');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Shipment with tracking number '${trackingNumber}' not found.`
      });
    }

    // Fetch immutable audit logs
    const timeline = await TrackingAuditLog.find({ order: order._id })
      .sort({ timestamp: 1 });

    // Fetch notifications
    const notifications = await NotificationLog.find({ trackingNumber })
      .sort({ sentAt: -1 });

    res.json({
      success: true,
      order,
      timeline,
      notifications
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/track/:trackingNumber/notifications
router.get('/:trackingNumber/notifications', async (req, res) => {
  try {
    const trackingNumber = req.params.trackingNumber.trim().toUpperCase();
    const notifications = await NotificationLog.find({ trackingNumber }).sort({ sentAt: -1 });
    res.json({ success: true, count: notifications.length, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
