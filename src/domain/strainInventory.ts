import type { Plant } from '../types';

export interface StrainInventoryRow {
  strainname: string;
  cloneCount: number;
  vegCount: number;
  flowerCount: number;
  harvestedCount: number;
  liveTotal: number; // clone + veg + flower — excludes harvested by design
}

export function groupPlantsByStrain(
  plants: readonly Pick<Plant, 'strainname' | 'stage'>[]
): StrainInventoryRow[] {
  const map = new Map<string, StrainInventoryRow>();
  for (const p of plants) {
    const row = map.get(p.strainname) ?? {
      strainname: p.strainname,
      cloneCount: 0,
      vegCount: 0,
      flowerCount: 0,
      harvestedCount: 0,
      liveTotal: 0,
    };
    if (p.stage === 'CLONE') row.cloneCount++;
    else if (p.stage === 'VEG') row.vegCount++;
    else if (p.stage === 'FLOWER') row.flowerCount++;
    else if (p.stage === 'HARVESTED') row.harvestedCount++;
    row.liveTotal = row.cloneCount + row.vegCount + row.flowerCount;
    map.set(p.strainname, row);
  }
  return Array.from(map.values()).sort(
    (a, b) => b.liveTotal - a.liveTotal || a.strainname.localeCompare(b.strainname)
  );
}
