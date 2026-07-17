import { useMemo } from 'react';
import { usePlantStages } from './usePlants';
import { useLatestClimates } from './useEnvironmentalLogs';
import { useChecklistByDate } from './useGacpChecklists';
import { calculateCompliance } from '../domain/gacpCompliance';

export interface DashboardStats {
  cloneCount: number;
  vegCount: number;
  flowerCount: number;
  complianceRate: number;
  totalTasks: number;
  completedTasks: number;
  loading: boolean;
  error: string;
  refetch: () => void;
}

export function useDashboardStats(): DashboardStats {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const stagesQuery = usePlantStages();
  const climatesQuery = useLatestClimates();
  const checklistQuery = useChecklistByDate(today);

  const stageCounts = useMemo(() => {
    const stages = stagesQuery.data ?? [];
    return stages.reduce(
      (acc, stage) => {
        if (stage === 'CLONE') acc.cloneCount++;
        else if (stage === 'VEG') acc.vegCount++;
        else if (stage === 'FLOWER') acc.flowerCount++;
        return acc;
      },
      { cloneCount: 0, vegCount: 0, flowerCount: 0 }
    );
  }, [stagesQuery.data]);

  const compliance = useMemo(
    () => calculateCompliance(checklistQuery.data?.tasks),
    [checklistQuery.data]
  );

  const firstError = stagesQuery.error ?? climatesQuery.error ?? checklistQuery.error;

  return {
    ...stageCounts,
    ...compliance,
    loading: stagesQuery.isLoading || climatesQuery.isLoading || checklistQuery.isLoading,
    error: firstError ? firstError.message : '',
    refetch: () => {
      stagesQuery.refetch();
      climatesQuery.refetch();
      checklistQuery.refetch();
    },
  };
}

export { useLatestClimates } from './useEnvironmentalLogs';
