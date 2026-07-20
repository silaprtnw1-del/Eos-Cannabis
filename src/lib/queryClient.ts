import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export const queryKeys = {
  plants: ['plants'] as const,
  allPlants: ['plants', 'all'] as const,
  plantStages: ['plants', 'stages'] as const,
  rooms: ['rooms'] as const,
  batches: ['batches'] as const,
  motherPlants: ['motherPlants'] as const,
  cultivationLogs: ['cultivationLogs'] as const,
  latestClimates: ['environmentalLogs', 'latest'] as const,
  historicalClimates: (roomname: string, hours: number) =>
    ['environmentalLogs', 'historical', roomname, hours] as const,
  gacpChecklist: (checkdate: string) => ['gacpChecklists', checkdate] as const,
  gacpChecklists: ['gacpChecklists'] as const,
  users: ['users'] as const,
  syncStatus: ['syncStatus'] as const,
};
