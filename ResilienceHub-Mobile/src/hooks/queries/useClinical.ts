import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { unwrap } from './utils';

/** A user's protective factors. Disabled until a userId is available. */
export function useProtectiveFactors(userId: number | null) {
  return useQuery({
    queryKey: ['protectiveFactors', userId ?? 0],
    queryFn: () => unwrap<any[]>(ApiService.getProtectiveFactors(userId as number)),
    enabled: !!userId,
  });
}

/** A user's coping strategies. Disabled until a userId is available. */
export function useCopingStrategies(userId: number | null) {
  return useQuery({
    queryKey: ['copingStrategies', userId ?? 0],
    queryFn: () => unwrap<any[]>(ApiService.getCopingStrategies(userId as number)),
    enabled: !!userId,
  });
}
