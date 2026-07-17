import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roomsService } from '../services';
import { unwrap } from '../services/result';
import { queryKeys } from '../lib/queryClient';
import type { Room } from '../types';

export function useRooms() {
  return useQuery({
    queryKey: queryKeys.rooms,
    queryFn: async () => unwrap(await roomsService.listActive()),
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; type: Room['type'] }) =>
      roomsService.create(input).then(unwrap),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.rooms }),
  });
}

export function useSoftDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => roomsService.softDelete(roomId).then(unwrap),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.rooms }),
  });
}
