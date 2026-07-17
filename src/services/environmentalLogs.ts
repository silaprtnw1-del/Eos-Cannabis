import { supabase } from '../../supabase';
import type { ClimateMetric } from '../types';
import { Result, ok, err } from './result';

export const environmentalLogsService = {
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
