import { supabase } from '../../supabase';
import type { Batch } from '../types';
import { Result, ok, err } from './result';

export const batchesService = {
  async listActive(): Promise<Result<Batch[]>> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('id, name, strainname')
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return ok((data ?? []) as Batch[]);
    } catch (e) {
      return err(e);
    }
  },

  async create(input: { id: string; name: string; strainname: string }): Promise<Result<void>> {
    try {
      const { error } = await supabase.from('batches').insert(input);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return err(e);
    }
  },
};
