const Zone = require('../models/Zone');
const AreaMapping = require('../models/AreaMapping');
const RateCard = require('../models/RateCard');

class RateEngineService {
  /**
   * Calculate volumetric weight in kilograms
   * Formula: (Length * Breadth * Height in cm) / 5000
   * @param {number} lengthCm
   * @param {number} breadthCm
   * @param {number} heightCm
   * @returns {number} Volumetric weight in kg rounded to 2 decimal places
   */
  static calculateVolumetricWeight(lengthCm, breadthCm, heightCm) {
    if (!lengthCm || !breadthCm || !heightCm || lengthCm <= 0 || breadthCm <= 0 || heightCm <= 0) {
      throw new Error('Valid dimensions (L, B, H in cm > 0) are required for volumetric calculation.');
    }
    const volumeCc = lengthCm * breadthCm * heightCm;
    const volumetricWeight = volumeCc / 5000.0;
    return parseFloat(volumetricWeight.toFixed(2));
  }

  /**
   * Determine the chargeable weight (higher of actual vs volumetric)
   */
  static calculateChargeableWeight(actualWeightKg, volumetricWeightKg) {
    if (actualWeightKg == null || actualWeightKg <= 0) {
      throw new Error('Actual weight must be greater than 0 kg.');
    }
    const chargeable = Math.max(actualWeightKg, volumetricWeightKg);
    return parseFloat(chargeable.toFixed(2));
  }

  /**
   * Resolve zone from pincode or area name
   */
  static async resolveZone(pincode, areaName = '', city = '') {
    if (!pincode) {
      throw new Error('Pincode is required to resolve delivery zone.');
    }

    // Try exact pincode match first
    let mapping = await AreaMapping.findOne({ pincode: pincode.trim() }).populate('zone');
    
    // If not found and areaName provided, try case-insensitive regex match
    if (!mapping && areaName) {
      mapping = await AreaMapping.findOne({
        areaName: new RegExp(`^${areaName.trim()}$`, 'i')
      }).populate('zone');
    }

    if (!mapping || !mapping.zone) {
      // Fallback: Check if there is a default city zone
      const fallbackZone = await Zone.findOne({
        $or: [
          { city: new RegExp(city || 'Bhopal', 'i') },
          { isActive: true }
        ]
      });

      if (!fallbackZone) {
        throw new Error(`Serviceable zone not found for pincode ${pincode}. Please verify coverage.`);
      }

      return {
        zone: fallbackZone,
        mapping: null,
        isFallback: true
      };
    }

    return {
      zone: mapping.zone,
      mapping: mapping,
      isFallback: false
    };
  }

  /**
   * Calculate complete quote for a delivery order
   */
  static async calculateOrderQuote({
    pickupPincode,
    pickupArea = '',
    pickupCity = '',
    dropPincode,
    dropArea = '',
    dropCity = '',
    lengthCm,
    breadthCm,
    heightCm,
    actualWeightKg,
    orderType, // 'B2B' | 'B2C'
    paymentType // 'Prepaid' | 'COD'
  }) {
    if (!['B2B', 'B2C'].includes(orderType)) {
      throw new Error('Invalid orderType. Must be either B2B or B2C.');
    }
    if (!['Prepaid', 'COD'].includes(paymentType)) {
      throw new Error('Invalid paymentType. Must be either Prepaid or COD.');
    }

    // 1. Resolve Pickup and Drop Zones
    const [pickupResult, dropResult] = await Promise.all([
      this.resolveZone(pickupPincode, pickupArea, pickupCity),
      this.resolveZone(dropPincode, dropArea, dropCity)
    ]);

    const pickupZone = pickupResult.zone;
    const dropZone = dropResult.zone;

    // 2. Determine Zone Scope (Intra-zone vs Inter-zone)
    const isZoneIntra = pickupZone._id.toString() === dropZone._id.toString();
    const scope = isZoneIntra ? 'intra_zone' : 'inter_zone';

    // 3. Compute Volumetric and Chargeable Weight
    const volumetricWeightKg = this.calculateVolumetricWeight(lengthCm, breadthCm, heightCm);
    const chargeableWeightKg = this.calculateChargeableWeight(actualWeightKg, volumetricWeightKg);

    // 4. Fetch the admin-configured Rate Card
    const rateCard = await RateCard.findOne({
      orderType,
      scope,
      isActive: true
    });

    if (!rateCard) {
      throw new Error(
        `No active rate card configured for ${orderType} ${scope.replace('_', ' ').toUpperCase()}. Admin must configure pricing.`
      );
    }

    // 5. Compute Price Breakdown
    const baseWeightLimit = rateCard.baseWeightLimitKg;
    const basePrice = rateCard.basePrice;
    const incrementalPricePerKg = rateCard.incrementalPricePerKg;

    let extraWeightKg = 0;
    let extraWeightCharge = 0;

    if (chargeableWeightKg > baseWeightLimit) {
      extraWeightKg = parseFloat((chargeableWeightKg - baseWeightLimit).toFixed(2));
      // Billed in 1kg increments (rounded up) or proportional based on logistics standards
      const billableExtraUnits = Math.ceil(extraWeightKg);
      extraWeightCharge = parseFloat((billableExtraUnits * incrementalPricePerKg).toFixed(2));
    }

    // 6. Compute COD Surcharge if applicable
    let codSurcharge = 0;
    if (paymentType === 'COD') {
      if (rateCard.codSurchargeType === 'percentage') {
        const percentageFee = (basePrice + extraWeightCharge) * (rateCard.codSurchargeValue / 100.0);
        codSurcharge = Math.max(rateCard.minCodFee, percentageFee);
      } else {
        codSurcharge = Math.max(rateCard.minCodFee, rateCard.codSurchargeValue);
      }
      codSurcharge = parseFloat(codSurcharge.toFixed(2));
    }

    // 7. Subtotal, Taxes, Total
    const subtotal = parseFloat((basePrice + extraWeightCharge + codSurcharge).toFixed(2));
    const taxPercentage = rateCard.taxPercentage || 18;
    const taxAmount = parseFloat(((subtotal * taxPercentage) / 100.0).toFixed(2));
    const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

    return {
      pickupZone: {
        _id: pickupZone._id,
        name: pickupZone.name,
        code: pickupZone.code,
        city: pickupZone.city
      },
      dropZone: {
        _id: dropZone._id,
        name: dropZone.name,
        code: dropZone.code,
        city: dropZone.city
      },
      isZoneIntra,
      scope,
      packageMetrics: {
        dimensions: { lengthCm, breadthCm, heightCm },
        actualWeightKg,
        volumetricWeightKg,
        chargeableWeightKg,
        billedOn: chargeableWeightKg === volumetricWeightKg ? 'volumetric_weight' : 'actual_weight'
      },
      rateCardApplied: {
        _id: rateCard._id,
        name: rateCard.name,
        orderType: rateCard.orderType,
        scope: rateCard.scope,
        baseWeightLimitKg: rateCard.baseWeightLimitKg,
        basePrice: rateCard.basePrice,
        incrementalPricePerKg: rateCard.incrementalPricePerKg
      },
      pricing: {
        basePrice,
        extraWeightKg,
        incrementalPricePerKg,
        extraWeightCharge,
        codSurcharge,
        subtotal,
        taxPercentage,
        taxAmount,
        totalAmount,
        currency: 'INR'
      }
    };
  }
}

module.exports = RateEngineService;
