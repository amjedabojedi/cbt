import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  Brain,
  Heart,
  Flag,
  BookmarkCheck,
  Share2,
  UserCheck,
  FileText,
  BookOpen,
  Star,
  MessageCircle
} from "lucide-react";

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
  const [isViewingResource, setIsViewingResource] = useState(false);
  const [resourceCategory, setResourceCategory] = useState<string>("all");
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
  
  // Resource categories (default list)
  const defaultCategories = [
    "all",
    "cbt-basics",
    "anxiety", 
    "depression",
    "stress-management",
    "mindfulness",
    "emotional-regulation",
    "relationships",
    "trauma",
    "self-care"
  ];
  
  // Forms for adding new items
  const factorForm = useForm<ProtectiveFactorFormValues>({
    resolver: zodResolver(protectiveFactorSchema),
    defaultValues: {
      name: "",
      description: "",
      isGlobal: false,
    },
  });
  
  const strategyForm = useForm<CopingStrategyFormValues>({
    resolver: zodResolver(copingStrategySchema),
    defaultValues: {
      name: "",
      description: "",
      isGlobal: false,
    },
  });
  
  // Forms for editing existing items
  const editFactorForm = useForm<ProtectiveFactorFormValues>({
    resolver: zodResolver(protectiveFactorSchema),
    defaultValues: {
      name: "",
      description: "",
      isGlobal: false,
    },
  });
  
  const editStrategyForm = useForm<CopingStrategyFormValues>({
    resolver: zodResolver(copingStrategySchema),
    defaultValues: {
      name: "",
      description: "",
      isGlobal: false,
    },
  });
  
  // Fetch protective factors
  const { 
    data: protectiveFactors, 
    isLoading: factorsLoading, 
    error: factorsError 
  } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/protective-factors`] : [],
    enabled: !!user,
  });
  
  // Fetch coping strategies
  const { 
    data: copingStrategies, 
    isLoading: strategiesLoading, 
    error: strategiesError 
  } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/coping-strategies`] : [],
    enabled: !!user,
  });
  
  // Fetch educational resources
  const {
    data: educationalResources,
    isLoading: resourcesLoading,
    error: resourcesError
  } = useQuery({
    queryKey: ['/api/resources'],
    enabled: !!user,
  });
  
  // Create protective factor mutation
  const createFactorMutation = useMutation({
    mutationFn: async (data: ProtectiveFactorFormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "POST",
        `/api/users/${user.id}/protective-factors`,
        {
          ...data,
          userId: user.id,
        }
      );
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/protective-factors`] });
      setIsAddingFactor(false);
      factorForm.reset();
      toast({
        title: "Protective Factor Added",
        description: "Your protective factor has been added to your library.",
      });
    },
    onError: (error) => {
      console.error("Error creating protective factor:", error);
      toast({
        title: "Error",
        description: "Failed to add protective factor. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Create coping strategy mutation
  const createStrategyMutation = useMutation({
    mutationFn: async (data: CopingStrategyFormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "POST",
        `/api/users/${user.id}/coping-strategies`,
        {
          ...data,
          userId: user.id,
        }
      );
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/coping-strategies`] });
      setIsAddingStrategy(false);
      strategyForm.reset();
      toast({
        title: "Coping Strategy Added",
        description: "Your coping strategy has been added to your library.",
      });
    },
    onError: (error) => {
      console.error("Error creating coping strategy:", error);
      toast({
        title: "Error",
        description: "Failed to add coping strategy. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Delete protective factor mutation
  const deleteFactorMutation = useMutation({
    mutationFn: async (factorId: number) => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "DELETE",
        `/api/users/${user.id}/protective-factors/${factorId}`,
        null
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete protective factor");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/protective-factors`] });
      setSelectedFactor(null);
      setIsDeleteFactorDialogOpen(false);
      toast({
        title: "Protective Factor Deleted",
        description: "The protective factor has been removed from your library.",
      });
    },
    onError: (error) => {
      console.error("Error deleting protective factor:", error);
      toast({
        title: "Error",
        description: "Failed to delete protective factor. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Delete coping strategy mutation
  const deleteStrategyMutation = useMutation({
    mutationFn: async (strategyId: number) => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "DELETE",
        `/api/users/${user.id}/coping-strategies/${strategyId}`,
        null
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete coping strategy");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/coping-strategies`] });
      setSelectedStrategy(null);
      setIsDeleteStrategyDialogOpen(false);
      toast({
        title: "Coping Strategy Deleted",
        description: "The coping strategy has been removed from your library.",
      });
    },
    onError: (error) => {
      console.error("Error deleting coping strategy:", error);
      toast({
        title: "Error",
        description: "Failed to delete coping strategy. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update protective factor mutation
  const updateFactorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProtectiveFactorFormValues }) => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "PUT",
        `/api/users/${user.id}/protective-factors/${id}`,
        data
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update protective factor");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/protective-factors`] });
      setIsEditingFactor(false);
      setSelectedFactor(null);
      toast({
        title: "Protective Factor Updated",
        description: "Your protective factor has been updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating protective factor:", error);
      toast({
        title: "Error",
        description: "Failed to update protective factor. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Update coping strategy mutation
  const updateStrategyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CopingStrategyFormValues }) => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "PUT",
        `/api/users/${user.id}/coping-strategies/${id}`,
        data
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update coping strategy");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/coping-strategies`] });
      setIsEditingStrategy(false);
      setSelectedStrategy(null);
      toast({
        title: "Coping Strategy Updated",
        description: "Your coping strategy has been updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating coping strategy:", error);
      toast({
        title: "Error",
        description: "Failed to update coping strategy. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: any) => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "POST",
        "/api/resources",
        resourceData
      );
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      setIsAddingResource(false);
      toast({
        title: "Resource Added",
        description: "Your educational resource has been added to the library.",
      });
    },
    onError: (error) => {
      console.error("Error creating resource:", error);
      toast({
        title: "Error",
        description: "Failed to add educational resource. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "DELETE",
        `/api/resources/${resourceId}`,
        null
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete resource");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      setCurrentResource(null);
      toast({
        title: "Resource Deleted",
        description: "The educational resource has been removed from the library.",
      });
    },
    onError: (error) => {
      console.error("Error deleting resource:", error);
      toast({
        title: "Error",
        description: "Failed to delete resource. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "PATCH",
        `/api/resources/${id}`,
        data
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update resource");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      if (currentResource) {
        setCurrentResource({...currentResource, isEditing: false});
      }
      toast({
        title: "Resource Updated",
        description: "The educational resource has been updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating resource:", error);
      toast({
        title: "Error",
        description: "Failed to update resource. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Clone resource mutation (for therapists)
  const cloneResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "POST",
        `/api/resources/${resourceId}/clone`,
        null
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to clone resource");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      toast({
        title: "Resource Cloned",
        description: "You can now customize this resource before assigning it to clients.",
      });
    },
    onError: (error) => {
      console.error("Error cloning resource:", error);
      toast({
        title: "Error",
        description: "Failed to clone resource. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Assign resource to client mutation
  const assignResourceMutation = useMutation({
    mutationFn: async (data: { resourceId: number, assignedTo: number, notes?: string, isPriority?: boolean }) => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await apiRequest(
        "POST",
        "/api/resource-assignments",
        data
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign resource");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Resource Assigned",
        description: "The resource has been assigned to the client.",
      });
    },
    onError: (error) => {
      console.error("Error assigning resource:", error);
      toast({
        title: "Error",
        description: "Failed to assign resource. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Fetch client assignments (for therapists)
  const {
    data: clientAssignments,
    isLoading: assignmentsLoading,
  } = useQuery({
    queryKey: ['/api/therapist/assignments'],
    enabled: !!user && user.role === 'therapist',
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
  
  // Handle edit resource actions
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
  
  // Filter functions for personal and global items
  const personalFactors = protectiveFactors?.filter(
    (factor) => !factor.isGlobal || factor.userId === user?.id
  );
  
  const globalFactors = protectiveFactors?.filter(
    (factor) => factor.isGlobal && factor.userId !== user?.id
  );
  
  const personalStrategies = copingStrategies?.filter(
    (strategy) => !strategy.isGlobal || strategy.userId === user?.id
  );
  
  const globalStrategies = copingStrategies?.filter(
    (strategy) => strategy.isGlobal && strategy.userId !== user?.id
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
                <DialogContent>
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
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
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
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddingFactor(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createFactorMutation.isPending}
                        >
                          {createFactorMutation.isPending ? "Adding..." : "Add Factor"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Edit Protective Factor Dialog */}
              <Dialog open={isEditingFactor} onOpenChange={setIsEditingFactor}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Protective Factor</DialogTitle>
                    <DialogDescription>
                      Update your protective factor details
                    </DialogDescription>
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
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
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
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditingFactor(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={updateFactorMutation.isPending}
                        >
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
                <CardDescription>
                  Factors you've personally identified or created
                </CardDescription>
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
                    <Button onClick={() => setIsAddingFactor(true)}>
                      Add Your First Protective Factor
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {personalFactors?.map((factor) => (
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
                    {globalFactors.map((factor) => (
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
                  <DialogDescription>
                    Are you sure you want to delete this protective factor? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDeleteFactorDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (selectedFactor) {
                        deleteFactorMutation.mutate(selectedFactor.id);
                      }
                    }}
                    disabled={deleteFactorMutation.isPending}
                  >
                    {deleteFactorMutation.isPending ? "Deleting..." : "Delete Factor"}
                  </Button>
                </DialogFooter>
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
                <DialogContent>
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
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
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
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddingStrategy(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createStrategyMutation.isPending}
                        >
                          {createStrategyMutation.isPending ? "Adding..." : "Add Strategy"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Edit Coping Strategy Dialog */}
              <Dialog open={isEditingStrategy} onOpenChange={setIsEditingStrategy}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Coping Strategy</DialogTitle>
                    <DialogDescription>
                      Update your coping strategy details
                    </DialogDescription>
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
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
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
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditingStrategy(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={updateStrategyMutation.isPending}
                        >
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
                <CardDescription>
                  Strategies you've personally identified or created
                </CardDescription>
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
                    <Button onClick={() => setIsAddingStrategy(true)}>
                      Add Your First Coping Strategy
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {personalStrategies?.map((strategy) => (
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
                    {globalStrategies.map((strategy) => (
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
            
            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteStrategyDialogOpen} onOpenChange={setIsDeleteStrategyDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Coping Strategy</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this coping strategy? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDeleteStrategyDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (selectedStrategy) {
                        deleteStrategyMutation.mutate(selectedStrategy.id);
                      }
                    }}
                    disabled={deleteStrategyMutation.isPending}
                  >
                    {deleteStrategyMutation.isPending ? "Deleting..." : "Delete Strategy"}
                  </Button>
                </DialogFooter>
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
                {/* Default 'all' category tab */}
                <TabsTrigger 
                  key="all" 
                  value="all"
                  onClick={() => setResourceCategory('all')}
                  className="capitalize"
                >
                  All Categories
                </TabsTrigger>
                
                {/* Dynamic tabs from resources */}
                {educationalResources && [...new Set(educationalResources.map((r: any) => r.category))]
                  .filter((cat: string) => cat && cat !== 'all')
                  .map((category: string) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      onClick={() => setResourceCategory(category)}
                      className="capitalize"
                    >
                      {category.split('-').join(' ')}
                    </TabsTrigger>
                  ))
                }
                
                {/* Hard-coded default categories */}
                {defaultCategories
                  .filter((cat: string) => 
                    cat !== 'all' && 
                    (!educationalResources || !educationalResources.some((r: any) => r.category === cat))
                  )
                  .map((category: string) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      onClick={() => setResourceCategory(category)}
                      className="capitalize"
                    >
                      {category.split('-').join(' ')}
                    </TabsTrigger>
                  ))
                }
              </TabsList>
            </Tabs>
            
            {/* Resource Cards Grid */}
            {resourcesLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {educationalResources?.filter(resource => 
                  resourceCategory === "all" || resource.category === resourceCategory
                ).map((resource) => (
                  <Card key={resource.id} className="overflow-hidden flex flex-col h-full transition-shadow hover:shadow-md">
                    <CardHeader className="bg-neutral-50 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-medium">{resource.title}</CardTitle>
                        {resource.createdBy === user?.id && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setCurrentResource({...resource, isEditing: true})}
                          >
                            <Edit className="h-4 w-4 text-neutral-500" />
                          </Button>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                          {resource.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 flex-grow">
                      <p className="text-sm text-neutral-600">{resource.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentResource({...resource, isEditing: false})}
                      >
                        View Resource
                      </Button>
                      {user?.role === "therapist" && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => {
                            // Show dialog to assign to client
                            setCurrentResource(resource);
                            // Logic for client assignment will be added
                          }}
                        >
                          <UserCheck className="mr-1 h-4 w-4" />
                          Assign to Client
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Resource Viewing Dialog */}
            {currentResource && !currentResource.isEditing && (
              <Dialog open={!!currentResource} onOpenChange={(open) => !open && setCurrentResource(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{currentResource.title}</DialogTitle>
                    <DialogDescription>
                      <div className="flex space-x-2 mt-1">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {currentResource.type.charAt(0).toUpperCase() + currentResource.type.slice(1)}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                          {currentResource.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Description</h3>
                      <p className="text-neutral-700">{currentResource.description}</p>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-2">Content</h3>
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currentResource.content }} />
                    </div>
                    
                    {currentResource.pdfUrl && (
                      <div className="border-t pt-4">
                        <h3 className="text-lg font-medium mb-2">Attached PDF</h3>
                        <Button asChild>
                          <a href={currentResource.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-2 h-4 w-4" />
                            View PDF
                          </a>
                        </Button>
                      </div>
                    )}
                    
                    {currentResource.tags && currentResource.tags.length > 0 && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {currentResource.tags.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter className="border-t mt-6 pt-4 flex justify-between">
                    {currentResource.createdBy === user?.id && (
                      <>
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            deleteResourceMutation.mutate(currentResource.id);
                          }}
                          disabled={deleteResourceMutation.isPending}
                        >
                          {deleteResourceMutation.isPending ? "Deleting..." : "Delete Resource"}
                        </Button>
                        <Button 
                          onClick={() => setCurrentResource({...currentResource, isEditing: true})}
                        >
                          Edit Resource
                        </Button>
                      </>
                    )}
                    
                    {user?.role === "therapist" && currentResource.createdBy !== user?.id && (
                      <Button 
                        onClick={() => {
                          cloneResourceMutation.mutate(currentResource.id);
                          setCurrentResource(null);
                        }}
                        disabled={cloneResourceMutation.isPending}
                      >
                        {cloneResourceMutation.isPending ? "Cloning..." : "Clone to My Resources"}
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            
            {/* Resource Edit Dialog */}
            {currentResource && currentResource.isEditing && (
              <Dialog open={!!currentResource} onOpenChange={(open) => !open && setCurrentResource(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Resource</DialogTitle>
                    <DialogDescription>
                      Update this educational resource
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
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
                    }} 
                    className="space-y-4 mt-4"
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Title
                          </label>
                          <Input 
                            value={currentResource.title} 
                            onChange={(e) => setCurrentResource({...currentResource, title: e.target.value})}
                            placeholder="Enter title"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Category
                          </label>
                          <div className="relative">
                            <Input 
                              value={currentResource.category}
                              onChange={(e) => {
                                const value = e.target.value.trim();
                                if (value) {
                                  setCurrentResource({...currentResource, category: value.toLowerCase().replace(/\s+/g, '-')});
                                }
                              }}
                              placeholder="Enter your custom category name"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Type the name of your custom category (it will be automatically formatted)
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Description
                        </label>
                        <Textarea 
                          value={currentResource.description} 
                          onChange={(e) => setCurrentResource({...currentResource, description: e.target.value})}
                          placeholder="Enter a brief description"
                          rows={2}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Content
                        </label>
                        <Textarea 
                          value={currentResource.content} 
                          onChange={(e) => setCurrentResource({...currentResource, content: e.target.value})}
                          placeholder="Enter the main content (supports HTML for formatting)"
                          rows={8}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Resource Type
                          </label>
                          <select 
                            value={currentResource.type}
                            onChange={(e) => setCurrentResource({...currentResource, type: e.target.value})}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="article">Article</option>
                            <option value="worksheet">Worksheet</option>
                            <option value="guide">Guide</option>
                            <option value="exercise">Exercise</option>
                            <option value="video">Video</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            PDF URL (Optional)
                          </label>
                          <Input 
                            value={currentResource.pdfUrl || ''} 
                            onChange={(e) => setCurrentResource({...currentResource, pdfUrl: e.target.value})}
                            placeholder="https://example.com/document.pdf"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Tags (comma-separated)
                        </label>
                        <Input 
                          value={(currentResource.tags || []).join(', ')} 
                          onChange={(e) => {
                            const tagsString = e.target.value;
                            const tags = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
                            setCurrentResource({...currentResource, tags});
                          }}
                          placeholder="anxiety, relaxation, mindfulness"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="published" 
                          checked={currentResource.isPublished} 
                          onCheckedChange={(checked) => 
                            setCurrentResource({...currentResource, isPublished: !!checked})
                          }
                        />
                        <label
                          htmlFor="published"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Published (visible to others)
                        </label>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setCurrentResource({...currentResource, isEditing: false})}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={updateResourceMutation.isPending}
                      >
                        {updateResourceMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            
            {/* Add Resource Dialog */}
            <Dialog open={isAddingResource} onOpenChange={setIsAddingResource}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Educational Resource</DialogTitle>
                  <DialogDescription>
                    Create a new resource to share knowledge with clients
                  </DialogDescription>
                </DialogHeader>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    
                    // Check if dropdown category is being used or custom category
                    const dropdownCategory = formData.get('category') as string;
                    const customCategory = formData.get('custom-category') as string;
                    
                    // Use dropdown if selected, otherwise use custom category if provided, or default to 'other'
                    let categoryToUse = 'other';
                    
                    if (dropdownCategory && dropdownCategory.trim()) {
                      categoryToUse = dropdownCategory.trim();
                    } else if (customCategory && customCategory.trim()) {
                      categoryToUse = customCategory.trim().toLowerCase().replace(/\s+/g, '-');
                    }
                    
                    const data = {
                      title: formData.get('title') as string,
                      description: formData.get('description') as string,
                      content: formData.get('content') as string,
                      type: formData.get('type') as string,
                      category: categoryToUse,
                      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()) : [],
                      isPublished: formData.get('published') === 'on',
                      pdfUrl: formData.get('pdfUrl') as string || undefined,
                      createdBy: user?.id,
                    };
                    
                    createResourceMutation.mutate(data);
                  }} 
                  className="space-y-4 mt-4"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Title
                        </label>
                        <Input 
                          id="title"
                          name="title"
                          placeholder="Enter title"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="category" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Category
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          <select 
                            id="category"
                            name="category"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">-- Select a Category --</option>
                            {educationalResources && [...new Set(educationalResources.map((r: any) => r.category))]
                              .filter((cat: string) => cat && cat !== 'all')
                              .map((category: string) => (
                                <option key={category} value={category}>{category}</option>
                              ))
                            }
                          </select>
                          
                          <div className="relative">
                            <Input 
                              id="custom-category"
                              name="custom-category"
                              placeholder="Or enter a new category name"
                              defaultValue=""
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Select an existing category or create a new one (will be automatically formatted)
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Description
                      </label>
                      <Textarea 
                        id="description"
                        name="description"
                        placeholder="Enter a brief description"
                        rows={2}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="content" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Content
                      </label>
                      <Textarea 
                        id="content"
                        name="content"
                        placeholder="Enter the main content (supports HTML for formatting)"
                        rows={8}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Resource Type
                        </label>
                        <select 
                          id="type"
                          name="type"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          <option value="article">Article</option>
                          <option value="worksheet">Worksheet</option>
                          <option value="guide">Guide</option>
                          <option value="exercise">Exercise</option>
                          <option value="video">Video</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="pdfUrl" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          PDF URL (Optional)
                        </label>
                        <Input 
                          id="pdfUrl"
                          name="pdfUrl"
                          placeholder="https://example.com/document.pdf"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="tags" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Tags (comma-separated)
                      </label>
                      <Input 
                        id="tags"
                        name="tags"
                        placeholder="anxiety, relaxation, mindfulness"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="published"
                        name="published"
                        defaultChecked={true}
                      />
                      <label
                        htmlFor="published"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Published (visible to others)
                      </label>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddingResource(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createResourceMutation.isPending}
                    >
                      {createResourceMutation.isPending ? "Creating..." : "Create Resource"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}