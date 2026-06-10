import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { unwrap, queryKeys } from './utils';

/** Fetches a user's reframe-coach practice results. Disabled until a userId is available. */
export function useReframePractices(userId: number | null) {
  return useQuery({
    queryKey: queryKeys.reframePractices(userId ?? 0),
    queryFn: () => unwrap<any[]>(ApiService.getReframePractices(userId as number)),
    enabled: !!userId,
  });
}

/** Fetches a user's reframe-coach profile (level, XP, streak, etc.). */
export function useReframeProfile(userId: number | null) {
  return useQuery({
    queryKey: ['reframeProfile', userId ?? 0],
    queryFn: () => unwrap<any>(ApiService.getReframeProfile(userId as number)),
    enabled: !!userId,
  });
}
