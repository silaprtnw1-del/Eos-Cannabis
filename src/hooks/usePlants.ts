import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { plantsService, type RegisterClonesInput, type TransferPlantInput } from '../services';
import { unwrap } from '../services/result';
import { queryKeys } from '../lib/queryClient';

export function usePlants() {
  return useQuery({
    queryKey: queryKeys.plants,
    queryFn: async () => unwrap(await plantsService.listActive()),
  });
}

export function useAllPlants() {
  return useQuery({
    queryKey: queryKeys.allPlants,
    queryFn: async () => unwrap(await plantsService.listAll()),
  });
}

export function usePlantStages() {
  return useQuery({
    queryKey: queryKeys.plantStages,
    queryFn: async () => unwrap(await plantsService.listStages()),
  });
}

export function useRegisterClones() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterClonesInput) => plantsService.registerClones(input).then(unwrap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plants });
      queryClient.invalidateQueries({ queryKey: queryKeys.plantStages });
      queryClient.invalidateQueries({ queryKey: queryKeys.allPlants });
    },
  });
}

export function useTransferPlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plantId, updates }: { plantId: string; updates: TransferPlantInput }) =>
      plantsService.transfer(plantId, updates).then(unwrap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plants });
      queryClient.invalidateQueries({ queryKey: queryKeys.plantStages });
    },
  });
}

export function useArchivePlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plantId, archivereason }: { plantId: string; archivereason?: string | null }) =>
      plantsService.archive(plantId, archivereason).then(unwrap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plants });
      queryClient.invalidateQueries({ queryKey: queryKeys.plantStages });
      queryClient.invalidateQueries({ queryKey: queryKeys.allPlants });
    },
  });
}
