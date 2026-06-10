import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { unwrap, queryKeys } from './utils';

/** Fetches a user's goals. Disabled until a userId is available. */
export function useGoals(userId: number | null) {
  return useQuery({
    queryKey: queryKeys.goals(userId ?? 0),
    queryFn: () => unwrap<any[]>(ApiService.getGoals(userId as number)),
    enabled: !!userId,
  });
}

export function useCreateGoal(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => unwrap(ApiService.createGoal(userId as number, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goals(userId ?? 0) }),
  });
}

/** All milestones across a user's goals (flattened). */
export function useAllMilestones(userId: number | null) {
  return useQuery({
    queryKey: queryKeys.allMilestones(userId ?? 0),
    queryFn: () => unwrap<any[]>(ApiService.getAllMilestones(userId as number)),
    enabled: !!userId,
  });
}

export function useGoalMilestones(goalId: number | null) {
  return useQuery({
    queryKey: queryKeys.goalMilestones(goalId ?? 0),
    queryFn: () => unwrap<any[]>(ApiService.getGoalMilestones(goalId as number)),
    enabled: !!goalId,
  });
}

export function useCreateMilestone(goalId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => unwrap(ApiService.createMilestone(goalId as number, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goalMilestones(goalId ?? 0) }),
  });
}

export function useToggleMilestone(goalId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, isCompleted }: { milestoneId: number; isCompleted: boolean }) =>
      unwrap(ApiService.toggleMilestoneCompletion(milestoneId, isCompleted)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goalMilestones(goalId ?? 0) }),
  });
}
