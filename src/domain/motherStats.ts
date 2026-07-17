import type { Plant } from '../types';

export interface MotherStatsRow {
  motherid: string;
  totalClones: number;
  failedClones: number;
  successRate: number; // 0..1; 0 when totalClones === 0 (no divide-by-zero)
}

export function computeMotherStats(
  plants: readonly Pick<Plant, 'motherid' | 'stage' | 'archivereason'>[]
): MotherStatsRow[] {
  const map = new Map<string, MotherStatsRow>();
  for (const p of plants) {
    if (!p.motherid) continue;
    const row = map.get(p.motherid) ?? {
      motherid: p.motherid,
      totalClones: 0,
      failedClones: 0,
      successRate: 0,
    };
    row.totalClones++;
    if (p.stage === 'ARCHIVED' && p.archivereason === 'FAILED_CLONE') row.failedClones++;
    row.successRate = row.totalClones === 0 ? 0 : (row.totalClones - row.failedClones) / row.totalClones;
    map.set(p.motherid, row);
  }
  return Array.from(map.values()).sort((a, b) => a.motherid.localeCompare(b.motherid));
}
