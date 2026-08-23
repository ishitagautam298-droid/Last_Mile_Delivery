const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const OrderLifecycleService = require('../services/OrderLifecycleService');
const AssignmentService = require('../services/AssignmentService');
const RateEngineService = require('../services/RateEngineService');
const { protect, authorize } = require('../middleware/auth');

// POST /api/orders (Create Order by Customer or Admin)
router.post('/', protect, async (req, res) => {
  try {
    const {
      customerId: targetCustomerId,
      customerName,
      customerEmail,
      customerPhone,
      pickupAddress,
      dropAddress,
      packageDetails,
      orderType,
      paymentType,
      autoAssign = true
    } = req.body;

    let customerId = req.user._id;
    let effectiveCustomerName = req.user.name;
    let effectiveCustomerEmail = req.user.email;
    let effectiveCustomerPhone = req.user.phone;

    // If admin is creating on behalf of a customer
    if (req.user.role === 'admin' && targetCustomerId) {
      const targetUser = await User.findById(targetCustomerId);
      if (targetUser) {
        customerId = targetUser._id;
        effectiveCustomerName = targetUser.name;
        effectiveCustomerEmail = targetUser.email;
        effectiveCustomerPhone = targetUser.phone;
      } else if (customerName && customerEmail) {
        // Admin entered customer details directly
        effectiveCustomerName = customerName;
        effectiveCustomerEmail = customerEmail;
        effectiveCustomerPhone = customerPhone || '+91 98765 43210';
      }
    }

    const result = await OrderLifecycleService.createOrder({
      customerId,
      customerName: effectiveCustomerName,
      customerEmail: effectiveCustomerEmail,
      customerPhone: effectiveCustomerPhone,
      pickupAddress,
      dropAddress,
      packageDetails,
      orderType,
      paymentType,
      autoAssign,
      actor: {
        role: req.user.role,
        userId: req.user._id,
        name: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: result.order,
      quote: result.quote,
      assignmentResult: result.assignmentResult
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/orders (Admin / Authorized: List all orders with filters)
router.get('/', protect, async (req, res) => {
  try {
    const { status, zone, agent, orderType, paymentType, search } = req.query;
    let filter = {};

    // Customer can only see their own orders unless admin
    if (req.user.role === 'customer') {
      filter.customer = req.user._id;
    } else if (req.user.role === 'agent') {
      filter.assignedAgent = req.user._id;
    } else if (req.user.role === 'admin') {
      if (status && status !== 'all') filter.status = status;
      if (zone && zone !== 'all') {
        filter.$or = [{ pickupZone: zone }, { dropZone: zone }];
      }
      if (agent && agent !== 'all') filter.assignedAgent = agent;
      if (orderType && orderType !== 'all') filter.orderType = orderType;
      if (paymentType && paymentType !== 'all') filter.paymentType = paymentType;
    }

    if (search) {
      filter.$or = [
        { trackingNumber: new RegExp(search.trim(), 'i') },
        { customerName: new RegExp(search.trim(), 'i') },
        { 'dropAddress.city': new RegExp(search.trim(), 'i') },
        { 'pickupAddress.city': new RegExp(search.trim(), 'i') }
      ];
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('assignedAgent', 'name email phone agentDetails')
      .populate('pickupZone dropZone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/my-orders (Customer specific)
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('assignedAgent', 'name phone agentDetails')
      .populate('pickupZone dropZone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/agent-tasks (Delivery Agent specific)
router.get('/agent-tasks', protect, authorize('agent', 'admin'), async (req, res) => {
  try {
    const agentId = req.user._id;
    const orders = await Order.find({ assignedAgent: agentId })
      .populate('customer', 'name email phone')
      .populate('pickupZone dropZone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id (Get single order)
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('assignedAgent', 'name email phone agentDetails')
      .populate('pickupZone dropZone')
      .populate('pricing.rateCardApplied');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Ensure authorization
    if (
      req.user.role === 'customer' &&
      order.customer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order.' });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/status (Agent / Admin updates status)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, reason, notes, location, rescheduledDate, rescheduledTimeSlot } = req.body;

    const updatedOrder = await OrderLifecycleService.updateOrderStatus({
      orderId: req.params.id,
      newStatus: status,
      actor: {
        role: req.user.role,
        userId: req.user._id,
        name: req.user.name
      },
      reason,
      notes,
      location,
      rescheduledDate,
      rescheduledTimeSlot
    });

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/orders/:id/auto-assign (Trigger auto-assignment)
router.post('/:id/auto-assign', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await AssignmentService.autoAssignOrder(req.params.id, {
      role: 'admin',
      userId: req.user._id,
      name: `${req.user.name} (Auto-Triggered)`
    });

    res.json({
      success: true,
      message: 'Auto-assignment executed successfully',
      result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/orders/:id/manual-assign (Admin manually assign)
router.post('/:id/manual-assign', protect, authorize('admin'), async (req, res) => {
  try {
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ success: false, message: 'agentId is required' });

    const result = await AssignmentService.manuallyAssignOrder(req.params.id, agentId, req.user);

    res.json({
      success: true,
      message: 'Agent manually assigned successfully',
      result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/orders/:id/reschedule (Customer reschedules failed order)
router.post('/:id/reschedule', protect, async (req, res) => {
  try {
    const { rescheduledDate, rescheduledTimeSlot, notes } = req.body;
    if (!rescheduledDate) {
      return res.status(400).json({ success: false, message: 'Please provide a valid rescheduled date.' });
    }

    const order = await OrderLifecycleService.rescheduleOrder({
      orderId: req.params.id,
      customerUser: req.user,
      rescheduledDate,
      rescheduledTimeSlot: rescheduledTimeSlot || '10:00 AM - 01:00 PM',
      notes
    });

    res.json({
      success: true,
      message: 'Order rescheduled successfully. A delivery agent has been queued for reassignment.',
      order
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/override (Admin override any order status)
router.put('/:id/override', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, notes, reason } = req.body;
    const order = await OrderLifecycleService.updateOrderStatus({
      orderId: req.params.id,
      newStatus: status,
      actor: {
        role: 'admin',
        userId: req.user._id,
        name: `${req.user.name} (Admin Override)`
      },
      reason: reason || 'Administrative Override',
      notes: notes || 'Status overridden by Administrator'
    });

    res.json({
      success: true,
      message: `Admin override applied: Status is now ${status}`,
      order
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
