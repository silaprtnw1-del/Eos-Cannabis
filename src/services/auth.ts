import { supabase } from '../../supabase';
import type { Session, UserProfile, UserRole } from '../types';
import { Result, ok, err } from './result';

export const authService = {
  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async signIn(email: string, password: string): Promise<Result<Session>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new Error('No session returned');
      return ok(data.session);
    } catch (e) {
      return err(e);
    }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async fetchProfile(userId: string): Promise<Result<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, fullname, isactive')
        .eq('id', userId)
        .single();

      if (!error && data) {
        return ok({
          role: data.role as UserRole,
          fullname: data.fullname,
          isactive: data.isactive as boolean,
        });
      }

      const { data: userData } = await supabase.auth.getUser();
      const meta = userData.user?.user_metadata ?? {};
      return ok({
        role: (meta.role ?? 'OPERATOR') as UserRole,
        fullname: (meta.fullName ?? 'Operator') as string,
      });
    } catch (e) {
      return err(e);
    }
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => callback(session));
  },

  async pingDb(): Promise<'connected' | 'error'> {
    try {
      const { error } = await supabase.from('plants').select('id').limit(1);
      if (error && error.code !== 'PGRST116' && !error.message.includes('does not exist')) {
        return 'error';
      }
      return 'connected';
    } catch {
      return 'error';
    }
  },
};
