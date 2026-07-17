import { supabase } from '../../supabase';
import type { Plant } from '../types';
import { Result, ok, err } from './result';

export interface RegisterClonesInput {
  strainname: string;
  strainAcronym: string;
  roomname: string;
  batchid: string | null;
  stage: Plant['stage'];
  count: number;
}

export interface TransferPlantInput {
  roomname: string;
  stage: Plant['stage'];
}

// 6 hex chars = 16M possibilities per acronym — avoids Math.random()'s
// 4-char (65k) collision range at scale.
function generatePlantId(acronym: string): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join('');
  return `APN-${acronym.toUpperCase()}-${hex}`;
}

export const plantsService = {
  async listActive(): Promise<Result<Plant[]>> {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('id, strainname, stage, roomname, plantedat, batchid')
        .neq('stage', 'ARCHIVED')
        .order('plantedat', { ascending: false });
      if (error) throw error;
      return ok((data ?? []) as Plant[]);
    } catch (e) {
      return err(e);
    }
  },

  async listStages(): Promise<Result<Array<Plant['stage']>>> {
    try {
      const { data, error } = await supabase.from('plants').select('stage');
      if (error) throw error;
      return ok((data ?? []).map((p) => p.stage as Plant['stage']));
    } catch (e) {
      return err(e);
    }
  },

  async registerClones(input: RegisterClonesInput): Promise<Result<string[]>> {
    try {
      const generatedIds = Array.from({ length: input.count }, () =>
        generatePlantId(input.strainAcronym)
      );
      const payload = generatedIds.map((id) => ({
        id,
        strainname: input.strainname,
        stage: input.stage,
        roomname: input.roomname,
        batchid: input.batchid,
        plantedat: new Date().toISOString(),
      }));
      const { error } = await supabase.from('plants').insert(payload);
      if (error) throw error;
      return ok(generatedIds);
    } catch (e) {
      return err(e);
    }
  },

  async transfer(plantId: string, updates: TransferPlantInput): Promise<Result<void>> {
    try {
      const { error } = await supabase.from('plants').update(updates).eq('id', plantId);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return err(e);
    }
  },

  async archive(plantId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('plants')
        .update({ stage: 'ARCHIVED' })
        .eq('id', plantId);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return err(e);
    }
  },
};
