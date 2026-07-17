import { supabase, createEphemeralClient } from '../../supabase';
import type { UserRole } from '../types';
import { Result, ok, err } from './result';

export interface RegisterOperatorInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export const usersService = {
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
        options: {
          data: { role: input.role, fullName: input.fullName },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('User not created');

      const { error: insertErr } = await supabase.from('users').insert({
        id: data.user.id,
        email: input.email,
        role: input.role,
        fullname: input.fullName,
      });
      if (insertErr) throw insertErr;

      return ok({ userId: data.user.id });
    } catch (e) {
      return err(e);
    }
  },
};
