import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  ProtectiveFactor,
  CopingStrategy,
  EducationalResource,
  ResourceAssignment,
  ProtectiveFactorFormValues,
  CopingStrategyFormValues,
} from "../types";

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export function useProtectiveFactors(userId: number | undefined) {
  return useQuery<ProtectiveFactor[]>({
    queryKey: userId ? [`/api/users/${userId}/protective-factors`] : [],
    enabled: !!userId,
  });
}

export function useCopingStrategies(userId: number | undefined) {
  return useQuery<CopingStrategy[]>({
    queryKey: userId ? [`/api/users/${userId}/coping-strategies`] : [],
    enabled: !!userId,
  });
}

export function useEducationalResources(enabled: boolean) {
  return useQuery<EducationalResource[]>({
    queryKey: ["/api/resources"],
    enabled,
    retry: 1,
    retryDelay: 500,
  });
}

export function useTherapistClients(enabled: boolean) {
  return useQuery<any[]>({
    queryKey: ["/api/users/clients"],
    enabled,
  });
}

export function useResourceAssignments(enabled: boolean) {
  return useQuery<ResourceAssignment[]>({
    queryKey: ["/api/therapist/assignments"],
    enabled,
    retry: 1,
    retryDelay: 500,
  });
}

// ---------------------------------------------------------------------------
// Protective factor mutations
// ---------------------------------------------------------------------------

export function useCreateProtectiveFactor(userId: number | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ProtectiveFactorFormValues) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("POST", `/api/users/${userId}/protective-factors`, {
        ...data,
        userId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/protective-factors`] });
      toast({ title: "Protective Factor Added", description: "Your protective factor has been added to your library." });
    },
    onError: (error) => {
      console.error("Error creating protective factor:", error);
      toast({ title: "Error", description: "Failed to add protective factor. Please try again.", variant: "destructive" });
    },
  });
}

export function useUpdateProtectiveFactor(userId: number | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProtectiveFactorFormValues }) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("PUT", `/api/users/${userId}/protective-factors/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update protective factor");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/protective-factors`] });
      toast({ title: "Protective Factor Updated", description: "Your protective factor has been updated." });
    },
    onError: (error) => {
      console.error("Error updating protective factor:", error);
      toast({ title: "Error", description: "Failed to update protective factor. Please try again.", variant: "destructive" });
    },
  });
}

export function useDeleteProtectiveFactor(userId: number | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (factorId: number) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("DELETE", `/api/users/${userId}/protective-factors/${factorId}`, null);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete protective factor");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/protective-factors`] });
      toast({ title: "Protective Factor Deleted", description: "The protective factor has been removed from your library." });
    },
    onError: (error) => {
      console.error("Error deleting protective factor:", error);
      toast({ title: "Error", description: "Failed to delete protective factor. Please try again.", variant: "destructive" });
    },
  });
}

// ---------------------------------------------------------------------------
// Coping strategy mutations
// ---------------------------------------------------------------------------

export function useCreateCopingStrategy(userId: number | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CopingStrategyFormValues) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("POST", `/api/users/${userId}/coping-strategies`, {
        ...data,
        userId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/coping-strategies`] });
      toast({ title: "Coping Strategy Added", description: "Your coping strategy has been added to your library." });
    },
    onError: (error) => {
      console.error("Error creating coping strategy:", error);
      toast({ title: "Error", description: "Failed to add coping strategy. Please try again.", variant: "destructive" });
    },
  });
}

export function useUpdateCopingStrategy(userId: number | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CopingStrategyFormValues }) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("PUT", `/api/users/${userId}/coping-strategies/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update coping strategy");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/coping-strategies`] });
      toast({ title: "Coping Strategy Updated", description: "Your coping strategy has been updated." });
    },
    onError: (error) => {
      console.error("Error updating coping strategy:", error);
      toast({ title: "Error", description: "Failed to update coping strategy. Please try again.", variant: "destructive" });
    },
  });
}

export function useDeleteCopingStrategy(userId: number | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (strategyId: number) => {
      if (!userId) throw new Error("User not authenticated");
      const response = await apiRequest("DELETE", `/api/users/${userId}/coping-strategies/${strategyId}`, null);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete coping strategy");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/coping-strategies`] });
      toast({ title: "Coping Strategy Deleted", description: "The coping strategy has been removed from your library." });
    },
    onError: (error) => {
      console.error("Error deleting coping strategy:", error);
      toast({ title: "Error", description: "Failed to delete coping strategy. Please try again.", variant: "destructive" });
    },
  });
}

// ---------------------------------------------------------------------------
// Educational resource mutations
// ---------------------------------------------------------------------------

export function useCreateResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (resourceData: Omit<EducationalResource, "id" | "isEditing"> & { createdBy?: number }) => {
      const response = await apiRequest("POST", "/api/resources", resourceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({ title: "Resource Added", description: "Your educational resource has been added to the library." });
    },
    onError: (error) => {
      console.error("Error creating resource:", error);
      toast({ title: "Error", description: "Failed to add educational resource. Please try again.", variant: "destructive" });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<EducationalResource> }) => {
      const response = await apiRequest("PATCH", `/api/resources/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update resource");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({ title: "Resource Updated", description: "The educational resource has been updated." });
    },
    onError: (error) => {
      console.error("Error updating resource:", error);
      toast({ title: "Error", description: "Failed to update resource. Please try again.", variant: "destructive" });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await apiRequest("DELETE", `/api/resources/${resourceId}`, null);
      if (response.status === 404) return { success: true };
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to delete resource" }));
        throw new Error(errorData.message || "Failed to delete resource");
      }
      if (response.status === 204) return { success: true };
      return response.json().catch(() => ({ success: true }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({ title: "Resource Deleted", description: "The educational resource has been removed from the library." });
    },
    onError: (error) => {
      console.error("Error deleting resource:", error);
      if (error instanceof Error && error.message === "Resource not found") {
        queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
        toast({ title: "Resource Deleted", description: "The educational resource has been removed from the library." });
        return;
      }
      toast({ title: "Error", description: "Failed to delete resource. Please try again.", variant: "destructive" });
    },
  });
}

export function useAssignResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ resourceId, clientIds, notes }: { resourceId: number; clientIds: number[]; notes: string }) => {
      if (clientIds.length === 0) throw new Error("Please select at least one client");
      const promises = clientIds.map((clientId) =>
        apiRequest("POST", "/api/resources/assign", { resourceId, clientId, notes })
      );
      const results = await Promise.all(promises);
      for (const response of results) {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to assign resource to one or more clients");
        }
      }
      return results.map((r) => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapist/assignments"] });
      toast({ title: "Resource Assigned", description: "The resource has been assigned to the selected client(s)." });
    },
    onError: (error) => {
      console.error("Error assigning resource:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign resource. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useCloneResource() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await apiRequest("POST", `/api/resources/${resourceId}/clone`, null);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to clone resource");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({ title: "Resource Cloned", description: "You can now customize this resource before assigning it to clients." });
    },
    onError: (error) => {
      console.error("Error cloning resource:", error);
      toast({ title: "Error", description: "Failed to clone resource. Please try again.", variant: "destructive" });
    },
  });
}
