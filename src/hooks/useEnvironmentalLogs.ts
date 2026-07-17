import { useQuery } from '@tanstack/react-query';
import { environmentalLogsService } from '../services';
import { unwrap } from '../services/result';
import { queryKeys } from '../lib/queryClient';

export function useLatestClimates() {
  return useQuery({
    queryKey: queryKeys.latestClimates,
    queryFn: async () => unwrap(await environmentalLogsService.listLatestByRoom()),
  });
}
