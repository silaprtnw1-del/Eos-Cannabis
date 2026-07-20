import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabase';
import { environmentalLogsService } from '../services';
import { unwrap } from '../services/result';
import { queryKeys } from '../lib/queryClient';

/**
 * Live climate readings per room. Subscribes to Supabase Realtime so a new
 * ESP32 insert refreshes the dashboard without polling.
 */
export function useLatestClimates() {
  const queryClient = useQueryClient();
  // supabase.channel() dedupes by topic name: on a fast-refresh remount the
  // old channel may still be mid-teardown, so a fixed name hands back an
  // already-subscribed channel and .on() throws. Unique name per mount avoids it.
  const channelName = useRef(`environmental_logs-changes-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const channel = supabase
      .channel(channelName.current)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'environmental_logs' },
        // Prefix match invalidates latestClimates + every historicalClimates variant too.
        () => queryClient.invalidateQueries({ queryKey: ['environmentalLogs'] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: queryKeys.latestClimates,
    queryFn: async () => unwrap(await environmentalLogsService.listLatestByRoom()),
  });
}

/** Historical readings for one room, for trend charts. Refreshes off the same Realtime channel as useLatestClimates. */
export function useHistoricalClimates(roomname: string, hours: number) {
  return useQuery({
    queryKey: queryKeys.historicalClimates(roomname, hours),
    queryFn: async () => {
      const sinceIso = new Date(Date.now() - hours * 3_600_000).toISOString();
      return unwrap(await environmentalLogsService.listHistoryByRoom(roomname, sinceIso));
    },
    enabled: !!roomname,
  });
}
