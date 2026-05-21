import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DOMPurify from "dompurify";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PlusCircle,
  Shield,
  Sparkles,
  Trash2,
  Edit,
  BookOpen,
  FileText,
} from "lucide-react";

import ResourceCard from "@/features/resources/components/ResourceCard";
import ResourceViewer from "@/features/resources/components/ResourceViewer";
import CreatorPanel from "@/features/resources/components/CreatorPanel";
import FeedbackDialog from "@/features/resources/components/FeedbackDialog";

// Define schema for protective factors
const protectiveFactorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  isGlobal: z.boolean().default(false),
});

// Define schema for coping strategies
const copingStrategySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  isGlobal: z.boolean().default(false),
});

type ProtectiveFactorFormValues = z.infer<typeof protectiveFactorSchema>;
type CopingStrategyFormValues = z.infer<typeof copingStrategySchema>;

export default function ResourceLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Protective factors state
  const [isAddingFactor, setIsAddingFactor] = useState(false);
  const [isEditingFactor, setIsEditingFactor] = useState(false);
  const [selectedFactor, setSelectedFactor] = useState<any>(null);
  const [isDeleteFactorDialogOpen, setIsDeleteFactorDialogOpen] = useState(false);

  // Coping strategies state
  const [isAddingStrategy, setIsAddingStrategy] = useState(false);
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [isDeleteStrategyDialogOpen, setIsDeleteStrategyDialogOpen] = useState(false);

  // Educational resource states
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [resourceCategory, setResourceCategory] = useState<string>("all");
  const [isAssigningResource, setIsAssigningResource] = useState(false);
  const [isDeleteResourceDialogOpen, setIsDeleteResourceDialogOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [currentResource, setCurrentResource] = useState<{
    id: number;
    title: string;
    description: string;
    content: string;
    type: string;
    category: string;
    createdBy?: number;
    isPublished?: boolean;
    tags?: string[];
    isEditing?: boolean;
    pdfUrl?: string;
  } | null>(null);

  // Assignment viewing state
  const [viewingAssignment, setViewingAssignment] = useState<any>(null);
  const [isViewingAssignment, setIsViewingAssignment] = useState(false);

  // Resource categories (default list)
  const defaultCategories = [
    "all",
    "CBT Basics",
    "Anxiety",
    "Depression",
    "Stress Management",
    "Mindfulness",
    "Emotional Regulation",
    "Relationships",
    "Trauma",
    "Self Care",
  ];

  // Forms for adding new items
  const factorForm = useForm<ProtectiveFactorFormValues>({
    resolver: zodResolver(protectiveFactorSchema),
    defaultValues: { name: "", description: "", isGlobal: false },
  });

  const strategyForm = useForm<CopingStrategyFormValues>({
    resolver: zodResolver(copingStrategySchema),
    defaultValues: { name: "", description: "", isGlobal: false },
  });

  // Forms for editing existing items
  const editFactorForm = useForm<ProtectiveFactorFormValues>({
    resolver: zodResolver(protectiveFactorSchema),
    defaultValues: { name: "", description: "", isGlobal: false },
  });

  const editStrategyForm = useForm<CopingStrategyFormValues>({
    resolver: zodResolver(copingStrategySchema),
    defaultValues: { name: "", description: "", isGlobal: false },
  });

  // Fetch protective factors
  const {
    data: protectiveFactors,
    isLoading: factorsLoading,
    error: factorsError,
  } = useQuery<any>({
    queryKey: user ? [`/api/users/${user!.id}/protective-factors`] : [],
    enabled: !!user,
  });

  // Fetch coping strategies
  const {
    data: copingStrategies,
    isLoading: strategiesLoading,
    error: strategiesError,
  } = useQuery<any>({
    queryKey: user ? [`/api/users/${user!.id}/coping-strategies`] : [],
    enabled: !!user,
  });

  // Fetch educational resources
  const {
    data: educationalResources,
    isLoading: resourcesLoading,
  } = useQuery<any>({
    queryKey: ["/api/resources"],
    enabled: !!user,
  });

  // Fetch therapist's clients (only if user is a therapist)
  const {
    data: clients,
    isLoading: clientsLoading,
  } = useQuery<any>({
    queryKey: ["/api/users/clients"],
    enabled: !!user && user.role === "therapist",
  });

  // Create protective factor mutation
  const createFactorMutation = useMutation({
    mutationFn: async (data: ProtectiveFactorFormValues) => {
      if (!user) throw new Error("User not authenticated");
      const response = await apiRequest("POST", `/api/users/${user!.id}/protective-factors`, {
        ...data,
        userId: user.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user!.id}/protective-factors`] });
      setIsAddingFactor(false);
      factorForm.reset();
      toast({ title: "Protective Factor Added", description: "Your protective factor has been added to your library." });
    },
    onError: (error) => {
      console.error("Error creating protective factor:", error);
      toast({ title: "Error", description: "Failed to add protective factor. Please try again.", variant: "destructive" });
    },
  });

  // Create coping strategy mutation
  const createStrategyMutation = useMutation({
    mutationFn: async (data: CopingStrategyFormValues) => {
      if (!user) throw new Error("User not authenticated");
      const response = await apiRequest("POST", `/api/users/${user!.id}/coping-strategies`, {
        ...data,
        userId: user.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user!.id}/coping-strategies`] });
      setIsAddingStrategy(false);
      strategyForm.reset();
      toast({ title: "Coping Strategy Added", description: "Your coping strategy has been added to your library." });
    },
    onError: (error) => {
      console.error("Error creating coping strategy:", error);
      toast({ title: "Error", description: "Failed to add coping strategy. Please try again.", variant: "destructive" });
    },
  });

  // Delete protective factor mutation
  const deleteFactorMutation = useMutation({
    mutationFn: async (factorId: number) => {
      if (!user) throw new Error("User not authenticated");
      const response = await apiRequest("DELETE", `/api/users/${user!.id}/protective-factors/${factorId}`, null);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete protective factor");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user!.id}/protective-factors`] });
      setSelectedFactor(null);
      setIsDeleteFactorDialogOpen(false);
      toast({ title: "Protective Factor Deleted", description: "The protective factor has been removed from your library." });
    },
    onError: (error) => {
      console.error("Error deleting protective factor:", error);
      toast({ title: "Error", description: "Failed to delete protective factor. Please try again.", variant: "destructive" });
    },
  });

  // Delete coping strategy mutation
  const deleteStrategyMutation = useMutation({
    mutationFn: async (strategyId: number) => {
      if (!user) throw new Error("User not authenticated");
      const response = await apiRequest("DELETE", `/api/users/${user!.id}/coping-strategies/${strategyId}`, null);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete coping strategy");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user!.id}/coping-strategies`] });
      setSelectedStrategy(null);
      setIsDeleteStrategyDialogOpen(false);
      toast({ title: "Coping Strategy Deleted", description: "The coping strategy has been removed from your library." });
    },
    onError: (error) => {
      console.error("Error deleting coping strategy:", error);
      toast({ title: "Error", description: "Failed to delete coping strategy. Please try again.", variant: "destructive" });
    },
  });

  // Update protective factor mutation
  const updateFactorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProtectiveFactorFormValues }) => {
      if (!user) throw new Error("User not authenticated");
      const response = await apiRequest("PUT", `/api/users/${user!.id}/protective-factors/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update protective factor");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user!.id}/protective-factors`] });
      setIsEditingFactor(false);
      setSelectedFactor(null);
      toast({ title: "Protective Factor Updated", description: "Your protective factor has been updated." });
    },
    onError: (error) => {
      console.error("Error updating protective factor:", error);
      toast({ title: "Error", description: "Failed to update protective factor. Please try again.", variant: "destructive" });
    },
  });

  // Update coping strategy mutation
  const updateStrategyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CopingStrategyFormValues }) => {
      if (!user) throw new Error("User not authenticated");
      const response = await apiRequest("PUT", `/api/users/${user!.id}/coping-strategies/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update coping strategy");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user!.id}/coping-strategies`] });
      setIsEditingStrategy(false);
      setSelectedStrategy(null);
      toast({ title: "Coping Strategy Updated", description: "Your coping strategy has been updated." });
    },
    onError: (error) => {
      console.error("Error updating coping strategy:", error);
      toast({ title: "Error", description: "Failed to update coping strategy. Please try again.", variant: "destructive" });
    },
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: any) => {
      if (!user) throw new Error("User not authenticated");
      const response = await apiRequest("POST", "/api/resources", resourceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      setIsAddingResource(false);
      toast({ title: "Resource Added", description: "Your educational resource has been added to the library." });
    },
    onError: (error) => {
      console.error("Error creating resource:", error);
      toast({ title: "Error", description: "Failed to add educational resource. Please try again.", variant: "destructive" });
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      if (!user) throw new Error("User not authenticated");
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
      setCurrentResource(null);
      setIsDeleteResourceDialogOpen(false);
      toast({ title: "Resource Deleted", description: "The educational resource has been removed from the library." });
    },
    onError: (error) => {
      console.error("Error deleting resource:", error);
      if (error.message === "Resource not found") {
        queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
        setCurrentResource(null);
        setIsDeleteResourceDialogOpen(false);
        toast({ title: "Resource Deleted", description: "The educational resource has been removed from the library." });
        return;
      }
      toast({ title: "Error", description: "Failed to delete resource. Please try again.", variant: "destructive" });
    },
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      if (!user) throw new Error("User not authenticated");
      const response = await apiRequest("PATCH", `/api/resources/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update resource");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      if (currentResource) {
        setCurrentResource({ ...currentResource, isEditing: false });
      }
      toast({ title: "Resource Updated", description: "The educational resource has been updated." });
    },
    onError: (error) => {
      console.error("Error updating resource:", error);
      toast({ title: "Error", description: "Failed to update resource. Please try again.", variant: "destructive" });
    },
  });

  // Assign resource to client mutation
  const assignResourceMutation = useMutation({
    mutationFn: async ({ resourceId, clientIds, notes }: { resourceId: number; clientIds: number[]; notes: string }) => {
      if (!user) throw new Error("User not authenticated");
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
      setIsAssigningResource(false);
      setSelectedClients([]);
      setAssignmentNotes("");
      setCurrentResource(null);
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

  // Clone resource mutation (for therapists)
  const cloneResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      if (!user) throw new Error("User not authenticated");
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

  // Fetch client assignments (for therapists)
  const {
    data: clientAssignments = [] as any[],
    isLoading: assignmentsLoading,
  } = useQuery<any>({
    queryKey: ["/api/therapist/assignments"],
    enabled: !!user && user.role === "therapist",
  });

  // Handle form submissions
  const onSubmitFactor = (data: ProtectiveFactorFormValues) => {
    createFactorMutation.mutate(data);
  };

  const onSubmitStrategy = (data: CopingStrategyFormValues) => {
    createStrategyMutation.mutate(data);
  };

  const onUpdateFactor = (data: ProtectiveFactorFormValues) => {
    if (selectedFactor) {
      updateFactorMutation.mutate({ id: selectedFactor.id, data });
    }
  };

  const onUpdateStrategy = (data: CopingStrategyFormValues) => {
    if (selectedStrategy) {
      updateStrategyMutation.mutate({ id: selectedStrategy.id, data });
    }
  };

  const handleEditFactor = (factor: any) => {
    setSelectedFactor(factor);
    editFactorForm.reset({
      name: factor.name,
      description: factor.description || "",
      isGlobal: factor.isGlobal,
    });
    setIsEditingFactor(true);
  };

  const handleEditStrategy = (strategy: any) => {
    setSelectedStrategy(strategy);
    editStrategyForm.reset({
      name: strategy.name,
      description: strategy.description || "",
      isGlobal: strategy.isGlobal,
    });
    setIsEditingStrategy(true);
  };

  const handleSubmitCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dropdownCategory = formData.get("category") as string;
    const customCategory = formData.get("custom-category") as string;
    let categoryToUse = "other";
    if (dropdownCategory && dropdownCategory.trim()) {
      categoryToUse = dropdownCategory.trim();
    } else if (customCategory && customCategory.trim()) {
      categoryToUse = customCategory.trim();
    }
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      content: formData.get("content") as string,
      type: formData.get("type") as string,
      category: categoryToUse,
      tags: formData.get("tags")
        ? (formData.get("tags") as string).split(",").map((t) => t.trim())
        : [],
      isPublished: formData.get("published") === "on",
      pdfUrl: (formData.get("pdfUrl") as string) || undefined,
      createdBy: user?.id,
    };
    createResourceMutation.mutate(data);
  };

  const handleSubmitEdit = () => {
    if (currentResource) {
      const data = {
        title: currentResource.title,
        description: currentResource.description,
        content: currentResource.content,
        type: currentResource.type,
        category: currentResource.category,
        tags: currentResource.tags || [],
        isPublished: currentResource.isPublished,
        pdfUrl: currentResource.pdfUrl,
      };
      updateResourceMutation.mutate({ id: currentResource.id, data });
    }
  };

  // Filter functions for personal and global items
  const personalFactors = protectiveFactors?.filter(
    (factor: any) => !factor.isGlobal || factor.userId === user?.id
  );

  const globalFactors = protectiveFactors?.filter(
    (factor: any) => factor.isGlobal && factor.userId !== user?.id
  );

  const personalStrategies = copingStrategies?.filter(
    (strategy: any) => !strategy.isGlobal || strategy.userId === user?.id
  );

  const globalStrategies = copingStrategies?.filter(
    (strategy: any) => strategy.isGlobal && strategy.userId !== user?.id
  );

  if (factorsLoading || strategiesLoading) {
    return (
      <AppLayout title="Resource Library">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (factorsError || strategiesError) {
    return (
      <AppLayout title="Resource Library">
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-red-500">
                Error loading resources. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Resource Library">
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="protective-factors">
          <TabsList className="mb-6">
            <TabsTrigger value="protective-factors">Protective Factors</TabsTrigger>
            <TabsTrigger value="coping-strategies">Coping Strategies</TabsTrigger>
            <TabsTrigger value="educational-resources">Educational Resources</TabsTrigger>
            {user?.role === "therapist" && (
              <TabsTrigger value="client-assignments">Client Assignments</TabsTrigger>
            )}
          </TabsList>

          {/* Protective Factors Tab */}
          <TabsContent value="protective-factors">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-800">Protective Factors</h1>
                <p className="text-neutral-500">
                  Elements in your life that contribute to resilience and wellbeing
                </p>
              </div>

              <Dialog open={isAddingFactor} onOpenChange={setIsAddingFactor}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Factor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md w-[95vw]">
                  <DialogHeader>
                    <DialogTitle>Add a Protective Factor</DialogTitle>
                    <DialogDescription>
                      Protective factors are personal strengths or resources that help you overcome challenges
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...factorForm}>
                    <form onSubmit={factorForm.handleSubmit(onSubmitFactor)} className="space-y-4">
                      <FormField
                        control={factorForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="E.g., Supportive relationships" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={factorForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add more details about this protective factor..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {user?.role === "therapist" && (
                        <FormField
                          control={factorForm.control}
                          name="isGlobal"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Share with all clients</FormLabel>
                                <FormDescription>
                                  This will make the protective factor available to all your clients
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddingFactor(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createFactorMutation.isPending}>
                          {createFactorMutation.isPending ? "Adding..." : "Add Factor"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Edit Protective Factor Dialog */}
              <Dialog open={isEditingFactor} onOpenChange={setIsEditingFactor}>
                <DialogContent className="max-w-md w-[95vw]">
                  <DialogHeader>
                    <DialogTitle>Edit Protective Factor</DialogTitle>
                    <DialogDescription>Update your protective factor details</DialogDescription>
                  </DialogHeader>

                  <Form {...editFactorForm}>
                    <form onSubmit={editFactorForm.handleSubmit(onUpdateFactor)} className="space-y-4">
                      <FormField
                        control={editFactorForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="E.g., Supportive relationships" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editFactorForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add more details about this protective factor..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {user?.role === "therapist" && (
                        <FormField
                          control={editFactorForm.control}
                          name="isGlobal"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Share with all clients</FormLabel>
                                <FormDescription>
                                  This will make the protective factor available to all your clients
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditingFactor(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={updateFactorMutation.isPending}>
                          {updateFactorMutation.isPending ? "Updating..." : "Update Factor"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* My Protective Factors */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">My Protective Factors</CardTitle>
                <CardDescription>Factors you've personally identified or created</CardDescription>
              </CardHeader>
              <CardContent>
                {personalFactors?.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                      <Shield className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No personal protective factors yet</h3>
                    <p className="text-neutral-500 max-w-md mx-auto mb-6">
                      Add your personal protective factors to help identify strengths you can rely on during difficult times.
                    </p>
                    <Button onClick={() => setIsAddingFactor(true)}>Add Your First Protective Factor</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {personalFactors?.map((factor: any) => (
                      <Card key={factor.id} className="overflow-hidden border border-neutral-200 hover:shadow-md transition-shadow">
                        <CardHeader className="bg-neutral-50 p-4 pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-medium">{factor.name}</CardTitle>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditFactor(factor)}>
                                <Edit className="h-4 w-4 text-neutral-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive/90"
                                onClick={() => {
                                  setSelectedFactor(factor);
                                  setIsDeleteFactorDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <p className="text-sm text-neutral-600">{factor.description || "No description provided."}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Global Protective Factors */}
            {globalFactors?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shared Protective Factors</CardTitle>
                  <CardDescription>
                    {user?.role === "therapist" ? "Factors shared by other therapists" : "Factors shared by your therapist"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {globalFactors.map((factor: any) => (
                      <Card key={factor.id} className="overflow-hidden border border-neutral-200 hover:shadow-md transition-shadow">
                        <CardHeader className="bg-neutral-50 p-4 pb-3">
                          <CardTitle className="text-base font-medium">{factor.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <p className="text-sm text-neutral-600">{factor.description || "No description provided."}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteFactorDialogOpen} onOpenChange={setIsDeleteFactorDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Protective Factor</DialogTitle>
                  <div className="pt-2 text-sm text-muted-foreground">
                    Are you sure you want to delete this protective factor? This action cannot be undone.
                  </div>
                </DialogHeader>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDeleteFactorDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (selectedFactor) {
                        deleteFactorMutation.mutate(selectedFactor.id);
                        setIsDeleteFactorDialogOpen(false);
                      }
                    }}
                    disabled={deleteFactorMutation.isPending}
                  >
                    {deleteFactorMutation.isPending ? "Deleting..." : "Delete Factor"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Coping Strategies Tab */}
          <TabsContent value="coping-strategies">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-800">Coping Strategies</h1>
                <p className="text-neutral-500">
                  Techniques and approaches to manage stress and difficult emotions
                </p>
              </div>

              <Dialog open={isAddingStrategy} onOpenChange={setIsAddingStrategy}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Strategy
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md w-[95vw]">
                  <DialogHeader>
                    <DialogTitle>Add a Coping Strategy</DialogTitle>
                    <DialogDescription>
                      Coping strategies help you deal with stress, anxiety, and other difficult emotions
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...strategyForm}>
                    <form onSubmit={strategyForm.handleSubmit(onSubmitStrategy)} className="space-y-4">
                      <FormField
                        control={strategyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="E.g., Deep breathing exercises" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={strategyForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add more details about this coping strategy..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {user?.role === "therapist" && (
                        <FormField
                          control={strategyForm.control}
                          name="isGlobal"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Share with all clients</FormLabel>
                                <FormDescription>
                                  This will make the coping strategy available to all your clients
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddingStrategy(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createStrategyMutation.isPending}>
                          {createStrategyMutation.isPending ? "Adding..." : "Add Strategy"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Edit Coping Strategy Dialog */}
              <Dialog open={isEditingStrategy} onOpenChange={setIsEditingStrategy}>
                <DialogContent className="max-w-md w-[95vw]">
                  <DialogHeader>
                    <DialogTitle>Edit Coping Strategy</DialogTitle>
                    <DialogDescription>Update your coping strategy details</DialogDescription>
                  </DialogHeader>

                  <Form {...editStrategyForm}>
                    <form onSubmit={editStrategyForm.handleSubmit(onUpdateStrategy)} className="space-y-4">
                      <FormField
                        control={editStrategyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="E.g., Deep breathing exercises" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editStrategyForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add more details about this coping strategy..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {user?.role === "therapist" && (
                        <FormField
                          control={editStrategyForm.control}
                          name="isGlobal"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Share with all clients</FormLabel>
                                <FormDescription>
                                  This will make the coping strategy available to all your clients
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditingStrategy(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={updateStrategyMutation.isPending}>
                          {updateStrategyMutation.isPending ? "Updating..." : "Update Strategy"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* My Coping Strategies */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">My Coping Strategies</CardTitle>
                <CardDescription>Strategies you've personally identified or created</CardDescription>
              </CardHeader>
              <CardContent>
                {personalStrategies?.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No personal coping strategies yet</h3>
                    <p className="text-neutral-500 max-w-md mx-auto mb-6">
                      Add your personal coping strategies to build a toolkit for managing difficult situations.
                    </p>
                    <Button onClick={() => setIsAddingStrategy(true)}>Add Your First Coping Strategy</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {personalStrategies?.map((strategy: any) => (
                      <Card key={strategy.id} className="overflow-hidden border border-neutral-200 hover:shadow-md transition-shadow">
                        <CardHeader className="bg-neutral-50 p-4 pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-medium">{strategy.name}</CardTitle>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditStrategy(strategy)}>
                                <Edit className="h-4 w-4 text-neutral-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive/90"
                                onClick={() => {
                                  setSelectedStrategy(strategy);
                                  setIsDeleteStrategyDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <p className="text-sm text-neutral-600">{strategy.description || "No description provided."}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Global Coping Strategies */}
            {globalStrategies?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shared Coping Strategies</CardTitle>
                  <CardDescription>
                    {user?.role === "therapist" ? "Strategies shared by other therapists" : "Strategies shared by your therapist"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {globalStrategies.map((strategy: any) => (
                      <Card key={strategy.id} className="overflow-hidden border border-neutral-200 hover:shadow-md transition-shadow">
                        <CardHeader className="bg-neutral-50 p-4 pb-3">
                          <CardTitle className="text-base font-medium">{strategy.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <p className="text-sm text-neutral-600">{strategy.description || "No description provided."}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delete Coping Strategy Dialog */}
            <Dialog open={isDeleteStrategyDialogOpen} onOpenChange={setIsDeleteStrategyDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Coping Strategy</DialogTitle>
                  <div className="pt-2 text-sm text-muted-foreground">
                    Are you sure you want to delete this coping strategy? This action cannot be undone.
                  </div>
                </DialogHeader>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDeleteStrategyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (selectedStrategy) {
                        deleteStrategyMutation.mutate(selectedStrategy.id);
                        setIsDeleteStrategyDialogOpen(false);
                      }
                    }}
                    disabled={deleteStrategyMutation.isPending}
                  >
                    {deleteStrategyMutation.isPending ? "Deleting..." : "Delete Strategy"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Resource Confirmation Dialog */}
            <Dialog open={isDeleteResourceDialogOpen} onOpenChange={setIsDeleteResourceDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Educational Resource</DialogTitle>
                  <div className="pt-2 text-sm text-muted-foreground">
                    Are you sure you want to delete this educational resource? This action cannot be undone.
                  </div>
                </DialogHeader>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDeleteResourceDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (currentResource) {
                        deleteResourceMutation.mutate(currentResource.id);
                        setIsDeleteResourceDialogOpen(false);
                      }
                    }}
                    disabled={deleteResourceMutation.isPending}
                  >
                    {deleteResourceMutation.isPending ? "Deleting..." : "Delete Resource"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Educational Resources Tab */}
          <TabsContent value="educational-resources">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-800">Educational Resources</h1>
                <p className="text-neutral-500">
                  Materials to help you learn about mental health concepts and techniques
                </p>
              </div>

              {(user?.role === "admin" || user?.role === "therapist") && (
                <Button onClick={() => setIsAddingResource(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              )}
            </div>

            {/* Resource Category Tabs */}
            <Tabs defaultValue="all" className="mb-6">
              <TabsList className="mb-6 flex flex-wrap h-auto p-1">
                <TabsTrigger key="all" value="all" onClick={() => setResourceCategory("all")} className="capitalize">
                  All Categories
                </TabsTrigger>

                {educationalResources &&
                  Array.from(new Set(educationalResources.map((r: any) => r.category)))
                    .filter((cat: any) => cat && cat !== "all")
                    .map((category: any) => (
                      <TabsTrigger key={category} value={category} onClick={() => setResourceCategory(category)}>
                        {category}
                      </TabsTrigger>
                    ))}

                {defaultCategories
                  .filter(
                    (cat: string) =>
                      cat !== "all" &&
                      (!educationalResources || !educationalResources.some((r: any) => r.category === cat))
                  )
                  .map((category: string) => (
                    <TabsTrigger key={category} value={category} onClick={() => setResourceCategory(category)}>
                      {category}
                    </TabsTrigger>
                  ))}
              </TabsList>
            </Tabs>

            {/* Resource Cards Grid */}
            {resourcesLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {educationalResources
                  ?.filter((resource: any) => resourceCategory === "all" || resource.category === resourceCategory)
                  .map((resource: any) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      user={user}
                      onView={(r) => setCurrentResource({ ...r, isEditing: false })}
                      onEdit={(r) => setCurrentResource({ ...r, isEditing: true })}
                      onDelete={(r) => {
                        setCurrentResource(r);
                        setIsDeleteResourceDialogOpen(true);
                      }}
                      onAssign={(r) => {
                        setCurrentResource(r);
                        setIsAssigningResource(true);
                      }}
                    />
                  ))}
              </div>
            )}

            {/* Resource Viewing Dialog */}
            <ResourceViewer
              resource={currentResource && !currentResource.isEditing ? currentResource : null}
              user={user}
              open={!!currentResource && !currentResource.isEditing}
              onClose={() => setCurrentResource(null)}
              onEdit={() => currentResource && setCurrentResource({ ...currentResource, isEditing: true })}
              onDelete={() => currentResource && deleteResourceMutation.mutate(currentResource.id)}
              onClone={() => {
                if (currentResource) {
                  cloneResourceMutation.mutate(currentResource.id);
                  setCurrentResource(null);
                }
              }}
              isDeleting={deleteResourceMutation.isPending}
              isCloning={cloneResourceMutation.isPending}
            />

            {/* Resource Edit / Add Dialogs */}
            <CreatorPanel
              mode="edit"
              open={!!currentResource && !!currentResource.isEditing}
              onOpenChange={(open) => {
                if (!open && currentResource) setCurrentResource({ ...currentResource, isEditing: false });
              }}
              resource={currentResource ?? undefined}
              onResourceChange={setCurrentResource}
              educationalResources={educationalResources ?? []}
              onSubmitCreate={handleSubmitCreate}
              onSubmitEdit={handleSubmitEdit}
              isPending={updateResourceMutation.isPending}
            />

            <CreatorPanel
              mode="create"
              open={isAddingResource}
              onOpenChange={setIsAddingResource}
              educationalResources={educationalResources ?? []}
              onSubmitCreate={handleSubmitCreate}
              onSubmitEdit={handleSubmitEdit}
              isPending={createResourceMutation.isPending}
            />

            {/* Client Assignment Dialog */}
            <FeedbackDialog
              open={isAssigningResource}
              onOpenChange={(open) => {
                if (!open) {
                  setIsAssigningResource(false);
                  setSelectedClients([]);
                  setAssignmentNotes("");
                }
              }}
              clients={clients ?? []}
              clientsLoading={clientsLoading}
              selectedClients={selectedClients}
              onClientsChange={setSelectedClients}
              assignmentNotes={assignmentNotes}
              onNotesChange={setAssignmentNotes}
              onAssign={() => {
                if (currentResource) {
                  assignResourceMutation.mutate({
                    resourceId: currentResource.id,
                    clientIds: selectedClients,
                    notes: assignmentNotes,
                  });
                }
              }}
              isPending={assignResourceMutation.isPending}
              currentResource={currentResource}
            />
          </TabsContent>

          {/* Client Assignments Tab (for therapists) */}
          {user?.role === "therapist" && (
            <TabsContent value="client-assignments">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-800">Client Assignments</h1>
                  <p className="text-neutral-500">View and manage resources assigned to your clients</p>
                </div>
              </div>

              {assignmentsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : clientAssignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientAssignments.map((assignment: any) => (
                    <Card key={assignment.id} className="overflow-hidden">
                      <CardHeader className="bg-neutral-50 p-4 pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{assignment.resource.title}</CardTitle>
                            <CardDescription>
                              Assigned to:{" "}
                              {(assignment.client &&
                                (assignment.client.name || assignment.client.username)) ||
                                "Client information unavailable"}
                            </CardDescription>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {assignment.status}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-3">
                        <p className="text-sm text-neutral-600 line-clamp-2">
                          {assignment.resource.description}
                        </p>
                        {assignment.notes && (
                          <div className="mt-3 p-2 bg-neutral-50 rounded-md border text-sm">
                            <p className="font-medium text-xs text-neutral-500 mb-1">Your notes:</p>
                            <p className="text-neutral-700">{assignment.notes}</p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="p-4 pt-2 flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setViewingAssignment(assignment);
                            setIsViewingAssignment(true);
                          }}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border rounded-md bg-neutral-50">
                  <BookOpen className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No assignments yet</h3>
                  <p className="text-neutral-500 mb-4">
                    You haven't assigned any resources to your clients yet.
                  </p>
                  <Button
                    onClick={() => {
                      const tabsList = document.querySelector('button[value="educational-resources"]');
                      if (tabsList) {
                        (tabsList as HTMLButtonElement).click();
                      }
                    }}
                  >
                    Browse Resources
                  </Button>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Assignment Viewing Dialog */}
      <Dialog open={isViewingAssignment} onOpenChange={setIsViewingAssignment}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewingAssignment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Assignment Details</DialogTitle>
                <DialogDescription>View details about this resource assignment</DialogDescription>
              </DialogHeader>

              <div className="my-4 p-4 bg-neutral-50 rounded-md border">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{viewingAssignment.resource.title}</h3>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {viewingAssignment.status}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mb-4">{viewingAssignment.resource.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-1">Assigned To</p>
                    <p className="text-sm font-medium">
                      {(viewingAssignment.client &&
                        (viewingAssignment.client.name || viewingAssignment.client.username)) ||
                        "Client information unavailable"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-1">Assigned On</p>
                    <p className="text-sm">{new Date(viewingAssignment.assignedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {viewingAssignment.notes && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-neutral-500 mb-1">Your Notes</p>
                    <div className="p-3 bg-white rounded border">
                      <p className="text-sm">{viewingAssignment.notes}</p>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-xs font-medium text-neutral-500 mb-1">Resource Category</p>
                  <div className="flex">
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                      {viewingAssignment.resource.category}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs font-medium text-neutral-500 mb-2">Resource Content</p>
                  <div className="bg-white border rounded-md p-4 max-h-[40vh] overflow-y-auto">
                    {viewingAssignment.resource.type === "article" ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(viewingAssignment.resource.content),
                        }}
                      />
                    ) : viewingAssignment.resource.type === "pdf" && viewingAssignment.resource.fileUrl ? (
                      <div className="text-center">
                        <a
                          href={viewingAssignment.resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <FileText className="h-5 w-5 mr-2" />
                          Open PDF in new tab
                        </a>
                      </div>
                    ) : (
                      <p className="text-neutral-500 italic">No preview available</p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-between">
                <div>
                  <Button variant="outline" onClick={() => setIsViewingAssignment(false)}>
                    Close
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      try {
                        await apiRequest("DELETE", `/api/resource-assignments/${viewingAssignment.id}`, null);
                        queryClient.invalidateQueries({ queryKey: ["/api/therapist/assignments"] });
                        setIsViewingAssignment(false);
                        toast({ title: "Assignment Deleted", description: "The resource assignment has been removed." });
                      } catch (error) {
                        console.error("Error deleting assignment:", error);
                        toast({ title: "Error", description: "Failed to delete assignment. Please try again.", variant: "destructive" });
                      }
                    }}
                  >
                    Delete Assignment
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
