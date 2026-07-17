import { computeMotherStats } from './motherStats';

describe('computeMotherStats', () => {
  it('computes a mixed success/failure rate for a mother', () => {
    const rows = computeMotherStats([
      { motherid: 'MOM-SBC-AAA', stage: 'VEG', archivereason: null },
      { motherid: 'MOM-SBC-AAA', stage: 'ARCHIVED', archivereason: 'FAILED_CLONE' },
      { motherid: 'MOM-SBC-AAA', stage: 'CLONE', archivereason: null },
      { motherid: 'MOM-SBC-AAA', stage: 'CLONE', archivereason: null },
    ]);
    expect(rows).toEqual([
      { motherid: 'MOM-SBC-AAA', totalClones: 4, failedClones: 1, successRate: 0.75 },
    ]);
  });

  it('gives a success rate of 1 when a mother has no failures', () => {
    const rows = computeMotherStats([
      { motherid: 'MOM-MNT-BBB', stage: 'VEG', archivereason: null },
      { motherid: 'MOM-MNT-BBB', stage: 'FLOWER', archivereason: null },
    ]);
    expect(rows).toEqual([
      { motherid: 'MOM-MNT-BBB', totalClones: 2, failedClones: 0, successRate: 1 },
    ]);
  });

  it('gives a success rate of 0 when every clone from a mother failed', () => {
    const rows = computeMotherStats([
      { motherid: 'MOM-XYZ-CCC', stage: 'ARCHIVED', archivereason: 'FAILED_CLONE' },
      { motherid: 'MOM-XYZ-CCC', stage: 'ARCHIVED', archivereason: 'FAILED_CLONE' },
    ]);
    expect(rows).toEqual([
      { motherid: 'MOM-XYZ-CCC', totalClones: 2, failedClones: 2, successRate: 0 },
    ]);
  });

  it('excludes plants with no motherid from every group', () => {
    const rows = computeMotherStats([
      { motherid: null, stage: 'VEG', archivereason: null },
      { motherid: 'MOM-ABC-DDD', stage: 'VEG', archivereason: null },
    ]);
    expect(rows).toEqual([
      { motherid: 'MOM-ABC-DDD', totalClones: 1, failedClones: 0, successRate: 1 },
    ]);
  });
});
