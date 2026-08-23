const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const Zone = require('../models/Zone');
const AreaMapping = require('../models/AreaMapping');
const RateCard = require('../models/RateCard');
const Order = require('../models/Order');
const TrackingAuditLog = require('../models/TrackingAuditLog');
const NotificationLog = require('../models/NotificationLog');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lastmile_delivery_tracker';
    await mongoose.connect(mongoUri);
    console.log('🌱 Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Zone.deleteMany({}),
      AreaMapping.deleteMany({}),
      RateCard.deleteMany({}),
      Order.deleteMany({}),
      TrackingAuditLog.deleteMany({}),
      NotificationLog.deleteMany({})
    ]);

    console.log('🧹 Cleared old collections.');

    // 1. Seed Zones
    const zones = await Zone.insertMany([
      {
        name: 'Central Metro Hub',
        code: 'CM-01',
        city: 'Bangalore',
        description: 'Downtown commercial and central district',
        centerCoordinates: { lat: 12.9716, lng: 77.5946 },
        isActive: true
      },
      {
        name: 'South Zone (Tech Corridor)',
        code: 'SZ-01',
        city: 'Bangalore',
        description: 'Koramangala, HSR Layout, BTM & Electronic City',
        centerCoordinates: { lat: 12.9141, lng: 77.6411 },
        isActive: true
      },
      {
        name: 'East Zone (IT & Residential)',
        code: 'EZ-01',
        city: 'Bangalore',
        description: 'Indiranagar, Whitefield, Marathahalli',
        centerCoordinates: { lat: 12.9719, lng: 77.6412 },
        isActive: true
      },
      {
        name: 'North Zone (Airport Corridor)',
        code: 'NZ-01',
        city: 'Bangalore',
        description: 'Hebbal, Yelahanka, Manyata Tech Park',
        centerCoordinates: { lat: 13.0358, lng: 77.5970 },
        isActive: true
      },
      {
        name: 'West Zone (Industrial & Commercial)',
        code: 'WZ-01',
        city: 'Bangalore',
        description: 'Rajajinagar, Malleshwaram, Peenya',
        centerCoordinates: { lat: 12.9915, lng: 77.5562 },
        isActive: true
      }
    ]);

    console.log(`✅ Seeded ${zones.length} Zones.`);

    const cmZone = zones[0];
    const szZone = zones[1];
    const ezZone = zones[2];
    const nzZone = zones[3];
    const wzZone = zones[4];

    // 2. Seed Area Mappings
    const areaMappings = await AreaMapping.insertMany([
      // Central Metro
      { pincode: '560001', areaName: 'MG Road', city: 'Bangalore', state: 'Karnataka', zone: cmZone._id, approxCoordinates: { lat: 12.9756, lng: 77.6066 } },
      { pincode: '560025', areaName: 'Richmond Town', city: 'Bangalore', state: 'Karnataka', zone: cmZone._id, approxCoordinates: { lat: 12.9634, lng: 77.6041 } },
      { pincode: '560052', areaName: 'Vasanth Nagar', city: 'Bangalore', state: 'Karnataka', zone: cmZone._id, approxCoordinates: { lat: 12.9898, lng: 77.5898 } },

      // South Zone
      { pincode: '560034', areaName: 'Koramangala 4th Block', city: 'Bangalore', state: 'Karnataka', zone: szZone._id, approxCoordinates: { lat: 12.9352, lng: 77.6245 } },
      { pincode: '560095', areaName: 'Koramangala 8th Block', city: 'Bangalore', state: 'Karnataka', zone: szZone._id, approxCoordinates: { lat: 12.9392, lng: 77.6189 } },
      { pincode: '560102', areaName: 'HSR Layout Sector 1', city: 'Bangalore', state: 'Karnataka', zone: szZone._id, approxCoordinates: { lat: 12.9121, lng: 77.6446 } },
      { pincode: '560068', areaName: 'BTM Layout 2nd Stage', city: 'Bangalore', state: 'Karnataka', zone: szZone._id, approxCoordinates: { lat: 12.9166, lng: 77.6101 } },
      { pincode: '560100', areaName: 'Electronic City Phase 1', city: 'Bangalore', state: 'Karnataka', zone: szZone._id, approxCoordinates: { lat: 12.8452, lng: 77.6602 } },

      // East Zone
      { pincode: '560038', areaName: 'Indiranagar 100ft Road', city: 'Bangalore', state: 'Karnataka', zone: ezZone._id, approxCoordinates: { lat: 12.9784, lng: 77.6408 } },
      { pincode: '560008', areaName: 'HAL Old Airport Road', city: 'Bangalore', state: 'Karnataka', zone: ezZone._id, approxCoordinates: { lat: 12.9567, lng: 77.6521 } },
      { pincode: '560066', areaName: 'Whitefield ITPL', city: 'Bangalore', state: 'Karnataka', zone: ezZone._id, approxCoordinates: { lat: 12.9698, lng: 77.7499 } },
      { pincode: '560037', areaName: 'Marathahalli Bridge', city: 'Bangalore', state: 'Karnataka', zone: ezZone._id, approxCoordinates: { lat: 12.9591, lng: 77.6974 } },

      // North Zone
      { pincode: '560024', areaName: 'Hebbal Flyover', city: 'Bangalore', state: 'Karnataka', zone: nzZone._id, approxCoordinates: { lat: 13.0358, lng: 77.5970 } },
      { pincode: '560045', areaName: 'Manyata Tech Park', city: 'Bangalore', state: 'Karnataka', zone: nzZone._id, approxCoordinates: { lat: 13.0454, lng: 77.6200 } },
      { pincode: '560064', areaName: 'Yelahanka New Town', city: 'Bangalore', state: 'Karnataka', zone: nzZone._id, approxCoordinates: { lat: 13.1007, lng: 77.5963 } },

      // West Zone
      { pincode: '560010', areaName: 'Rajajinagar 1st Block', city: 'Bangalore', state: 'Karnataka', zone: wzZone._id, approxCoordinates: { lat: 12.9915, lng: 77.5562 } },
      { pincode: '560003', areaName: 'Malleshwaram 8th Cross', city: 'Bangalore', state: 'Karnataka', zone: wzZone._id, approxCoordinates: { lat: 13.0031, lng: 77.5703 } }
    ]);

    console.log(`✅ Seeded ${areaMappings.length} Area Mappings.`);

    // 3. Seed Rate Cards (Configurable, No hardcoding)
    const rateCards = await RateCard.insertMany([
      {
        name: 'B2C Standard Intra-Zone Rate',
        orderType: 'B2C',
        scope: 'intra_zone',
        baseWeightLimitKg: 0.5,
        basePrice: 45.0,
        incrementalPricePerKg: 20.0,
        codSurchargeType: 'fixed',
        codSurchargeValue: 25.0,
        minCodFee: 20.0,
        taxPercentage: 18.0,
        isActive: true,
        description: 'Standard consumer delivery within the same municipal zone.'
      },
      {
        name: 'B2C Express Inter-Zone Rate',
        orderType: 'B2C',
        scope: 'inter_zone',
        baseWeightLimitKg: 0.5,
        basePrice: 85.0,
        incrementalPricePerKg: 35.0,
        codSurchargeType: 'fixed',
        codSurchargeValue: 35.0,
        minCodFee: 25.0,
        taxPercentage: 18.0,
        isActive: true,
        description: 'Cross-zone consumer delivery across disparate city zones.'
      },
      {
        name: 'B2B Freight Intra-Zone Rate',
        orderType: 'B2B',
        scope: 'intra_zone',
        baseWeightLimitKg: 5.0,
        basePrice: 180.0,
        incrementalPricePerKg: 15.0,
        codSurchargeType: 'percentage',
        codSurchargeValue: 2.0,
        minCodFee: 50.0,
        taxPercentage: 18.0,
        isActive: true,
        description: 'Commercial B2B shipment with 5kg base slab within same zone.'
      },
      {
        name: 'B2B Enterprise Inter-Zone Rate',
        orderType: 'B2B',
        scope: 'inter_zone',
        baseWeightLimitKg: 5.0,
        basePrice: 380.0,
        incrementalPricePerKg: 25.0,
        codSurchargeType: 'percentage',
        codSurchargeValue: 2.5,
        minCodFee: 75.0,
        taxPercentage: 18.0,
        isActive: true,
        description: 'High-volume commercial logistics between cross-city zones.'
      }
    ]);

    console.log(`✅ Seeded ${rateCards.length} Rate Cards.`);

    // 4. Seed Users (Admin, Delivery Agents, Customers)
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123', salt);
    const agentPassword = await bcrypt.hash('Agent@123', salt);
    const customerPassword = await bcrypt.hash('Customer@123', salt);

    const users = await User.insertMany([
      // Admin
      {
        name: 'Logistics Operations Admin',
        email: 'admin@lastmile.com',
        password: adminPassword,
        role: 'admin',
        phone: '+91 98111 22233'
      },
      // Delivery Agents
      {
        name: 'Rahul Sharma',
        email: 'rahul.agent@lastmile.com',
        password: agentPassword,
        role: 'agent',
        phone: '+91 98765 43211',
        agentDetails: {
          assignedZone: szZone._id,
          status: 'available',
          vehicleType: 'bike',
          maxActiveDeliveries: 5,
          activeDeliveriesCount: 0,
          currentLocation: { lat: 12.9352, lng: 77.6245, address: 'Koramangala 4th Block Hub', updatedAt: new Date() }
        }
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.agent@lastmile.com',
        password: agentPassword,
        role: 'agent',
        phone: '+91 98765 43212',
        agentDetails: {
          assignedZone: ezZone._id,
          status: 'available',
          vehicleType: 'van',
          maxActiveDeliveries: 8,
          activeDeliveriesCount: 0,
          currentLocation: { lat: 12.9784, lng: 77.6408, address: 'Indiranagar 100ft Hub', updatedAt: new Date() }
        }
      },
      {
        name: 'Priya Patel',
        email: 'priya.agent@lastmile.com',
        password: agentPassword,
        role: 'agent',
        phone: '+91 98765 43213',
        agentDetails: {
          assignedZone: nzZone._id,
          status: 'available',
          vehicleType: 'scooter',
          maxActiveDeliveries: 4,
          activeDeliveriesCount: 0,
          currentLocation: { lat: 13.0358, lng: 77.5970, address: 'Hebbal Hub', updatedAt: new Date() }
        }
      },
      {
        name: 'Arjun Das',
        email: 'arjun.agent@lastmile.com',
        password: agentPassword,
        role: 'agent',
        phone: '+91 98765 43214',
        agentDetails: {
          assignedZone: cmZone._id,
          status: 'available',
          vehicleType: 'bike',
          maxActiveDeliveries: 5,
          activeDeliveriesCount: 0,
          currentLocation: { lat: 12.9716, lng: 77.5946, address: 'MG Road Central Metro', updatedAt: new Date() }
        }
      },
      // Customers
      {
        name: 'Aravind Swamy',
        email: 'customer@lastmile.com',
        password: customerPassword,
        role: 'customer',
        phone: '+91 98450 11223'
      },
      {
        name: 'Ananya Deshmukh',
        email: 'ananya.deshmukh@gmail.com',
        password: customerPassword,
        role: 'customer',
        phone: '+91 98450 44556'
      },
      {
        name: 'TechCorp Supplies B2B',
        email: 'supply@techcorp.in',
        password: customerPassword,
        role: 'customer',
        phone: '+91 98450 77889'
      }
    ]);

    console.log(`✅ Seeded ${users.length} Users (Admin, 4 Delivery Agents, 3 Customers).`);

    const admin = users[0];
    const agentRahul = users[1];
    const agentVikram = users[2];
    const agentPriya = users[3];
    const customerAravind = users[5];
    const customerAnanya = users[6];

    // 5. Seed Sample Orders with Immutable Timeline History
    // Sample Order 1: Created (Pending Auto-Dispatch)
    const order1 = await Order.create({
      trackingNumber: 'LMD-2026-X81A1',
      customer: customerAravind._id,
      customerName: customerAravind.name,
      customerEmail: customerAravind.email,
      customerPhone: customerAravind.phone,
      pickupAddress: {
        street: 'No. 42, 80 Feet Road',
        area: 'Koramangala 4th Block',
        city: 'Bangalore',
        pincode: '560034',
        state: 'Karnataka',
        coordinates: { lat: 12.9352, lng: 77.6245 }
      },
      pickupZone: szZone._id,
      dropAddress: {
        street: '14th Cross, 17th Main',
        area: 'HSR Layout Sector 1',
        city: 'Bangalore',
        pincode: '560102',
        state: 'Karnataka',
        coordinates: { lat: 12.9121, lng: 77.6446 }
      },
      dropZone: szZone._id,
      isZoneIntra: true,
      packageDetails: {
        lengthCm: 25,
        breadthCm: 20,
        heightCm: 15,
        actualWeightKg: 1.2,
        volumetricWeightKg: 1.5, // (25*20*15)/5000 = 1.5kg
        chargeableWeightKg: 1.5, // max(1.2, 1.5) = 1.5kg
        description: 'Electronics Accessories Box',
        declaredValue: 2500
      },
      orderType: 'B2C',
      paymentType: 'Prepaid',
      pricing: {
        rateCardApplied: rateCards[0]._id,
        rateCardName: rateCards[0].name,
        baseWeightLimitKg: 0.5,
        basePrice: 45.0,
        extraWeightKg: 1.0,
        incrementalPricePerKg: 20.0,
        extraWeightCharge: 20.0,
        codSurcharge: 0,
        subtotal: 65.0,
        taxPercentage: 18.0,
        taxAmount: 11.7,
        totalAmount: 76.7,
        currency: 'INR'
      },
      status: 'Created',
      liveLocation: { lat: 12.9352, lng: 77.6245, lastUpdated: new Date() }
    });

    await TrackingAuditLog.create({
      order: order1._id,
      trackingNumber: order1.trackingNumber,
      previousStatus: null,
      newStatus: 'Created',
      actor: { role: 'customer', userId: customerAravind._id, name: customerAravind.name },
      notes: 'Order placed by customer via web portal. Chargeable weight: 1.5kg (volumetric). Total: ₹76.70',
      location: { lat: 12.9352, lng: 77.6245, description: 'Pickup: Koramangala 4th Block' }
    });

    // Sample Order 2: In Transit (Assigned to Rahul)
    const order2 = await Order.create({
      trackingNumber: 'LMD-2026-B94K2',
      customer: customerAnanya._id,
      customerName: customerAnanya.name,
      customerEmail: customerAnanya.email,
      customerPhone: customerAnanya.phone,
      pickupAddress: {
        street: 'Building 5, Manyata Embassy Park',
        area: 'Manyata Tech Park',
        city: 'Bangalore',
        pincode: '560045',
        state: 'Karnataka',
        coordinates: { lat: 13.0454, lng: 77.6200 }
      },
      pickupZone: nzZone._id,
      dropAddress: {
        street: '77, 12th Main Road',
        area: 'Indiranagar 100ft Road',
        city: 'Bangalore',
        pincode: '560038',
        state: 'Karnataka',
        coordinates: { lat: 12.9784, lng: 77.6408 }
      },
      dropZone: ezZone._id,
      isZoneIntra: false,
      packageDetails: {
        lengthCm: 40,
        breadthCm: 30,
        heightCm: 25,
        actualWeightKg: 4.5,
        volumetricWeightKg: 6.0, // (40*30*25)/5000 = 6.0kg
        chargeableWeightKg: 6.0,
        description: 'Office Documentation & Equipment',
        declaredValue: 8000
      },
      orderType: 'B2B',
      paymentType: 'COD',
      pricing: {
        rateCardApplied: rateCards[3]._id,
        rateCardName: rateCards[3].name,
        baseWeightLimitKg: 5.0,
        basePrice: 380.0,
        extraWeightKg: 1.0,
        incrementalPricePerKg: 25.0,
        extraWeightCharge: 25.0,
        codSurcharge: 75.0,
        subtotal: 480.0,
        taxPercentage: 18.0,
        taxAmount: 86.4,
        totalAmount: 566.4,
        currency: 'INR'
      },
      status: 'In Transit',
      assignedAgent: agentVikram._id,
      assignedAt: new Date(Date.now() - 3600000 * 3),
      liveLocation: { lat: 13.0120, lng: 77.6310, lastUpdated: new Date() }
    });

    await User.findByIdAndUpdate(agentVikram._id, { $inc: { 'agentDetails.activeDeliveriesCount': 1 } });

    await TrackingAuditLog.insertMany([
      {
        order: order2._id,
        trackingNumber: order2.trackingNumber,
        previousStatus: null,
        newStatus: 'Created',
        actor: { role: 'customer', userId: customerAnanya._id, name: customerAnanya.name },
        timestamp: new Date(Date.now() - 3600000 * 5),
        notes: 'Order initiated. Inter-zone B2B delivery.'
      },
      {
        order: order2._id,
        trackingNumber: order2.trackingNumber,
        previousStatus: 'Created',
        newStatus: 'Assigned',
        actor: { role: 'system', name: 'Auto-Assignment Dispatcher' },
        timestamp: new Date(Date.now() - 3600000 * 4),
        notes: `Auto-assigned to delivery agent Vikram Singh (Van). Distance: 3.2 km.`
      },
      {
        order: order2._id,
        trackingNumber: order2.trackingNumber,
        previousStatus: 'Assigned',
        newStatus: 'Picked Up',
        actor: { role: 'agent', userId: agentVikram._id, name: agentVikram.name },
        timestamp: new Date(Date.now() - 3600000 * 2),
        notes: 'Package collected from Manyata Tech Park Hub.'
      },
      {
        order: order2._id,
        trackingNumber: order2.trackingNumber,
        previousStatus: 'Picked Up',
        newStatus: 'In Transit',
        actor: { role: 'agent', userId: agentVikram._id, name: agentVikram.name },
        timestamp: new Date(Date.now() - 3600000 * 1),
        notes: 'Package in transit along Outer Ring Road towards East Zone Hub.'
      }
    ]);

    // Sample Order 3: Failed Delivery (Demonstrating the Complete Failed Delivery & Reschedule Flow)
    const order3 = await Order.create({
      trackingNumber: 'LMD-2026-F33X7',
      customer: customerAravind._id,
      customerName: customerAravind.name,
      customerEmail: customerAravind.email,
      customerPhone: customerAravind.phone,
      pickupAddress: {
        street: 'Unit 12, Brigade Road',
        area: 'MG Road',
        city: 'Bangalore',
        pincode: '560001',
        state: 'Karnataka',
        coordinates: { lat: 12.9756, lng: 77.6066 }
      },
      pickupZone: cmZone._id,
      dropAddress: {
        street: 'Flat 402, Green Glen Layout',
        area: 'HSR Layout Sector 1',
        city: 'Bangalore',
        pincode: '560102',
        state: 'Karnataka',
        coordinates: { lat: 12.9121, lng: 77.6446 }
      },
      dropZone: szZone._id,
      isZoneIntra: false,
      packageDetails: {
        lengthCm: 20,
        breadthCm: 15,
        heightCm: 10,
        actualWeightKg: 0.8,
        volumetricWeightKg: 0.6,
        chargeableWeightKg: 0.8,
        description: 'Apparel & Footwear',
        declaredValue: 3400
      },
      orderType: 'B2C',
      paymentType: 'COD',
      pricing: {
        rateCardApplied: rateCards[1]._id,
        rateCardName: rateCards[1].name,
        baseWeightLimitKg: 0.5,
        basePrice: 85.0,
        extraWeightKg: 0.3,
        incrementalPricePerKg: 35.0,
        extraWeightCharge: 35.0,
        codSurcharge: 35.0,
        subtotal: 155.0,
        taxPercentage: 18.0,
        taxAmount: 27.9,
        totalAmount: 182.9,
        currency: 'INR'
      },
      status: 'Failed',
      assignedAgent: agentRahul._id,
      failedDetails: {
        failedAt: new Date(Date.now() - 1800000),
        reason: 'Customer Unavailable / Door Locked',
        notes: 'Doorbell rang 3 times, customer phone was unreachable at delivery location.',
        attemptCount: 1
      },
      liveLocation: { lat: 12.9121, lng: 77.6446, lastUpdated: new Date() }
    });

    await TrackingAuditLog.insertMany([
      {
        order: order3._id,
        trackingNumber: order3.trackingNumber,
        previousStatus: null,
        newStatus: 'Created',
        actor: { role: 'customer', userId: customerAravind._id, name: customerAravind.name },
        timestamp: new Date(Date.now() - 3600000 * 6),
        notes: 'Order placed with Cash on Delivery.'
      },
      {
        order: order3._id,
        trackingNumber: order3.trackingNumber,
        previousStatus: 'Created',
        newStatus: 'Assigned',
        actor: { role: 'system', name: 'Auto-Assignment Dispatcher' },
        timestamp: new Date(Date.now() - 3600000 * 5),
        notes: 'Auto-assigned to Rahul Sharma.'
      },
      {
        order: order3._id,
        trackingNumber: order3.trackingNumber,
        previousStatus: 'Assigned',
        newStatus: 'Out for Delivery',
        actor: { role: 'agent', userId: agentRahul._id, name: agentRahul.name },
        timestamp: new Date(Date.now() - 3600000 * 2),
        notes: 'Out for delivery to customer drop address.'
      },
      {
        order: order3._id,
        trackingNumber: order3.trackingNumber,
        previousStatus: 'Out for Delivery',
        newStatus: 'Failed',
        actor: { role: 'agent', userId: agentRahul._id, name: agentRahul.name },
        timestamp: new Date(Date.now() - 1800000),
        reason: 'Customer Unavailable / Door Locked',
        notes: 'Customer did not answer doorbell/phone. Triggered automated notification for customer rescheduling.'
      }
    ]);

    // Sample Order 4: Delivered
    const order4 = await Order.create({
      trackingNumber: 'LMD-2026-D19M4',
      customer: customerAravind._id,
      customerName: customerAravind.name,
      customerEmail: customerAravind.email,
      customerPhone: customerAravind.phone,
      pickupAddress: {
        street: '88, 100ft Road',
        area: 'Indiranagar 100ft Road',
        city: 'Bangalore',
        pincode: '560038',
        state: 'Karnataka',
        coordinates: { lat: 12.9784, lng: 77.6408 }
      },
      pickupZone: ezZone._id,
      dropAddress: {
        street: 'Plot 12, Whitefield Main Road',
        area: 'Whitefield ITPL',
        city: 'Bangalore',
        pincode: '560066',
        state: 'Karnataka',
        coordinates: { lat: 12.9698, lng: 77.7499 }
      },
      dropZone: ezZone._id,
      isZoneIntra: true,
      packageDetails: {
        lengthCm: 15,
        breadthCm: 10,
        heightCm: 5,
        actualWeightKg: 0.4,
        volumetricWeightKg: 0.15,
        chargeableWeightKg: 0.4,
        description: 'Smartwatch & Band',
        declaredValue: 4999
      },
      orderType: 'B2C',
      paymentType: 'Prepaid',
      pricing: {
        rateCardApplied: rateCards[0]._id,
        rateCardName: rateCards[0].name,
        baseWeightLimitKg: 0.5,
        basePrice: 45.0,
        extraWeightKg: 0,
        incrementalPricePerKg: 20.0,
        extraWeightCharge: 0,
        codSurcharge: 0,
        subtotal: 45.0,
        taxPercentage: 18.0,
        taxAmount: 8.1,
        totalAmount: 53.1,
        currency: 'INR'
      },
      status: 'Delivered',
      assignedAgent: agentVikram._id,
      deliveredAt: new Date(Date.now() - 3600000),
      liveLocation: { lat: 12.9698, lng: 77.7499, lastUpdated: new Date() }
    });

    await TrackingAuditLog.insertMany([
      {
        order: order4._id,
        trackingNumber: order4.trackingNumber,
        previousStatus: null,
        newStatus: 'Created',
        actor: { role: 'customer', userId: customerAravind._id, name: customerAravind.name },
        timestamp: new Date(Date.now() - 3600000 * 8),
        notes: 'Order placed.'
      },
      {
        order: order4._id,
        trackingNumber: order4.trackingNumber,
        previousStatus: 'Created',
        newStatus: 'Assigned',
        actor: { role: 'system', name: 'Auto-Assignment Dispatcher' },
        timestamp: new Date(Date.now() - 3600000 * 7),
        notes: 'Auto-assigned to Vikram Singh.'
      },
      {
        order: order4._id,
        trackingNumber: order4.trackingNumber,
        previousStatus: 'Assigned',
        newStatus: 'Picked Up',
        actor: { role: 'agent', userId: agentVikram._id, name: agentVikram.name },
        timestamp: new Date(Date.now() - 3600000 * 5),
        notes: 'Picked up from merchant.'
      },
      {
        order: order4._id,
        trackingNumber: order4.trackingNumber,
        previousStatus: 'Picked Up',
        newStatus: 'Out for Delivery',
        actor: { role: 'agent', userId: agentVikram._id, name: agentVikram.name },
        timestamp: new Date(Date.now() - 3600000 * 3),
        notes: 'Out for delivery to customer.'
      },
      {
        order: order4._id,
        trackingNumber: order4.trackingNumber,
        previousStatus: 'Out for Delivery',
        newStatus: 'Delivered',
        actor: { role: 'agent', userId: agentVikram._id, name: agentVikram.name },
        timestamp: new Date(Date.now() - 3600000),
        notes: 'Successfully delivered to customer.'
      }
    ]);

    console.log('✅ Seeded 4 Complete Orders with Audit Timelines.');
    console.log('\n=========================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Demo Credentials:');
    console.log('  👑 Admin:     admin@lastmile.com        / Admin@123');
    console.log('  🛵 Agent 1:   rahul.agent@lastmile.com   / Agent@123');
    console.log('  🛵 Agent 2:   vikram.agent@lastmile.com  / Agent@123');
    console.log('  🛍️ Customer:  customer@lastmile.com     / Customer@123');
    console.log('Sample Tracking Numbers for Testing:');
    console.log('  - LMD-2026-X81A1 (Created)');
    console.log('  - LMD-2026-B94K2 (In Transit)');
    console.log('  - LMD-2026-F33X7 (Failed - Test Rescheduling!)');
    console.log('  - LMD-2026-D19M4 (Delivered)');
    console.log('=========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
