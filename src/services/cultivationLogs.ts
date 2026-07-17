import { supabase } from '../../supabase';
import type { CultivationLog } from '../types';
import { Result, ok, err } from './result';

export interface CreateCultivationLogInput {
  batchid: string | null;
  roomname: string;
  watervolume: number;
  waterunit?: string;
  phin: number;
  ecin: number;
  runoffvolume?: number | null;
  phout?: number | null;
  ecout?: number | null;
  nutrientsfeed: Record<string, unknown>;
  operatorid: string;
  notes?: string | null;
}

export const cultivationLogsService = {
  async listRecent(limit = 15): Promise<Result<CultivationLog[]>> {
    try {
      const { data, error } = await supabase
        .from('cultivation_logs')
        .select('id, logdate, roomname, watervolume, phin, ecin, phout, ecout')
        .order('logdate', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ok((data ?? []) as CultivationLog[]);
    } catch (e) {
      return err(e);
    }
  },

  async create(input: CreateCultivationLogInput): Promise<Result<void>> {
    try {
      const { error } = await supabase.from('cultivation_logs').insert(input);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return err(e);
    }
  },
};
