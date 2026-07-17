import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { batchesService } from '../services';
import { unwrap } from '../services/result';
import { queryKeys } from '../lib/queryClient';

export function useBatches() {
  return useQuery({
    queryKey: queryKeys.batches,
    queryFn: async () => unwrap(await batchesService.listActive()),
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name: string; strainname: string }) =>
      batchesService.create(input).then(unwrap),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.batches }),
  });
}
