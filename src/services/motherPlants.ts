import { supabase } from '../../supabase';
import type { MotherPlant } from '../types';
import { Result, ok, err } from './result';

export interface CreateMotherPlantInput {
  id: string;
  strainname: string;
  roomname: string;
  notes?: string | null;
}

export const motherPlantsService = {
  async list(): Promise<Result<MotherPlant[]>> {
    try {
      const { data, error } = await supabase
        .from('mother_plants')
        .select('id, strainname, roomname, status, acquiredat, notes, createdat, updatedat')
        .order('createdat', { ascending: false });
      if (error) throw error;
      return ok((data ?? []) as MotherPlant[]);
    } catch (e) {
      return err(e);
    }
  },

  async create(input: CreateMotherPlantInput): Promise<Result<void>> {
    try {
      const { error } = await supabase.from('mother_plants').insert(input);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return err(e);
    }
  },
};
