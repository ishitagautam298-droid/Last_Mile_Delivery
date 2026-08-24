const Order = require('../models/Order');
const User = require('../models/User');
const TrackingAuditLog = require('../models/TrackingAuditLog');
const RateEngineService = require('./RateEngineService');
const AssignmentService = require('./AssignmentService');
const NotificationService = require('./NotificationService');

class OrderLifecycleService {
  /**
   * Generate a unique human-readable tracking number (e.g. LMD-2026-X84J9)
   */
  static generateTrackingNumber() {
    const year = new Date().getFullYear();
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `LMD-${year}-${randomHex}`;
  }

  /**
   * Create a new delivery order with auto-calculated pricing & auto-assignment
   */
  static async createOrder({
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    pickupAddress,
    dropAddress,
    packageDetails,
    orderType,
    paymentType,
    autoAssign = true,
    actor = { role: 'customer' }
  }) {
    // 1. Calculate verified rate quote
    const quote = await RateEngineService.calculateOrderQuote({
      pickupPincode: pickupAddress.pincode,
      pickupArea: pickupAddress.area,
      pickupCity: pickupAddress.city,
      dropPincode: dropAddress.pincode,
      dropArea: dropAddress.area,
      dropCity: dropAddress.city,
      lengthCm: packageDetails.lengthCm,
      breadthCm: packageDetails.breadthCm,
      heightCm: packageDetails.heightCm,
      actualWeightKg: packageDetails.actualWeightKg,
      orderType,
      paymentType
    });

    const trackingNumber = this.generateTrackingNumber();

    // 2. Instantiate Order
    const order = new Order({
      trackingNumber,
      customer: customerId,
      customerName,
      customerEmail,
      customerPhone,
      pickupAddress: {
        ...pickupAddress,
        coordinates: pickupAddress.coordinates || { lat: 12.9716, lng: 77.5946 }
      },
      pickupZone: quote.pickupZone._id,
      dropAddress: {
        ...dropAddress,
        coordinates: dropAddress.coordinates || { lat: 12.9352, lng: 77.6245 }
      },
      dropZone: quote.dropZone._id,
      isZoneIntra: quote.isZoneIntra,
      packageDetails: {
        lengthCm: packageDetails.lengthCm,
        breadthCm: packageDetails.breadthCm,
        heightCm: packageDetails.heightCm,
        actualWeightKg: packageDetails.actualWeightKg,
        volumetricWeightKg: quote.packageMetrics.volumetricWeightKg,
        chargeableWeightKg: quote.packageMetrics.chargeableWeightKg,
        description: packageDetails.description || 'Standard Parcel',
        declaredValue: packageDetails.declaredValue || 1000
      },
      orderType,
      paymentType,
      pricing: {
        rateCardApplied: quote.rateCardApplied._id,
        rateCardName: quote.rateCardApplied.name,
        baseWeightLimitKg: quote.rateCardApplied.baseWeightLimitKg,
        basePrice: quote.pricing.basePrice,
        extraWeightKg: quote.pricing.extraWeightKg,
        incrementalPricePerKg: quote.pricing.incrementalPricePerKg,
        extraWeightCharge: quote.pricing.extraWeightCharge,
        codSurcharge: quote.pricing.codSurcharge,
        subtotal: quote.pricing.subtotal,
        taxPercentage: quote.pricing.taxPercentage,
        taxAmount: quote.pricing.taxAmount,
        totalAmount: quote.pricing.totalAmount,
        currency: 'INR'
      },
      status: 'Created',
      liveLocation: pickupAddress.coordinates || { lat: 12.9716, lng: 77.5946 }
    });

    await order.save();

    // 3. Create initial immutable tracking audit entry
    await TrackingAuditLog.create({
      order: order._id,
      trackingNumber: order.trackingNumber,
      previousStatus: null,
      newStatus: 'Created',
      actor: {
        role: actor.role,
        userId: actor.userId || customerId,
        name: actor.name || customerName
      },
      notes: `Order created. Chargeable weight: ${quote.packageMetrics.chargeableWeightKg}kg (${quote.packageMetrics.billedOn}). Total Amount: ₹${quote.pricing.totalAmount}.`,
      location: {
        lat: order.pickupAddress.coordinates?.lat || 12.9716,
        lng: order.pickupAddress.coordinates?.lng || 77.5946,
        description: `Pickup: ${order.pickupAddress.area}, ${order.pickupAddress.city}`
      }
    });

    // 4. Send Order Created Notification (non-blocking)
    NotificationService.notifyStatusChange(order, null, 'Created').catch(err => {
      console.warn('⚠️ Order Created notification error:', err.message);
    });

    // 5. Trigger Auto-assignment if requested
    let assignmentResult = null;
    if (autoAssign) {
      try {
        assignmentResult = await AssignmentService.autoAssignOrder(order._id, {
          role: 'system',
          name: 'Auto-Assignment Dispatcher'
        });
      } catch (assignErr) {
        console.warn('Auto-assignment queued (waiting for active agent):', assignErr.message);
      }
    }

    const savedOrder = await Order.findById(order._id)
      .populate('pickupZone dropZone assignedAgent');

    return {
      order: savedOrder,
      quote,
      assignmentResult
    };
  }

