import { supabase } from '../../supabase';
import { Result, ok, err } from './result';

export interface CreateActionLogInput {
  actiontype: string;
  operatorid: string;
  targettype: string;
  targetid: string;
  plantid?: string | null;
  details: Record<string, unknown>;
}

export const actionLogsService = {
  async create(input: CreateActionLogInput): Promise<Result<void>> {
    try {
      const { error } = await supabase.from('action_logs').insert(input);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return err(e);
    }
  },
};
