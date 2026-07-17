import { calculateDosing } from './nutrientDosing';

describe('calculateDosing', () => {
  it('computes ml and ml/gal from factor and target ppm', () => {
    const result = calculateDosing(200, 1500, { core: true, grow: false, bloom: false, calmag: false }, '', '');
    // mlPerGal = factor * ppm / 1500 = 19 at ppm 1500
    expect(result.doses.core.mlPerGal).toBeCloseTo(19, 2);
    expect(result.doses.grow.ml).toBe(0);
  });

  it('flags calmag warning above 5 ml/gal', () => {
    // mlPerGal = FACTORS.calmag * ppm / 1500 — threshold ppm is ~131.6
    const noWarning = calculateDosing(200, 100, { calmag: true }, '', '');
    expect(noWarning.doses.calmag.mlPerGal).toBeLessThan(5.0);
    expect(noWarning.calMagWarning).toBe(false);

    const withWarning = calculateDosing(200, 200, { calmag: true }, '', '');
    expect(withWarning.doses.calmag.mlPerGal).toBeGreaterThan(5.0);
    expect(withWarning.calMagWarning).toBe(true);
  });

  it('flags runoff alert when phOut is outside 5.5-6.5', () => {
    expect(calculateDosing(200, 1500, {}, '5.0', '').runoffAlert).toBe(true);
    expect(calculateDosing(200, 1500, {}, '6.0', '').runoffAlert).toBe(false);
    expect(calculateDosing(200, 1500, {}, '7.0', '').runoffAlert).toBe(true);
  });

  it('flags runoff alert when ecOut drifts more than 1.0 above ecIn', () => {
    // currentEcIn = targetPpm / 500 = 3.0
    expect(calculateDosing(200, 1500, {}, '', '3.5').runoffAlert).toBe(false);
    expect(calculateDosing(200, 1500, {}, '', '4.5').runoffAlert).toBe(true);
  });
});
