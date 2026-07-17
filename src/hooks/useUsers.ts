import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersService, type RegisterOperatorInput } from '../services';
import { unwrap } from '../services/result';
import { queryKeys } from '../lib/queryClient';

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => unwrap(await usersService.list()),
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      usersService.setActive(userId, isActive).then(unwrap),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export function useRegisterOperator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterOperatorInput) => usersService.registerOperator(input).then(unwrap),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
}
