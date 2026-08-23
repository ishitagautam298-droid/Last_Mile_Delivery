const express = require('express');
const router = express.Router();
const RateCard = require('../models/RateCard');
const RateEngineService = require('../services/RateEngineService');
const { protect, authorize } = require('../middleware/auth');

// GET /api/rate-cards (List all rate cards)
router.get('/', async (req, res) => {
  try {
    const rateCards = await RateCard.find().sort({ orderType: 1, scope: 1 });
    res.json({ success: true, count: rateCards.length, rateCards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/rate-cards (Admin create rate card)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const rateCard = await RateCard.create(req.body);
    res.status(201).json({ success: true, rateCard });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/rate-cards/:id (Admin update rate card)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const rateCard = await RateCard.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!rateCard) return res.status(404).json({ success: false, message: 'Rate card not found' });
    res.json({ success: true, rateCard });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/rate-cards/:id (Admin delete rate card)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const rateCard = await RateCard.findByIdAndDelete(req.params.id);
    if (!rateCard) return res.status(404).json({ success: false, message: 'Rate card not found' });
    res.json({ success: true, message: 'Rate card deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/rate-cards/calculate-quote (Calculate quote preview with detailed formula breakdown)
router.post('/calculate-quote', async (req, res) => {
  try {
    const {
      pickupPincode,
      pickupArea,
      pickupCity,
      dropPincode,
      dropArea,
      dropCity,
      lengthCm,
      breadthCm,
      heightCm,
      actualWeightKg,
      orderType,
      paymentType
    } = req.body;

    const quote = await RateEngineService.calculateOrderQuote({
      pickupPincode,
      pickupArea,
      pickupCity,
      dropPincode,
      dropArea,
      dropCity,
      lengthCm: parseFloat(lengthCm),
      breadthCm: parseFloat(breadthCm),
      heightCm: parseFloat(heightCm),
      actualWeightKg: parseFloat(actualWeightKg),
      orderType,
      paymentType
    });

    res.json({
      success: true,
      quote
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
