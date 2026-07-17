import { useQuery } from '@tanstack/react-query';
import { countPendingSync } from '../../localDb';
import { drainQueue } from '../services/sync';
import { queryKeys } from '../lib/queryClient';

/**
 * Count of queued offline writes awaiting sync. Also drives retry: while
 * count > 0 it polls every 5s (attempting drainQueue each time), so a
 * reconnect is picked up even if the app never leaves the foreground —
 * e.g. toggling airplane mode from the quick-settings shade doesn't
 * background the app on Android, so the AppState-based watcher alone
 * (src/stores/connectionStore.ts) wouldn't catch it. Idle (count === 0)
 * costs nothing — polling stops.
 */
export function useSyncStatus() {
  return useQuery({
    queryKey: queryKeys.syncStatus,
    queryFn: async () => {
      await drainQueue();
      return countPendingSync();
    },
    initialData: 0,
    refetchInterval: (query) => (query.state.data ? 5000 : false),
  });
}
