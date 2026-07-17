import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gacpChecklistsService, type UpsertChecklistInput } from '../services';
import { unwrap, isNetworkError } from '../services/result';
import { queryKeys } from '../lib/queryClient';
import { genLocalId, insertLocalGacpChecklist } from '../../localDb';

export function useChecklistByDate(checkdate: string) {
  return useQuery({
    queryKey: queryKeys.gacpChecklist(checkdate),
    queryFn: async () => unwrap(await gacpChecklistsService.getByDate(checkdate)),
  });
}

export function useChecklistsHistory(limit = 15) {
  return useQuery({
    queryKey: [...queryKeys.gacpChecklists, limit],
    queryFn: async () => unwrap(await gacpChecklistsService.listRecent(limit)),
  });
}

/** Resolves { queued: true } when saved to Supabase failed on a genuine
 * network error and the checklist was queued locally instead of thrown. */
export function useUpsertChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertChecklistInput): Promise<{ queued: boolean }> => {
      const result = await gacpChecklistsService.upsert(input);
      if (!result.error) return { queued: false };
      if (!isNetworkError(result.error)) throw result.error;

      await insertLocalGacpChecklist({
        id: genLocalId(),
        checkdate: input.checkdate,
        operatorid: input.operatorid,
        tasks: JSON.stringify(input.tasks),
        haspestincident: input.haspestincident,
        incidentdetails: input.incidentdetails,
        correctiveaction: input.correctiveaction,
        synced: false,
      });
      return { queued: true };
    },
    onSuccess: ({ queued }, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gacpChecklist(input.checkdate) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gacpChecklists });
      if (queued) queryClient.invalidateQueries({ queryKey: queryKeys.syncStatus });
    },
  });
}
