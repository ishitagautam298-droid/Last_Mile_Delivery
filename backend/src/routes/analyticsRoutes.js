const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Zone = require('../models/Zone');
const { protect, authorize } = require('../middleware/auth');

// GET /api/analytics/dashboard (Admin overview metrics)
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const activeOrders = await Order.countDocuments({
      status: { $in: ['Created', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Rescheduled'] }
    });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const failedOrders = await Order.countDocuments({ status: 'Failed' });

    const totalRevenueAgg = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    const b2bOrders = await Order.countDocuments({ orderType: 'B2B' });
    const b2cOrders = await Order.countDocuments({ orderType: 'B2C' });
    const codOrders = await Order.countDocuments({ paymentType: 'COD' });
    const prepaidOrders = await Order.countDocuments({ paymentType: 'Prepaid' });

    const totalAgents = await User.countDocuments({ role: 'agent' });
    const activeAgents = await User.countDocuments({
      role: 'agent',
      'agentDetails.status': 'available'
    });
    const totalZones = await Zone.countDocuments();

    // Recent 10 orders
    const recentOrders = await Order.find()
      .populate('pickupZone dropZone assignedAgent')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      metrics: {
        totalOrders,
        activeOrders,
        deliveredOrders,
        failedOrders,
        failedRatePercentage: totalOrders > 0 ? parseFloat(((failedOrders / totalOrders) * 100).toFixed(1)) : 0,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        b2bOrders,
        b2cOrders,
        codOrders,
        prepaidOrders,
        totalAgents,
        activeAgents,
        totalZones
      },
      recentOrders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
