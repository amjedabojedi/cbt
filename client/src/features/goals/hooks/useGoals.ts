import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Goal, Milestone } from "../types";
import type { GoalFormValues, MilestoneFormValues } from "../components/GoalForm";

export function useGoals(apiPath: string | null, activeUserId: number | undefined) {
  return useQuery<Goal[]>({
    queryKey: [`${apiPath}/goals`],
    enabled: !!activeUserId && !!apiPath,
  });
}

export function useAllMilestones(
  apiPath: string | null,
  activeUserId: number | undefined,
  goalsCount: number,
) {
  return useQuery<Milestone[]>({
    queryKey: [`${apiPath}/goals/milestones`],
    enabled: !!activeUserId && !!apiPath && goalsCount > 0,
  });
}

export function useGoalMilestones(goalId: number | undefined) {
  return useQuery<Milestone[]>({
    queryKey: goalId ? [`/api/goals/${goalId}/milestones`] : [],
    enabled: !!goalId,
  });
}

export function useCreateGoal(apiPath: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      data,
      userId,
      activeUserId,
    }: {
      data: GoalFormValues;
      userId: number;
      activeUserId: number;
    }) => {
      const response = await apiRequest("POST", `${apiPath}/goals`, {
        ...data,
        userId: activeUserId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/goals`] });
      toast({
        title: "Goal Created",
        description: "Your goal has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create goal: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useCreateMilestone(
  apiPath: string | null,
  selectedGoalId: number | undefined,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: MilestoneFormValues) => {
      if (!selectedGoalId) throw new Error("No goal selected");
      const response = await apiRequest(
        "POST",
        `/api/goals/${selectedGoalId}/milestones`,
        { ...data, goalId: selectedGoalId },
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/goals/${selectedGoalId}/milestones`],
      });
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/goals`] });
      queryClient.invalidateQueries({
        queryKey: [`${apiPath}/goals/milestones`],
      });
      toast({
        title: "Milestone Added",
        description: "Milestone has been added to your goal.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add milestone: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateGoalStatus(apiPath: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      goalId,
      status,
      comments,
    }: {
      goalId: number;
      status: string;
      comments?: string;
    }) => {
      const response = await apiRequest("PATCH", `/api/goals/${goalId}/status`, {
        status,
        therapistComments: comments,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/goals`] });
      toast({
        title: "Goal Updated",
        description: "Goal status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update goal: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useToggleMilestoneCompletion(
  apiPath: string | null,
  selectedGoalId: number | undefined,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      milestoneId,
      isCompleted,
    }: {
      milestoneId: number;
      isCompleted: boolean;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/milestones/${milestoneId}/completion`,
        { isCompleted },
      );
      return await response.json();
    },
    onSuccess: () => {
      if (selectedGoalId) {
        queryClient.invalidateQueries({
          queryKey: [`/api/goals/${selectedGoalId}/milestones`],
        });
      }
      queryClient.invalidateQueries({ queryKey: [`${apiPath}/goals`] });
      queryClient.invalidateQueries({
        queryKey: [`${apiPath}/goals/milestones`],
      });
      toast({
        title: "Milestone Updated",
        description: "Milestone completion status has been updated.",
      });
    },
  });
}
