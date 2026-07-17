import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motherPlantsService, type CreateMotherPlantInput } from '../services';
import { unwrap } from '../services/result';
import { queryKeys } from '../lib/queryClient';

export function useMotherPlants() {
  return useQuery({
    queryKey: queryKeys.motherPlants,
    queryFn: async () => unwrap(await motherPlantsService.list()),
  });
}

export function useCreateMotherPlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMotherPlantInput) => motherPlantsService.create(input).then(unwrap),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.motherPlants }),
  });
}
