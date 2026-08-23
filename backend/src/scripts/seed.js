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
    console.log('🌱 Connected to MongoDB for seeding Bhopal logistics network...');

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

    // 1. Seed Zones for Bhopal
    const zones = await Zone.insertMany([
      {
        name: 'Central Bhopal Hub',
        code: 'CB-01',
        city: 'Bhopal',
        description: 'MP Nagar, Arera Colony, New Market, TT Nagar & Shahpura',
        centerCoordinates: { lat: 23.2332, lng: 77.4344 },
        isActive: true
      },
      {
        name: 'South Bhopal (Kolar & Hoshangabad Rd)',
        code: 'SB-01',
        city: 'Bhopal',
        description: 'Kolar Road, Hoshangabad Road, Bagsewaniya, Misrod & Katara Hills',
        centerCoordinates: { lat: 23.1750, lng: 77.4350 },
        isActive: true
      },
      {
        name: 'East Bhopal (Industrial & BHEL)',
        code: 'EB-01',
        city: 'Bhopal',
        description: 'BHEL Township, Govindpura, Ayodhya Bypass, Piplani & Anand Nagar',
        centerCoordinates: { lat: 23.2500, lng: 77.4700 },
        isActive: true
      },
      {
        name: 'North Bhopal (Old City & Airport)',
        code: 'NB-01',
        city: 'Bhopal',
        description: 'Bhopal Junction, Karond Mandi, Lalghati, VIP Road & Airport',
        centerCoordinates: { lat: 23.2850, lng: 77.3800 },
        isActive: true
      },
      {
        name: 'West Bhopal (Lakeside & Institutional)',
        code: 'WB-01',
        city: 'Bhopal',
        description: 'Bairagarh (Sant Hirdaram Nagar), Neelbad, Ratibad & Shyamala Hills',
        centerCoordinates: { lat: 23.2200, lng: 77.3400 },
        isActive: true
      }
    ]);

    console.log(`✅ Seeded ${zones.length} Bhopal Zones.`);

    const cbZone = zones[0];
    const sbZone = zones[1];
    const ebZone = zones[2];
    const nbZone = zones[3];
    const wbZone = zones[4];

    // 2. Seed Area Mappings for Bhopal
    const areaMappings = await AreaMapping.insertMany([
      // Central Bhopal Zone
      { pincode: '462011', areaName: 'MP Nagar Zone 1 & 2', city: 'Bhopal', state: 'Madhya Pradesh', zone: cbZone._id, approxCoordinates: { lat: 23.2332, lng: 77.4344 } },
      { pincode: '462016', areaName: 'Arera Colony (E1-E7)', city: 'Bhopal', state: 'Madhya Pradesh', zone: cbZone._id, approxCoordinates: { lat: 23.2156, lng: 77.4320 } },
      { pincode: '462003', areaName: 'New Market & TT Nagar', city: 'Bhopal', state: 'Madhya Pradesh', zone: cbZone._id, approxCoordinates: { lat: 23.2376, lng: 77.3995 } },
      { pincode: '462039', areaName: 'Shahpura Lake Area', city: 'Bhopal', state: 'Madhya Pradesh', zone: cbZone._id, approxCoordinates: { lat: 23.1950, lng: 77.4250 } },
      { pincode: '462016', areaName: 'Bittan Market & 10 No.', city: 'Bhopal', state: 'Madhya Pradesh', zone: cbZone._id, approxCoordinates: { lat: 23.2180, lng: 77.4280 } },

      // South Bhopal Zone
      { pincode: '462042', areaName: 'Kolar Road & Sarvdharm', city: 'Bhopal', state: 'Madhya Pradesh', zone: sbZone._id, approxCoordinates: { lat: 23.1724, lng: 77.4180 } },
      { pincode: '462026', areaName: 'Hoshangabad Road & Misrod', city: 'Bhopal', state: 'Madhya Pradesh', zone: sbZone._id, approxCoordinates: { lat: 23.1700, lng: 77.4600 } },
      { pincode: '462043', areaName: 'Bagsewaniya & Katara Hills', city: 'Bhopal', state: 'Madhya Pradesh', zone: sbZone._id, approxCoordinates: { lat: 23.1900, lng: 77.4500 } },
      { pincode: '462026', areaName: 'Bawadiya Kalan & Gulmohar', city: 'Bhopal', state: 'Madhya Pradesh', zone: sbZone._id, approxCoordinates: { lat: 23.1880, lng: 77.4390 } },

      // East Bhopal Zone
      { pincode: '462023', areaName: 'Govindpura Industrial Area', city: 'Bhopal', state: 'Madhya Pradesh', zone: ebZone._id, approxCoordinates: { lat: 23.2600, lng: 77.4600 } },
      { pincode: '462022', areaName: 'BHEL Township & Piplani', city: 'Bhopal', state: 'Madhya Pradesh', zone: ebZone._id, approxCoordinates: { lat: 23.2500, lng: 77.4800 } },
      { pincode: '462021', areaName: 'Ayodhya Bypass & Anand Nagar', city: 'Bhopal', state: 'Madhya Pradesh', zone: ebZone._id, approxCoordinates: { lat: 23.2750, lng: 77.4700 } },
      { pincode: '462024', areaName: 'Habibganj / Rani Kamlapati Station', city: 'Bhopal', state: 'Madhya Pradesh', zone: ebZone._id, approxCoordinates: { lat: 23.2180, lng: 77.4390 } },

      // North Bhopal Zone
      { pincode: '462001', areaName: 'Bhopal Junction & Old City', city: 'Bhopal', state: 'Madhya Pradesh', zone: nbZone._id, approxCoordinates: { lat: 23.2670, lng: 77.4120 } },
      { pincode: '462038', areaName: 'Karond Mandi & Berasia Rd', city: 'Bhopal', state: 'Madhya Pradesh', zone: nbZone._id, approxCoordinates: { lat: 23.3100, lng: 77.3800 } },
      { pincode: '462030', areaName: 'Lalghati & VIP Road', city: 'Bhopal', state: 'Madhya Pradesh', zone: nbZone._id, approxCoordinates: { lat: 23.2800, lng: 77.3700 } },
      { pincode: '462036', areaName: 'Raja Bhoj Airport & Gandhi Nagar', city: 'Bhopal', state: 'Madhya Pradesh', zone: nbZone._id, approxCoordinates: { lat: 23.2875, lng: 77.3378 } },

      // West Bhopal Zone
      { pincode: '462030', areaName: 'Bairagarh (Sant Hirdaram Nagar)', city: 'Bhopal', state: 'Madhya Pradesh', zone: wbZone._id, approxCoordinates: { lat: 23.2700, lng: 77.3300 } },
      { pincode: '462044', areaName: 'Neelbad & Ratibad Institutions', city: 'Bhopal', state: 'Madhya Pradesh', zone: wbZone._id, approxCoordinates: { lat: 23.1600, lng: 77.3300 } },
      { pincode: '462002', areaName: 'Shyamala Hills & Upper Lake View', city: 'Bhopal', state: 'Madhya Pradesh', zone: wbZone._id, approxCoordinates: { lat: 23.2380, lng: 77.3800 } }
    ]);

    console.log(`✅ Seeded ${areaMappings.length} Bhopal Area Mappings.`);

    // 3. Seed Rate Cards (Configurable, No hardcoding)
    const rateCards = await RateCard.insertMany([
      {
        name: 'B2C Standard Intra-Zone Rate',
        orderType: 'B2C',
        scope: 'intra_zone',
        baseWeightLimitKg: 0.5,
        basePrice: 40.0,
        incrementalPricePerKg: 18.0,
        codSurchargeType: 'fixed',
        codSurchargeValue: 20.0,
        minCodFee: 15.0,
        taxPercentage: 18.0,
        isActive: true,
        description: 'Standard consumer delivery within the same Bhopal municipal zone.'
      },
      {
        name: 'B2C Express Inter-Zone Rate',
        orderType: 'B2C',
        scope: 'inter_zone',
        baseWeightLimitKg: 0.5,
        basePrice: 75.0,
        incrementalPricePerKg: 28.0,
        codSurchargeType: 'fixed',
        codSurchargeValue: 30.0,
        minCodFee: 20.0,
        taxPercentage: 18.0,
        isActive: true,
        description: 'Cross-zone consumer delivery across Bhopal city zones.'
      },
      {
        name: 'B2B Freight Intra-Zone Rate',
        orderType: 'B2B',
        scope: 'intra_zone',
        baseWeightLimitKg: 5.0,
        basePrice: 160.0,
        incrementalPricePerKg: 14.0,
        codSurchargeType: 'percentage',
        codSurchargeValue: 2.0,
        minCodFee: 40.0,
        taxPercentage: 18.0,
        isActive: true,
        description: 'Commercial B2B shipment with 5kg base slab within same Bhopal zone.'
      },
      {
        name: 'B2B Enterprise Inter-Zone Rate',
        orderType: 'B2B',
        scope: 'inter_zone',
        baseWeightLimitKg: 5.0,
        basePrice: 320.0,
        incrementalPricePerKg: 22.0,
        codSurchargeType: 'percentage',
        codSurchargeValue: 2.5,
        minCodFee: 60.0,
        taxPercentage: 18.0,
        isActive: true,
        description: 'High-volume commercial logistics between cross-Bhopal zones (e.g. Govindpura to Kolar).'
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
        name: 'Bhopal Logistics Operations Admin',
        email: 'admin@lastmile.com',
        password: adminPassword,
        role: 'admin',
        phone: '+91 98111 22233'
      },
      // Delivery Agents stationed at Bhopal Hubs
      {
        name: 'Rahul Sharma',
        email: 'rahul.agent@lastmile.com',
        password: agentPassword,
        role: 'agent',
        phone: '+91 98765 43211',
        agentDetails: {
          assignedZone: sbZone._id,
          status: 'available',
          vehicleType: 'bike',
          maxActiveDeliveries: 5,
          activeDeliveriesCount: 0,
          currentLocation: { lat: 23.1750, lng: 77.4350, address: 'Kolar Road Sarvdharm Hub', updatedAt: new Date() }
        }
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.agent@lastmile.com',
        password: agentPassword,
        role: 'agent',
        phone: '+91 98765 43212',
        agentDetails: {
          assignedZone: ebZone._id,
          status: 'available',
          vehicleType: 'van',
          maxActiveDeliveries: 8,
          activeDeliveriesCount: 0,
          currentLocation: { lat: 23.2500, lng: 77.4700, address: 'Govindpura BHEL Hub', updatedAt: new Date() }
        }
      },
      {
        name: 'Priya Patel',
        email: 'priya.agent@lastmile.com',
        password: agentPassword,
        role: 'agent',
        phone: '+91 98765 43213',
        agentDetails: {
          assignedZone: nbZone._id,
          status: 'available',
          vehicleType: 'scooter',
          maxActiveDeliveries: 4,
          activeDeliveriesCount: 0,
          currentLocation: { lat: 23.2850, lng: 77.3800, address: 'Lalghati VIP Road Hub', updatedAt: new Date() }
        }
      },
      {
        name: 'Arjun Das',
        email: 'arjun.agent@lastmile.com',
        password: agentPassword,
        role: 'agent',
        phone: '+91 98765 43214',
        agentDetails: {
          assignedZone: cbZone._id,
          status: 'available',
          vehicleType: 'bike',
          maxActiveDeliveries: 5,
          activeDeliveriesCount: 0,
          currentLocation: { lat: 23.2332, lng: 77.4344, address: 'MP Nagar Central Hub', updatedAt: new Date() }
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
        name: 'Bhopal Pharma & Tech B2B',
        email: 'supply@bhopalpharma.in',
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

    // 5. Seed Sample Bhopal Orders with Immutable Timeline History
    // Sample Order 1: Created (Pending Auto-Dispatch) in Bhopal Central Zone
    const order1 = await Order.create({
      trackingNumber: 'LMD-2026-X81A1',
      customer: customerAravind._id,
      customerName: customerAravind.name,
      customerEmail: customerAravind.email,
      customerPhone: customerAravind.phone,
      pickupAddress: {
        street: 'E-4, Arera Colony Main Rd',
        area: 'Arera Colony (E1-E7)',
        city: 'Bhopal',
        pincode: '462016',
        state: 'Madhya Pradesh',
        coordinates: { lat: 23.2156, lng: 77.4320 }
      },
      pickupZone: cbZone._id,
      dropAddress: {
        street: 'C-Sector, Sarvdharm Colony',
        area: 'Kolar Road & Sarvdharm',
        city: 'Bhopal',
        pincode: '462042',
        state: 'Madhya Pradesh',
        coordinates: { lat: 23.1724, lng: 77.4180 }
      },
      dropZone: sbZone._id,
      isZoneIntra: false,
      packageDetails: {
        lengthCm: 25,
        breadthCm: 20,
        heightCm: 15,
        actualWeightKg: 1.2,
        volumetricWeightKg: 1.5, // (25*20*15)/5000 = 1.5kg
        chargeableWeightKg: 1.5, // max(1.2, 1.5) = 1.5kg
        description: 'Electronics & Stationery Box',
        declaredValue: 2500
      },
      orderType: 'B2C',
      paymentType: 'Prepaid',
      pricing: {
        rateCardApplied: rateCards[1]._id,
        rateCardName: rateCards[1].name,
        baseWeightLimitKg: 0.5,
        basePrice: 75.0,
        extraWeightKg: 1.0,
        incrementalPricePerKg: 28.0,
        extraWeightCharge: 28.0,
        codSurcharge: 0,
        subtotal: 103.0,
        taxPercentage: 18.0,
        taxAmount: 18.54,
        totalAmount: 121.54,
        currency: 'INR'
      },
      status: 'Created',
      liveLocation: { lat: 23.2156, lng: 77.4320, lastUpdated: new Date() }
    });

    await TrackingAuditLog.create({
      order: order1._id,
      trackingNumber: order1.trackingNumber,
      previousStatus: null,
      newStatus: 'Created',
      actor: { role: 'customer', userId: customerAravind._id, name: customerAravind.name },
      notes: 'Order placed by customer in Bhopal. Chargeable weight: 1.5kg (volumetric). Total: ₹121.54',
      location: { lat: 23.2156, lng: 77.4320, description: 'Pickup: Arera Colony, Bhopal' }
    });

    // Sample Order 2: In Transit (Assigned to Agent Vikram Singh - East Zone to North Zone)
    const order2 = await Order.create({
      trackingNumber: 'LMD-2026-B94K2',
      customer: customerAnanya._id,
      customerName: customerAnanya.name,
      customerEmail: customerAnanya.email,
      customerPhone: customerAnanya.phone,
      pickupAddress: {
        street: 'Sector A, Industrial Complex',
        area: 'Govindpura Industrial Area',
        city: 'Bhopal',
        pincode: '462023',
        state: 'Madhya Pradesh',
        coordinates: { lat: 23.2600, lng: 77.4600 }
      },
      pickupZone: ebZone._id,
      dropAddress: {
        street: 'Plot 45, Ayodhya Bypass Road',
        area: 'Ayodhya Bypass & Anand Nagar',
        city: 'Bhopal',
        pincode: '462021',
        state: 'Madhya Pradesh',
        coordinates: { lat: 23.2750, lng: 77.4700 }
      },
      dropZone: ebZone._id,
      isZoneIntra: true,
      packageDetails: {
        lengthCm: 40,
        breadthCm: 30,
        heightCm: 25,
        actualWeightKg: 4.5,
        volumetricWeightKg: 6.0, // (40*30*25)/5000 = 6.0kg
        chargeableWeightKg: 6.0,
        description: 'Bhopal Industrial Supplies & Hardware',
        declaredValue: 8500
      },
      orderType: 'B2B',
      paymentType: 'COD',
      pricing: {
        rateCardApplied: rateCards[2]._id,
        rateCardName: rateCards[2].name,
        baseWeightLimitKg: 5.0,
        basePrice: 160.0,
        extraWeightKg: 1.0,
        incrementalPricePerKg: 14.0,
        extraWeightCharge: 14.0,
        codSurcharge: 40.0,
        subtotal: 214.0,
        taxPercentage: 18.0,
        taxAmount: 38.52,
        totalAmount: 252.52,
        currency: 'INR'
      },
      status: 'In Transit',
      assignedAgent: agentVikram._id,
      assignedAt: new Date(Date.now() - 3600000 * 3),
      liveLocation: { lat: 23.2680, lng: 77.4650, lastUpdated: new Date() }
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
        notes: 'Order initiated for Govindpura to Ayodhya Bypass delivery.'
      },
      {
        order: order2._id,
        trackingNumber: order2.trackingNumber,
        previousStatus: 'Created',
        newStatus: 'Assigned',
        actor: { role: 'system', name: 'Auto-Assignment Dispatcher' },
        timestamp: new Date(Date.now() - 3600000 * 4),
        notes: `Auto-assigned to delivery agent Vikram Singh (Van). Distance: 2.1 km.`
      },
      {
        order: order2._id,
        trackingNumber: order2.trackingNumber,
        previousStatus: 'Assigned',
        newStatus: 'Picked Up',
        actor: { role: 'agent', userId: agentVikram._id, name: agentVikram.name },
        timestamp: new Date(Date.now() - 3600000 * 2),
        notes: 'Package collected from Govindpura Industrial Hub.'
      },
      {
        order: order2._id,
        trackingNumber: order2.trackingNumber,
        previousStatus: 'Picked Up',
        newStatus: 'In Transit',
        actor: { role: 'agent', userId: agentVikram._id, name: agentVikram.name },
        timestamp: new Date(Date.now() - 3600000 * 1),
        notes: 'Package in transit along Raisen Road towards Ayodhya Bypass.'
      }
    ]);

    // Sample Order 3: Failed Delivery (Demonstrating Rescheduling Flow in Bhopal)
    const order3 = await Order.create({
      trackingNumber: 'LMD-2026-F33X7',
      customer: customerAravind._id,
      customerName: customerAravind.name,
      customerEmail: customerAravind.email,
      customerPhone: customerAravind.phone,
      pickupAddress: {
        street: 'Zone 1, Press Complex',
        area: 'MP Nagar Zone 1 & 2',
        city: 'Bhopal',
        pincode: '462011',
        state: 'Madhya Pradesh',
        coordinates: { lat: 23.2332, lng: 77.4344 }
      },
      pickupZone: cbZone._id,
      dropAddress: {
        street: 'House 18, VIP Road Enclave',
        area: 'Lalghati & VIP Road',
        city: 'Bhopal',
        pincode: '462030',
        state: 'Madhya Pradesh',
        coordinates: { lat: 23.2800, lng: 77.3700 }
      },
      dropZone: nbZone._id,
      isZoneIntra: false,
      packageDetails: {
        lengthCm: 20,
        breadthCm: 15,
        heightCm: 10,
        actualWeightKg: 0.8,
        volumetricWeightKg: 0.6,
        chargeableWeightKg: 0.8,
        description: 'Bhopal Handloom & Apparel',
        declaredValue: 3400
      },
      orderType: 'B2C',
      paymentType: 'COD',
      pricing: {
        rateCardApplied: rateCards[1]._id,
        rateCardName: rateCards[1].name,
        baseWeightLimitKg: 0.5,
        basePrice: 75.0,
        extraWeightKg: 0.3,
        incrementalPricePerKg: 28.0,
        extraWeightCharge: 28.0,
        codSurcharge: 30.0,
        subtotal: 133.0,
        taxPercentage: 18.0,
        taxAmount: 23.94,
        totalAmount: 156.94,
        currency: 'INR'
      },
      status: 'Failed',
      assignedAgent: agentPriya._id,
      failedDetails: {
        failedAt: new Date(Date.now() - 1800000),
        reason: 'Customer Unavailable / Door Locked',
        notes: 'Doorbell rang 3 times, customer phone was not reachable at Lalghati address.',
        attemptCount: 1
      },
      liveLocation: { lat: 23.2800, lng: 77.3700, lastUpdated: new Date() }
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
        notes: 'Auto-assigned to Priya Patel.'
      },
      {
        order: order3._id,
        trackingNumber: order3.trackingNumber,
        previousStatus: 'Assigned',
        newStatus: 'Out for Delivery',
        actor: { role: 'agent', userId: agentPriya._id, name: agentPriya.name },
        timestamp: new Date(Date.now() - 3600000 * 2),
        notes: 'Out for delivery to customer address in Lalghati, Bhopal.'
      },
      {
        order: order3._id,
        trackingNumber: order3.trackingNumber,
        previousStatus: 'Out for Delivery',
        newStatus: 'Failed',
        actor: { role: 'agent', userId: agentPriya._id, name: agentPriya.name },
        timestamp: new Date(Date.now() - 1800000),
        reason: 'Customer Unavailable / Door Locked',
        notes: 'Customer did not answer doorbell/phone. Triggered automated notification for customer rescheduling.'
      }
    ]);

    // Sample Order 4: Delivered in Bhopal
    const order4 = await Order.create({
      trackingNumber: 'LMD-2026-D19M4',
      customer: customerAravind._id,
      customerName: customerAravind.name,
      customerEmail: customerAravind.email,
      customerPhone: customerAravind.phone,
      pickupAddress: {
        street: "Shop 12, Top 'n Town Corner",
        area: 'New Market & TT Nagar',
        city: 'Bhopal',
        pincode: '462003',
        state: 'Madhya Pradesh',
        coordinates: { lat: 23.2376, lng: 77.3995 }
      },
      pickupZone: cbZone._id,
      dropAddress: {
        street: 'Sector B, Lake Promenade',
        area: 'Shahpura Lake Area',
        city: 'Bhopal',
        pincode: '462039',
        state: 'Madhya Pradesh',
        coordinates: { lat: 23.1950, lng: 77.4250 }
      },
      dropZone: cbZone._id,
      isZoneIntra: true,
      packageDetails: {
        lengthCm: 15,
        breadthCm: 10,
        heightCm: 5,
        actualWeightKg: 0.4,
        volumetricWeightKg: 0.15,
        chargeableWeightKg: 0.4,
        description: 'Smartwatch & Electronics Accessory',
        declaredValue: 4999
      },
      orderType: 'B2C',
      paymentType: 'Prepaid',
      pricing: {
        rateCardApplied: rateCards[0]._id,
        rateCardName: rateCards[0].name,
        baseWeightLimitKg: 0.5,
        basePrice: 40.0,
        extraWeightKg: 0,
        incrementalPricePerKg: 18.0,
        extraWeightCharge: 0,
        codSurcharge: 0,
        subtotal: 40.0,
        taxPercentage: 18.0,
        taxAmount: 7.2,
        totalAmount: 47.2,
        currency: 'INR'
      },
      status: 'Delivered',
      assignedAgent: agentRahul._id,
      deliveredAt: new Date(Date.now() - 3600000),
      liveLocation: { lat: 23.1950, lng: 77.4250, lastUpdated: new Date() }
    });

    await TrackingAuditLog.insertMany([
      {
        order: order4._id,
        trackingNumber: order4.trackingNumber,
        previousStatus: null,
        newStatus: 'Created',
        actor: { role: 'customer', userId: customerAravind._id, name: customerAravind.name },
        timestamp: new Date(Date.now() - 3600000 * 8),
        notes: 'Order placed for New Market to Shahpura delivery.'
      },
      {
        order: order4._id,
        trackingNumber: order4.trackingNumber,
        previousStatus: 'Created',
        newStatus: 'Assigned',
        actor: { role: 'system', name: 'Auto-Assignment Dispatcher' },
        timestamp: new Date(Date.now() - 3600000 * 7),
        notes: 'Auto-assigned to Rahul Sharma.'
      },
      {
        order: order4._id,
        trackingNumber: order4.trackingNumber,
        previousStatus: 'Assigned',
        newStatus: 'Picked Up',
        actor: { role: 'agent', userId: agentRahul._id, name: agentRahul.name },
        timestamp: new Date(Date.now() - 3600000 * 5),
        notes: 'Picked up from merchant in New Market.'
      },
      {
        order: order4._id,
        trackingNumber: order4.trackingNumber,
        previousStatus: 'Picked Up',
        newStatus: 'Out for Delivery',
        actor: { role: 'agent', userId: agentRahul._id, name: agentRahul.name },
        timestamp: new Date(Date.now() - 3600000 * 3),
        notes: 'Out for delivery to Shahpura Lake address.'
      },
      {
        order: order4._id,
        trackingNumber: order4.trackingNumber,
        previousStatus: 'Out for Delivery',
        newStatus: 'Delivered',
        actor: { role: 'agent', userId: agentRahul._id, name: agentRahul.name },
        timestamp: new Date(Date.now() - 3600000),
        notes: 'Successfully handed over to customer.'
      }
    ]);

    console.log('✅ Seeded 4 Complete Orders with Audit Timelines in Bhopal.');
    console.log('\n=========================================');
    console.log('🎉 BHOPAL LOGISTICS NETWORK SEEDED SUCCESSFULLY!');
    console.log('Demo Credentials:');
    console.log('  👑 Admin:     admin@lastmile.com        / Admin@123');
    console.log('  🛵 Agent 1:   rahul.agent@lastmile.com   / Agent@123 (Kolar Road Hub)');
    console.log('  🛵 Agent 2:   vikram.agent@lastmile.com  / Agent@123 (Govindpura Hub)');
    console.log('  🛍️ Customer:  customer@lastmile.com     / Customer@123');
    console.log('Sample Bhopal Tracking Numbers:');
    console.log('  - LMD-2026-X81A1 (Arera Colony -> Kolar Road | Created)');
    console.log('  - LMD-2026-B94K2 (Govindpura -> Ayodhya Bypass | In Transit)');
    console.log('  - LMD-2026-F33X7 (MP Nagar -> Lalghati | Failed - Test Reschedule!)');
    console.log('  - LMD-2026-D19M4 (New Market -> Shahpura | Delivered)');
    console.log('=========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
