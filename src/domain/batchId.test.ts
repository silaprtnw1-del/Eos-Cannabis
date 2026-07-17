import { generateBatchId } from './batchId';

describe('generateBatchId', () => {
  it('matches the original archive ground truth (2026-06-15 -> W25)', () => {
    expect(generateBatchId('SBC', new Date('2026-06-15T00:00:00Z'))).toBe('BATCH-2026-W25-SBC');
  });

  it('matches the original archive ground truth (2026-06-22 -> W26)', () => {
    expect(generateBatchId('MNT', new Date('2026-06-22T00:00:00Z'))).toBe('BATCH-2026-W26-MNT');
  });

  it('resolves the ISO year, not the calendar year, at a year boundary', () => {
    // Jan 1 2023 is a Sunday, so it falls in ISO week 52 of 2022.
    expect(generateBatchId('ABC', new Date('2023-01-01T00:00:00Z'))).toBe('BATCH-2022-W52-ABC');
  });

  it('handles a 53-ISO-week year', () => {
    // 2020 is a leap year starting on a Wednesday, giving it 53 ISO weeks;
    // Dec 31 2020 is a Thursday, so it falls in week 53 of 2020 itself.
    expect(generateBatchId('XYZ', new Date('2020-12-31T00:00:00Z'))).toBe('BATCH-2020-W53-XYZ');
  });

  it('uppercases a lowercase acronym', () => {
    expect(generateBatchId('sbc', new Date('2026-06-15T00:00:00Z'))).toBe('BATCH-2026-W25-SBC');
  });
});
