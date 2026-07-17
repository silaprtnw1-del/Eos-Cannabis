import { supabase } from '../../supabase';
import type { Plant, PlantSource } from '../types';
import { Result, ok, err } from './result';
import { generatePlantId } from '../domain/plantId';

export interface RegisterClonesInput {
  strainname: string;
  strainAcronym: string;
  roomname: string;
  batchid: string | null;
  stage: Plant['stage'];
  count: number;
  source?: PlantSource;
  motherid?: string | null;
}

export interface TransferPlantInput {
  roomname: string;
  stage: Plant['stage'];
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

  async listAll(): Promise<Result<Plant[]>> {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('id, strainname, stage, roomname, plantedat, batchid, motherid, archivereason')
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
        motherid: input.motherid ?? null,
        plantedat: new Date().toISOString(),
        metadata: input.source ? { source: input.source } : null,
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

  async archive(plantId: string, archivereason?: string | null): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('plants')
        .update({ stage: 'ARCHIVED', archivereason: archivereason ?? null })
        .eq('id', plantId);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return err(e);
    }
  },
};
