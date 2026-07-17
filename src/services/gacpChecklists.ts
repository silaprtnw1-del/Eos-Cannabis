import { supabase } from '../../supabase';
import type { ChecklistLog } from '../types';
import { Result, ok, err } from './result';

export interface UpsertChecklistInput {
  checkdate: string;
  operatorid: string;
  tasks: Record<string, boolean>;
  haspestincident: boolean;
  incidentdetails: string | null;
  correctiveaction: string | null;
}

export const gacpChecklistsService = {
  async getByDate(checkdate: string): Promise<Result<{ tasks: Record<string, boolean> } | null>> {
    try {
      const { data, error } = await supabase
        .from('gacp_compliance_checklists')
        .select('tasks')
        .eq('checkdate', checkdate)
        .maybeSingle();
      if (error) throw error;
      return ok(data ? { tasks: data.tasks as Record<string, boolean> } : null);
    } catch (e) {
      return err(e);
    }
  },

  async listRecent(limit = 15): Promise<Result<ChecklistLog[]>> {
    try {
      const { data, error } = await supabase
        .from('gacp_compliance_checklists')
        .select('*')
        .order('checkdate', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ok((data ?? []) as ChecklistLog[]);
    } catch (e) {
      return err(e);
    }
  },

  // audittrail is appended by a BEFORE INSERT/UPDATE trigger
  // (security_migration.sql) — do not send it from the client.
  async upsert(input: UpsertChecklistInput): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('gacp_compliance_checklists')
        .upsert(input, { onConflict: 'checkdate' });
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return err(e);
    }
  },
};
