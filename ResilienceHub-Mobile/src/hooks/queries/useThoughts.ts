import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { unwrap, queryKeys } from './utils';

/** Fetches a user's thought records. Disabled until a userId is available. */
export function useThoughts(userId: number | null) {
  return useQuery({
    queryKey: queryKeys.thoughts(userId ?? 0),
    queryFn: () => unwrap<any[]>(ApiService.getThoughtRecords(userId as number)),
    enabled: !!userId,
  });
}

export function useCreateThought(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => unwrap(ApiService.createThoughtRecord(userId as number, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.thoughts(userId ?? 0) }),
  });
}

export function useUpdateThought(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ thoughtId, data }: { thoughtId: number; data: any }) =>
      unwrap(ApiService.updateThoughtRecord(userId as number, thoughtId, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.thoughts(userId ?? 0) }),
  });
}

export function useDeleteThought(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (thoughtId: number) => unwrap(ApiService.deleteThoughtRecord(userId as number, thoughtId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.thoughts(userId ?? 0) }),
  });
}
