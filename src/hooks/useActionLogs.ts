import { useMutation } from '@tanstack/react-query';
import { actionLogsService, type CreateActionLogInput } from '../services';
import { unwrap } from '../services/result';

export function useCreateActionLog() {
  return useMutation({
    mutationFn: (input: CreateActionLogInput) => actionLogsService.create(input).then(unwrap),
  });
}