  /**
   * Update order status across lifecycle (Picked Up, In Transit, Out for Delivery, Delivered, Failed)
   */
  static async updateOrderStatus({
    orderId,
    newStatus,
    actor,
    reason = '',
    notes = '',
    location = null,
    rescheduledDate = null,
    rescheduledTimeSlot = null
  }) {
    const order = await Order.findById(orderId).populate('assignedAgent customer');
    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    const previousStatus = order.status;

    // Allowed transition logic (Agent / System / Admin)
    const validTransitions = {
      Created: ['Assigned', 'Picked Up', 'Cancelled'],
      Assigned: ['Picked Up', 'Cancelled', 'Failed'],
      'Picked Up': ['In Transit', 'Failed'],
      'In Transit': ['Out for Delivery', 'Failed'],
      'Out for Delivery': ['Delivered', 'Failed'],
      Failed: ['Rescheduled', 'Cancelled'],
      Rescheduled: ['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Cancelled'],
      Delivered: [],
      Cancelled: []
    };

    // If actor is not admin, enforce lifecycle transition rules
    if (actor.role !== 'admin') {
      const allowed = validTransitions[previousStatus] || [];
      if (!allowed.includes(newStatus)) {
        throw new Error(
          `Invalid transition from '${previousStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'None'}`
        );
      }
    }

    // Apply specific state updates
    order.status = newStatus;

    if (location && location.lat && location.lng) {
      order.liveLocation = {
        lat: location.lat,
        lng: location.lng,
        lastUpdated: new Date()
      };
    }

    if (newStatus === 'Delivered') {
      order.deliveredAt = new Date();
      if (order.assignedAgent) {
        await User.findByIdAndUpdate(order.assignedAgent, {
          $inc: { 'agentDetails.activeDeliveriesCount': -1 }
        });
      }
    } else if (newStatus === 'Failed') {
      order.failedDetails = {
        failedAt: new Date(),
        reason: reason || 'Customer unavailable / Address unreachable',
        notes: notes || 'Delivery attempt failed',
        attemptCount: (order.failedDetails?.attemptCount || 0) + 1
      };
    } else if (newStatus === 'Rescheduled') {
      order.failedDetails = {
        ...order.failedDetails,
        rescheduledDate: rescheduledDate ? new Date(rescheduledDate) : new Date(Date.now() + 86400000),
        rescheduledTimeSlot: rescheduledTimeSlot || '10:00 AM - 01:00 PM',
        rescheduledAt: new Date()
      };
    }

    await order.save();

    // Log immutable audit entry
    await TrackingAuditLog.create({
      order: order._id,
      trackingNumber: order.trackingNumber,
      previousStatus,
      newStatus,
      actor: {
        role: actor.role,
        userId: actor.userId,
        name: actor.name || (actor.role === 'agent' ? order.assignedAgent?.name : actor.role)
      },
      reason,
      notes: notes || `Status updated from ${previousStatus} to ${newStatus}`,
      location: location || {
        lat: order.liveLocation?.lat || 12.9716,
        lng: order.liveLocation?.lng || 77.5946,
        description: `Status: ${newStatus}`
      }
    });

    // Trigger customer notification (non-blocking)
    NotificationService.notifyStatusChange(order, previousStatus, newStatus, {
      reason,
      notes,
      rescheduledDate,
      rescheduledTimeSlot
    }).catch(err => {
      console.warn('⚠️ Status Change notification error:', err.message);
    });

    // If rescheduled, trigger auto-reassignment for the new attempt!
    if (newStatus === 'Rescheduled') {
      try {
        await AssignmentService.autoAssignOrder(order._id, {
          role: 'system',
          name: 'Reschedule Reassignment Dispatcher'
        });
      } catch (err) {
        console.warn('Reassignment queued for rescheduled order:', err.message);
      }
    }

    return await Order.findById(order._id).populate('pickupZone dropZone assignedAgent');
  }

  /**
   * Reschedule order by customer
   */
  static async rescheduleOrder({
    orderId,
    customerUser,
    rescheduledDate,
    rescheduledTimeSlot,
    notes = ''
  }) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found.');

    if (order.status !== 'Failed') {
      throw new Error(`Only failed orders can be rescheduled. Current status is ${order.status}`);
    }

    return await this.updateOrderStatus({
      orderId,
      newStatus: 'Rescheduled',
      actor: {
        role: 'customer',
        userId: customerUser._id,
        name: customerUser.name
      },
      reason: 'Customer requested delivery rescheduling',
      notes: notes || `Rescheduled to ${rescheduledDate} (${rescheduledTimeSlot})`,
      rescheduledDate,
      rescheduledTimeSlot
    });
  }
}

module.exports = OrderLifecycleService;
