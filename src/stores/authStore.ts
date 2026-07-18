import { create } from 'zustand';
import type { Session, UserRole } from '../types';
import { authService } from '../services/auth';

interface AuthState {
  session: Session | null;
  userRole: UserRole;
  userFullName: string;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<() => void>;
  signOut: () => Promise<void>;
}

const DEFAULT_ROLE: UserRole = 'OPERATOR';
const DEFAULT_NAME = 'Operator';

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  userRole: DEFAULT_ROLE,
  userFullName: DEFAULT_NAME,
  loading: true,
  initialized: false,

  async init() {
    if (get().initialized) return () => {};

    const session = await authService.getSession();
    if (session) {
      const { data } = await authService.fetchProfile(session.user.id);
      if (data?.isactive === false) {
        // Account deactivated — refuse the restored session outright.
        await authService.signOut();
        set({ session: null, userRole: DEFAULT_ROLE, userFullName: DEFAULT_NAME, loading: false, initialized: true });
      } else {
        set({
          session,
          userRole: data?.role ?? DEFAULT_ROLE,
          userFullName: data?.fullname ?? DEFAULT_NAME,
          loading: false,
          initialized: true,
        });
      }
    } else {
      set({ session: null, loading: false, initialized: true });
    }

    const { data: sub } = authService.onAuthStateChange(async (nextSession) => {
      if (nextSession) {
        const { data } = await authService.fetchProfile(nextSession.user.id);
        if (data?.isactive === false) {
          // Caught on token refresh / re-auth: a user deactivated mid-session
          // is signed out at the next auth event (RLS already blocks their
          // reads/writes server-side in the meantime).
          await authService.signOut();
          return;
        }
        set({
          session: nextSession,
          userRole: data?.role ?? DEFAULT_ROLE,
          userFullName: data?.fullname ?? DEFAULT_NAME,
          loading: false,
        });
      } else {
        set({
          session: null,
          userRole: DEFAULT_ROLE,
          userFullName: DEFAULT_NAME,
          loading: false,
        });
      }
    });

    return () => sub.subscription.unsubscribe();
  },

  async signOut() {
    await authService.signOut();
  },
}));
