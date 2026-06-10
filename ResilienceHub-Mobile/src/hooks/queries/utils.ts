import { ApiResponse } from '../../services/api';

/**
 * Unwraps an ApiService response for React Query: returns the data on success,
 * throws on error so `useQuery`/`useMutation` surface it via `isError`/`error`.
 */
export async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const res = await promise;
  if (res.error) throw new Error(res.error);
  return res.data as T;
}

/** Centralized React Query keys — keep all cache keys here to avoid typos/collisions. */
export const queryKeys = {
  notifications: ['notifications'] as const,
  emotions: (userId: number) => ['emotions', userId] as const,
  thoughts: (userId: number) => ['thoughts', userId] as const,
  journal: (userId: number) => ['journal', userId] as const,
  goals: (userId: number) => ['goals', userId] as const,
  goalMilestones: (goalId: number) => ['goalMilestones', goalId] as const,
  allMilestones: (userId: number) => ['allMilestones', userId] as const,
  reframePractices: (userId: number) => ['reframePractices', userId] as const,
  resources: ['resources'] as const,
  adminStats: ['adminStats'] as const,
  allUsers: ['allUsers'] as const,
  therapistClients: ['therapistClients'] as const,
  currentUser: ['currentUser'] as const,
};
