const RateEngineService = require('../src/services/RateEngineService');

describe('RateEngineService Core Calculations', () => {
  test('calculates volumetric weight correctly using (L*B*H)/5000', () => {
    // 50cm x 40cm x 30cm = 60,000 / 5000 = 12.0 kg
    const volWeight = RateEngineService.calculateVolumetricWeight(50, 40, 30);
    expect(volWeight).toBe(12.0);

    // Small package: 20cm x 15cm x 10cm = 3,000 / 5000 = 0.6 kg
    const smallVol = RateEngineService.calculateVolumetricWeight(20, 15, 10);
    expect(smallVol).toBe(0.6);
  });

  test('throws error on invalid dimensions', () => {
    expect(() => RateEngineService.calculateVolumetricWeight(0, 10, 10)).toThrow();
    expect(() => RateEngineService.calculateVolumetricWeight(-5, 10, 10)).toThrow();
  });

  test('determines chargeable weight as max(actual, volumetric)', () => {
    // Actual 2.5kg, Volumetric 4.0kg -> Chargeable = 4.0kg
    expect(RateEngineService.calculateChargeableWeight(2.5, 4.0)).toBe(4.0);

    // Actual 10.0kg, Volumetric 3.2kg -> Chargeable = 10.0kg
    expect(RateEngineService.calculateChargeableWeight(10.0, 3.2)).toBe(10.0);

    // Equal weights
    expect(RateEngineService.calculateChargeableWeight(5.0, 5.0)).toBe(5.0);
  });
});
