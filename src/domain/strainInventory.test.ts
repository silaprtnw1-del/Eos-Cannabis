import { groupPlantsByStrain } from './strainInventory';

describe('groupPlantsByStrain', () => {
  it('returns an empty array for no plants', () => {
    expect(groupPlantsByStrain([])).toEqual([]);
  });

  it('counts per-stage totals for a single strain, excluding harvested from liveTotal', () => {
    const result = groupPlantsByStrain([
      { strainname: 'Blue Dream', stage: 'CLONE' },
      { strainname: 'Blue Dream', stage: 'CLONE' },
      { strainname: 'Blue Dream', stage: 'VEG' },
      { strainname: 'Blue Dream', stage: 'FLOWER' },
      { strainname: 'Blue Dream', stage: 'HARVESTED' },
    ]);
    expect(result).toEqual([
      {
        strainname: 'Blue Dream',
        cloneCount: 2,
        vegCount: 1,
        flowerCount: 1,
        harvestedCount: 1,
        liveTotal: 4,
      },
    ]);
  });

  it('sorts multiple strains by liveTotal descending', () => {
    const result = groupPlantsByStrain([
      { strainname: 'OG Kush', stage: 'CLONE' },
      { strainname: 'Blue Dream', stage: 'CLONE' },
      { strainname: 'Blue Dream', stage: 'VEG' },
      { strainname: 'Blue Dream', stage: 'FLOWER' },
    ]);
    expect(result.map((r) => r.strainname)).toEqual(['Blue Dream', 'OG Kush']);
  });

  it('breaks ties alphabetically when liveTotal is equal', () => {
    const result = groupPlantsByStrain([
      { strainname: 'Zkittlez', stage: 'CLONE' },
      { strainname: 'Ayahuasca Purple', stage: 'CLONE' },
    ]);
    expect(result.map((r) => r.strainname)).toEqual(['Ayahuasca Purple', 'Zkittlez']);
  });

  it('keeps a strain with only harvested plants, sorted last with liveTotal 0', () => {
    const result = groupPlantsByStrain([
      { strainname: 'Active Strain', stage: 'CLONE' },
      { strainname: 'Fully Harvested', stage: 'HARVESTED' },
    ]);
    expect(result.map((r) => r.strainname)).toEqual(['Active Strain', 'Fully Harvested']);
    expect(result[1]).toEqual({
      strainname: 'Fully Harvested',
      cloneCount: 0,
      vegCount: 0,
      flowerCount: 0,
      harvestedCount: 1,
      liveTotal: 0,
    });
  });

  it('ignores archived plants defensively', () => {
    const result = groupPlantsByStrain([
      { strainname: 'Blue Dream', stage: 'CLONE' },
      { strainname: 'Blue Dream', stage: 'ARCHIVED' },
    ]);
    expect(result).toEqual([
      {
        strainname: 'Blue Dream',
        cloneCount: 1,
        vegCount: 0,
        flowerCount: 0,
        harvestedCount: 0,
        liveTotal: 1,
      },
    ]);
  });
});
