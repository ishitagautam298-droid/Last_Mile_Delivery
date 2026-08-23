const express = require('express');
const router = express.Router();
const Zone = require('../models/Zone');
const AreaMapping = require('../models/AreaMapping');
const { protect, authorize } = require('../middleware/auth');

// GET /api/zones (Public/Protected: Get all active zones)
router.get('/', async (req, res) => {
  try {
    const zones = await Zone.find().sort({ name: 1 });
    res.json({ success: true, count: zones.length, zones });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/zones (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code, city, description, centerCoordinates } = req.body;
    const zone = await Zone.create({
      name,
      code: code.toUpperCase().trim(),
      city,
      description,
      centerCoordinates: centerCoordinates || { lat: 12.9716, lng: 77.5946 }
    });
    res.status(201).json({ success: true, zone });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/zones/:id (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    res.json({ success: true, zone });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/zones/:id (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    // Also remove area mappings linked to this zone
    await AreaMapping.deleteMany({ zone: req.params.id });
    res.json({ success: true, message: 'Zone and associated area mappings deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- AREA MAPPINGS ---

// GET /api/zones/areas/all (Get all mapped areas)
router.get('/areas/all', async (req, res) => {
  try {
    const areas = await AreaMapping.find().populate('zone').sort({ city: 1, areaName: 1 });
    res.json({ success: true, count: areas.length, areas });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/zones/areas/lookup?pincode=560001&area=Indiranagar
router.get('/areas/lookup', async (req, res) => {
  try {
    const { pincode, area } = req.query;
    let query = {};
    if (pincode) query.pincode = pincode.trim();
    if (area) query.areaName = new RegExp(area.trim(), 'i');

    const mapping = await AreaMapping.findOne(query).populate('zone');
    if (!mapping) {
      return res.status(404).json({ success: false, message: 'No zone mapping found for this pincode/area' });
    }

    res.json({ success: true, mapping });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/zones/areas (Admin: Map Pincode/Area to Zone)
router.post('/areas', protect, authorize('admin'), async (req, res) => {
  try {
    const { pincode, areaName, city, state, zoneId, approxCoordinates } = req.body;
    const zone = await Zone.findById(zoneId);
    if (!zone) return res.status(404).json({ success: false, message: 'Target zone not found' });

    const mapping = await AreaMapping.create({
      pincode: pincode.trim(),
      areaName: areaName.trim(),
      city: city || zone.city,
      state: state || 'Karnataka',
      zone: zoneId,
      approxCoordinates: approxCoordinates || zone.centerCoordinates
    });

    const populatedMapping = await AreaMapping.findById(mapping._id).populate('zone');
    res.status(201).json({ success: true, mapping: populatedMapping });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/zones/areas/:id (Admin only)
router.delete('/areas/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const mapping = await AreaMapping.findByIdAndDelete(req.params.id);
    if (!mapping) return res.status(404).json({ success: false, message: 'Area mapping not found' });
    res.json({ success: true, message: 'Area mapping deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
