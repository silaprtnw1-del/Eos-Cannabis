import { supabase, createEphemeralClient } from '../../supabase';
import type { UserRole } from '../types';
import { Result, ok, err } from './result';

export interface RegisterOperatorInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone: string;
}

export interface DBUser {
  id: string;
  username: string;
  fullname: string;
  role: UserRole;
  isactive: boolean;
  phone?: string | null;
  createdat: string;
}

export const usersService = {
  async list(): Promise<Result<DBUser[]>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('createdat', { ascending: false });
      if (error) throw error;
      return ok((data ?? []) as DBUser[]);
    } catch (e) {
      return err(e);
    }
  },

  async setActive(userId: string, isActive: boolean): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ isactive: isActive })
        .eq('id', userId);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return err(e);
    }
  },

  /**
   * Register a new operator without disturbing the caller's session.
   * Uses an ephemeral client so the admin remains logged in.
   */
  async registerOperator(input: RegisterOperatorInput): Promise<Result<{ userId: string }>> {
    try {
      const ephemeral = createEphemeralClient();
      const { data, error } = await ephemeral.auth.signUp({
        email: input.email,
        password: input.password,
        phone: input.phone,
        options: {
          data: { role: input.role, fullName: input.fullName },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('User not created');

      // public.users has no `email` column — schema.ts uses `username`.
      // No DB trigger creates this row (verified: handle_new_user is not
      // bound to auth.users) — this insert is the sole write path.
      const { error: insertErr } = await supabase.from('users').insert({
        id: data.user.id,
        username: input.email,
        role: input.role,
        fullname: input.fullName,
        phone: input.phone || null,
      });
      if (insertErr) throw insertErr;

      return ok({ userId: data.user.id });
    } catch (e) {
      return err(e);
    }
  },
};
