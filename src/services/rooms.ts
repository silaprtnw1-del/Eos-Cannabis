import { supabase } from '../../supabase';
import type { Room } from '../types';
import { Result, ok, err } from './result';

export const roomsService = {
  async listActive(): Promise<Result<Room[]>> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, type')
        .eq('is_active', true);
      if (error) throw error;
      return ok((data ?? []) as Room[]);
    } catch (e) {
      return err(e);
    }
  },

  async create(input: { name: string; type: Room['type'] }): Promise<Result<void>> {
    try {
      const { error } = await supabase.from('rooms').insert(input);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return err(e);
    }
  },

  async softDelete(roomId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: false })
        .eq('id', roomId);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return err(e);
    }
  },
};
