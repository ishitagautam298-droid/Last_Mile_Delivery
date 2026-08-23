const AssignmentService = require('../src/services/AssignmentService');

describe('AssignmentService Logic', () => {
  test('calculates Haversine distance correctly in kilometers', () => {
    // Koramangala (12.9352, 77.6245) to Indiranagar (12.9784, 77.6408) is ~5.1 km
    const distance = AssignmentService.calculateDistanceKm(12.9352, 77.6245, 12.9784, 77.6408);
    expect(distance).toBeGreaterThan(4.0);
    expect(distance).toBeLessThan(7.0);

    // Distance to same point should be 0 km
    const zeroDist = AssignmentService.calculateDistanceKm(12.9716, 77.5946, 12.9716, 77.5946);
    expect(zeroDist).toBe(0);
  });
});
