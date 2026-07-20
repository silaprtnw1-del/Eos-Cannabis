import { supabase } from '../../supabase';
import type { ClimateMetric, ClimatePoint } from '../types';
import { Result, ok, err } from './result';

export const environmentalLogsService = {
  /** Ordered readings for one room since `sinceIso`, for trend charts. */
  async listHistoryByRoom(roomname: string, sinceIso: string): Promise<Result<ClimatePoint[]>> {
    try {
      const { data, error } = await supabase
        .from('environmental_logs')
        .select('recordedat, tempc, humidityrh, vpd')
        .eq('roomname', roomname)
        .gte('recordedat', sinceIso)
        .order('recordedat', { ascending: true });
      if (error) throw error;
      return ok((data ?? []).map((r) => ({ ...r, vpd: r.vpd ?? 0 })));
    } catch (e) {
      return err(e);
    }
  },

  async listLatestByRoom(): Promise<Result<ClimateMetric[]>> {
    try {
      const { data, error } = await supabase
        .from('environmental_logs')
        .select('roomname, tempc, humidityrh, vpd')
        .order('recordedat', { ascending: false });
      if (error) throw error;

      const latestByRoom: Record<string, ClimateMetric> = {};
      (data ?? []).forEach((log) => {
        if (!latestByRoom[log.roomname]) {
          latestByRoom[log.roomname] = {
            roomname: log.roomname,
            tempc: log.tempc,
            humidityrh: log.humidityrh,
            vpd: log.vpd ?? 0,
          };
        }
      });
      return ok(Object.values(latestByRoom));
    } catch (e) {
      return err(e);
    }
  },
};
