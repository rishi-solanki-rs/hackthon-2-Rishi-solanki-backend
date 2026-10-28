import { describe, it, expect } from 'vitest';
import { calculateResidualValue, evaluateLaptopRepair } from '../engines/repairEngine';

describe('repairEngine — Laptop Repair Economics & 50% Rule', () => {
  it('calculates residual value with annual diminishing depreciation', () => {
    // 50,000 original price after 2 years at 25% annual depreciation
    // 50000 * 0.75 * 0.75 = 28,125
    const val2yr = calculateResidualValue(50000, 2);
    expect(val2yr).toBe(28125);

    // Old laptop hits minimum floor
    const val10yr = calculateResidualValue(30000, 10);
    expect(val10yr).toBe(3000);
  });

  it('recommends replacement if repair cost exceeds 50% of residual value', () => {
    // 6-year-old laptop with liquid damage
    const result = evaluateLaptopRepair({
      brand: 'Dell',
      model: 'Inspiron 15',
      originalPrice: 40000,
      ageYears: 6,
      issue: 'Spilled water on keyboard, motherboard dead',
    });

    expect(result.recommendation).toBe('replace');
    expect(result.suggestedAlternativeListingId).toBe('lst_laptop_used');
  });

  it('recommends repair if cost is comfortably below 50% value', () => {
    // 2-year-old laptop needing SSD upgrade or minor fix
    const result = evaluateLaptopRepair({
      brand: 'HP',
      model: 'Pavilion 14',
      originalPrice: 65000,
      ageYears: 2,
      issue: 'Slow boot times, mechanical HDD needs upgrade',
    });

    expect(result.recommendation).toBe('repair');
    expect(result.repairRatioPercent).toBeLessThan(50);
  });
});
