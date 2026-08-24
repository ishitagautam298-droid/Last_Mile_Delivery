const User = require('../models/User');
const Order = require('../models/Order');
const TrackingAuditLog = require('../models/TrackingAuditLog');
const NotificationService = require('./NotificationService');

class AssignmentService {
  /**
   * Calculate Haversine distance between two lat/lng coordinates in kilometers
   */
  static calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 9999;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  /**
   * Auto-assign the nearest and best available delivery agent for an order
   */
  static async autoAssignOrder(orderId, systemActor = { role: 'system', name: 'Auto-Assignment Dispatcher' }) {
    const order = await Order.findById(orderId).populate('pickupZone dropZone');
    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      throw new Error(`Cannot assign order in ${order.status} state.`);
    }

    // Pickup reference coordinates
    const pickupLat = order.pickupAddress.coordinates?.lat || 12.9716;
    const pickupLng = order.pickupAddress.coordinates?.lng || 77.5946;

    // Find all available agents who have capacity
    const eligibleAgents = await User.find({
      role: 'agent',
      'agentDetails.status': 'available',
      $expr: {
        $lt: ['$agentDetails.activeDeliveriesCount', '$agentDetails.maxActiveDeliveries']
      }
    }).populate('agentDetails.assignedZone');

    if (!eligibleAgents || eligibleAgents.length === 0) {
      // Fallback: Check agents in 'available' status even if at soft capacity
      const fallbackAgents = await User.find({
        role: 'agent',
        'agentDetails.status': { $ne: 'offline' }
      });

      if (!fallbackAgents || fallbackAgents.length === 0) {
        throw new Error('No delivery agents currently online/available for auto-assignment.');
      }
    }

    const candidatePool = eligibleAgents.length > 0 ? eligibleAgents : await User.find({ role: 'agent' });

    // Score and rank candidates based on:
    // 1. Zone match bonus
    // 2. Proximity (Haversine distance to pickup location)
    // 3. Workload (current active deliveries)
    const rankedAgents = candidatePool.map(agent => {
      const agentLat = agent.agentDetails?.currentLocation?.lat || 12.9716;
      const agentLng = agent.agentDetails?.currentLocation?.lng || 77.5946;
      const distanceKm = this.calculateDistanceKm(pickupLat, pickupLng, agentLat, agentLng);

      const isSameZone = order.pickupZone && agent.agentDetails?.assignedZone &&
        agent.agentDetails.assignedZone._id?.toString() === order.pickupZone._id?.toString();

      const load = agent.agentDetails?.activeDeliveriesCount || 0;

      // Score formula: lower is better
      // Base score = distance in km
      // Zone match discount: -3 km equivalent advantage
      // Load penalty: +2 km per existing active order
      let score = distanceKm + (load * 2.0);
      if (isSameZone) score -= 3.0;

      return {
        agent,
        distanceKm,
        isSameZone,
        load,
        score
      };
    });

    rankedAgents.sort((a, b) => a.score - b.score);
    const bestCandidate = rankedAgents[0];
    const selectedAgent = bestCandidate.agent;

    // If order was already assigned to another agent, decrement old agent count
    if (order.assignedAgent && order.assignedAgent.toString() !== selectedAgent._id.toString()) {
      await User.findByIdAndUpdate(order.assignedAgent, {
        $inc: { 'agentDetails.activeDeliveriesCount': -1 }
      });
    }

    const previousStatus = order.status;
    const newStatus = ['Created', 'Rescheduled'].includes(order.status) ? 'Assigned' : order.status;

    order.assignedAgent = selectedAgent._id;
    order.assignedAt = new Date();
    order.status = newStatus;
    await order.save();

    // Increment selected agent active count
    await User.findByIdAndUpdate(selectedAgent._id, {
      $inc: { 'agentDetails.activeDeliveriesCount': 1 }
    });

    // Create Immutable Tracking Audit Log
    await TrackingAuditLog.create({
      order: order._id,
      trackingNumber: order.trackingNumber,
      previousStatus,
      newStatus,
      actor: systemActor,
      notes: `Intelligently auto-assigned to agent ${selectedAgent.name} (Distance: ${bestCandidate.distanceKm} km, Zone Match: ${bestCandidate.isSameZone ? 'Yes' : 'No'}, Current Load: ${bestCandidate.load}).`,
      location: {
        lat: pickupLat,
        lng: pickupLng,
        description: `Pickup Area: ${order.pickupAddress.area}, ${order.pickupAddress.city}`
      }
    });

    NotificationService.notifyAssignment(order, selectedAgent).catch(err => {
      console.warn('⚠️ Auto assignment notification error:', err.message);
    });

    return {
      success: true,
      order,
      assignedAgent: {
        id: selectedAgent._id,
        name: selectedAgent.name,
        email: selectedAgent.email,
        phone: selectedAgent.phone,
        vehicleType: selectedAgent.agentDetails?.vehicleType
      },
      assignmentMetrics: {
        distanceKm: bestCandidate.distanceKm,
        isSameZone: bestCandidate.isSameZone,
        score: bestCandidate.score
      }
    };
  }

  /**
   * Manually assign an agent by Admin
   */
  static async manuallyAssignOrder(orderId, agentId, adminUser) {
    const order = await Order.findById(orderId).populate('pickupZone dropZone');
    if (!order) throw new Error('Order not found.');

    const agent = await User.findOne({ _id: agentId, role: 'agent' });
    if (!agent) throw new Error('Selected delivery agent not found or invalid.');

    // Adjust old agent load if reassigned
    if (order.assignedAgent && order.assignedAgent.toString() !== agent._id.toString()) {
      await User.findByIdAndUpdate(order.assignedAgent, {
        $inc: { 'agentDetails.activeDeliveriesCount': -1 }
      });
    }

    const previousStatus = order.status;
    const newStatus = ['Created', 'Rescheduled'].includes(order.status) ? 'Assigned' : order.status;

    order.assignedAgent = agent._id;
    order.assignedAt = new Date();
    order.status = newStatus;
    await order.save();

    await User.findByIdAndUpdate(agent._id, {
      $inc: { 'agentDetails.activeDeliveriesCount': 1 }
    });

    await TrackingAuditLog.create({
      order: order._id,
      trackingNumber: order.trackingNumber,
      previousStatus,
      newStatus,
      actor: {
        role: 'admin',
        userId: adminUser._id,
        name: adminUser.name || 'Admin Dispatcher'
      },
      notes: `Manually assigned to delivery agent ${agent.name} by Admin.`,
      location: {
        lat: order.pickupAddress?.coordinates?.lat || 23.2332,
        lng: order.pickupAddress?.coordinates?.lng || 77.4344,
        description: `Pickup Hub: ${order.pickupAddress?.area || 'Bhopal'}`
      }
    });

    NotificationService.notifyAssignment(order, agent).catch(err => {
      console.warn('⚠️ Manual assignment notification error:', err.message);
    });

    return {
      success: true,
      order,
      assignedAgent: agent
    };
  }
}

module.exports = AssignmentService;
