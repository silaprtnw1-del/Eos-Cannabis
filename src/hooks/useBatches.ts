import { useQuery } from '@tanstack/react-query';
import { batchesService } from '../services';
import { unwrap } from '../services/result';
import { queryKeys } from '../lib/queryClient';

export function useBatches() {
  return useQuery({
    queryKey: queryKeys.batches,
    queryFn: async () => unwrap(await batchesService.listActive()),
  });
}
