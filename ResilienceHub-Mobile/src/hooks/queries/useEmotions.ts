import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { unwrap, queryKeys } from './utils';

/** Fetches a user's emotion entries. Disabled until a userId is available. */
export function useEmotions(userId: number | null) {
  return useQuery({
    queryKey: queryKeys.emotions(userId ?? 0),
    queryFn: () => unwrap<any[]>(ApiService.getUserEmotions(userId as number)),
    enabled: !!userId,
  });
}

export function useCreateEmotion(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => unwrap(ApiService.createEmotion(userId as number, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.emotions(userId ?? 0) }),
  });
}

export function useUpdateEmotion(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ emotionId, data }: { emotionId: number; data: any }) =>
      unwrap(ApiService.updateEmotion(userId as number, emotionId, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.emotions(userId ?? 0) }),
  });
}

export function useDeleteEmotion(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emotionId: number) => unwrap(ApiService.deleteEmotion(userId as number, emotionId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.emotions(userId ?? 0) }),
  });
}
