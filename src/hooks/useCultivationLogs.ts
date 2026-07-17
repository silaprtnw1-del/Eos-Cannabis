import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cultivationLogsService, type CreateCultivationLogInput } from '../services';
import { unwrap, isNetworkError } from '../services/result';
import { queryKeys } from '../lib/queryClient';
import { genLocalId, insertLocalCultivationLog } from '../../localDb';

export function useCultivationLogs(limit = 15) {
  return useQuery({
    queryKey: [...queryKeys.cultivationLogs, limit],
    queryFn: async () => unwrap(await cultivationLogsService.listRecent(limit)),
  });
}

/** Resolves { queued: true } when saved to Supabase failed on a genuine
 * network error and the log was queued locally instead of thrown. */
export function useCreateCultivationLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCultivationLogInput): Promise<{ queued: boolean }> => {
      const result = await cultivationLogsService.create(input);
      if (!result.error) return { queued: false };
      if (!isNetworkError(result.error)) throw result.error;

      await insertLocalCultivationLog({
        id: genLocalId(),
        batchid: input.batchid ?? '',
        roomname: input.roomname,
        watervolume: input.watervolume,
        waterunit: input.waterunit ?? 'liters',
        phin: input.phin,
        ecin: input.ecin,
        runoffvolume: input.runoffvolume ?? null,
        phout: input.phout ?? null,
        ecout: input.ecout ?? null,
        nutrientsfeed: JSON.stringify(input.nutrientsfeed),
        operatorid: input.operatorid,
        notes: input.notes ?? null,
        synced: false,
        logdate: new Date().toISOString(),
      });
      return { queued: true };
    },
    onSuccess: ({ queued }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cultivationLogs });
      if (queued) queryClient.invalidateQueries({ queryKey: queryKeys.syncStatus });
    },
  });
}
