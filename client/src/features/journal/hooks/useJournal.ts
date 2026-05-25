import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { JournalEntry, JournalStats, ThoughtRecord } from "../types";

export function useJournalEntries(userId: number | undefined) {
  return useQuery<JournalEntry[]>({
    queryKey: [`/api/users/${userId}/journal`],
    enabled: !!userId,
  });
}

export function useJournalStats(userId: number | undefined) {
  return useQuery<JournalStats>({
    queryKey: [`/api/users/${userId}/journal/stats`],
    enabled: !!userId,
    placeholderData: {
      totalEntries: 0,
      emotions: {},
      topics: {},
      sentimentOverTime: [],
      tagsFrequency: {},
      sentimentPatterns: null,
    },
  });
}

export function useThoughtRecords(userId: number | undefined) {
  return useQuery<ThoughtRecord[]>({
    queryKey: [`/api/users/${userId}/thoughts`],
    enabled: !!userId,
  });
}

export function useCreateJournalEntry() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newEntry: { title: string; content: string }) => {
      const response = await apiRequest("POST", `/api/journal`, newEntry);
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateJournalEntry() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<JournalEntry>;
    }) => {
      const response = await apiRequest("PATCH", `/api/journal/${id}`, updates);
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteJournalEntry() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/journal/${id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAddJournalComment() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      entryId,
      comment,
    }: {
      entryId: number;
      comment: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/journal/${entryId}/comments`,
        { content: comment }
      );
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error Adding Comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateJournalTags(
  userId: number | undefined,
  currentEntryId: number | undefined,
  selectedTags: string[]
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!currentEntryId || !userId) return null;
      const response = await apiRequest(
        "PATCH",
        `/api/journal/${currentEntryId}`,
        { userSelectedTags: selectedTags }
      );
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({
          queryKey: [`/api/users/${userId}/journal/stats`],
        });
        toast({
          title: "Tags Updated",
          description: "Your tags have been updated.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Tags",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateJournalDistortions(
  userId: number | undefined,
  currentEntryId: number | undefined,
  selectedDistortions: string[]
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!currentEntryId || !userId) return null;
      const response = await apiRequest(
        "PATCH",
        `/api/journal/${currentEntryId}`,
        { userSelectedDistortions: selectedDistortions }
      );
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({
          queryKey: [`/api/users/${userId}/journal/stats`],
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Updating Distortions",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useLinkThoughtRecord(
  currentEntryId: number | undefined,
  userId: number | undefined
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (thoughtRecordId: number) => {
      if (!currentEntryId || !userId) {
        throw new Error("Missing required data for linking");
      }
      const response = await apiRequest(
        "POST",
        `/api/users/${userId}/journal/${currentEntryId}/link-thought`,
        { thoughtRecordId }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${userId}/thoughts`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Linking Record",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUnlinkThoughtRecord(
  currentEntryId: number | undefined,
  userId: number | undefined
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (thoughtRecordId: number) => {
      if (!currentEntryId || !userId) {
        throw new Error("Missing required data for unlinking");
      }
      const response = await apiRequest(
        "DELETE",
        `/api/users/${userId}/journal/${currentEntryId}/link-thought/${thoughtRecordId}`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${userId}/thoughts`],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Unlinking Record",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
