import { AppState } from 'react-native';
import { create } from 'zustand';
import { authService } from '../services/auth';
import { drainQueue } from '../services/sync';
import { queryClient, queryKeys } from '../lib/queryClient';

type Status = 'connected' | 'checking' | 'error';

interface ConnectionState {
  status: Status;
  check: () => Promise<void>;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'checking',
  async check() {
    set({ status: 'checking' });
    const result = await authService.pingDb();
    set({ status: result });
    if (result === 'connected') {
      drainQueue()
        .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.syncStatus }))
        .catch((e) => console.warn('Sync drain failed:', e));
    }
  },
}));

/**
 * Re-checks connectivity (and drains queued offline writes) whenever the
 * app returns to the foreground — e.g. after toggling airplane mode.
 * Uses AppState instead of @react-native-community/netinfo: the netinfo
 * native module crashed Expo Go on launch on this project, and a
 * foreground-based check is a fine proxy for "connectivity changed" at
 * this app's scale (single farm, no interval polling either way).
 */
export function startNetworkWatcher() {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') useConnectionStore.getState().check();
  });
  return () => sub.remove();
}
