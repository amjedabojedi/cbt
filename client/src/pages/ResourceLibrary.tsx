import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { marked } from "marked";
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
  StarIcon,
  Edit,
  Brain,
  Heart,
  Flag,
  BookmarkCheck,
  Share2,
  UserCheck,
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
  const [isAddingFactor, setIsAddingFactor] = useState(false);
  const [isAddingStrategy, setIsAddingStrategy] = useState(false);
  const [selectedFactor, setSelectedFactor] = useState<any>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [isDeleteFactorDialogOpen, setIsDeleteFactorDialogOpen] = useState(false);
  const [isDeleteStrategyDialogOpen, setIsDeleteStrategyDialogOpen] = useState(false);
  const [isEditingFactor, setIsEditingFactor] = useState(false);
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  
  // Educational resource viewing and editing states
  const [isViewingResource, setIsViewingResource] = useState(false);
  const [currentResource, setCurrentResource] = useState<{
    id: string;
    title: string;
    description: string;
    content: string;
    type: string;
    category: string;
    thumbnail: string;
    isEditing: boolean;
  } | null>(null);
  
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
                        <CardContent className="p-4 pt-3">
                          <p className="text-sm text-neutral-600">
                            {factor.description || "No description provided."}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Global Protective Factors */}
            {globalFactors && globalFactors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suggested Protective Factors</CardTitle>
                  <CardDescription>
                    Common protective factors provided by therapists
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {globalFactors?.map((factor) => (
                      <Card key={factor.id} className="overflow-hidden border border-neutral-200 hover:shadow-md transition-shadow">
                        <CardHeader className="bg-neutral-50 p-4 pb-3">
                          <CardTitle className="text-base font-medium">{factor.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-3">
                          <p className="text-sm text-neutral-600">
                            {factor.description || "No description provided."}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
                      Coping strategies are techniques that help you manage stress and difficult emotions
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
                              <Input placeholder="E.g., Deep breathing" {...field} />
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
                              <Input placeholder="E.g., Deep breathing" {...field} />
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
                      Add your personal coping strategies to help manage stress and difficult emotions effectively.
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
                        <CardContent className="p-4 pt-3">
                          <p className="text-sm text-neutral-600">
                            {strategy.description || "No description provided."}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Global Coping Strategies */}
            {globalStrategies && globalStrategies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suggested Coping Strategies</CardTitle>
                  <CardDescription>
                    Common coping strategies provided by therapists
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {globalStrategies?.map((strategy) => (
                      <Card key={strategy.id} className="overflow-hidden border border-neutral-200 hover:shadow-md transition-shadow">
                        <CardHeader className="bg-neutral-50 p-4 pb-3">
                          <CardTitle className="text-base font-medium">{strategy.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-3">
                          <p className="text-sm text-neutral-600">
                            {strategy.description || "No description provided."}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Educational Resources Tab */}
          <TabsContent value="educational-resources">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-800">Educational Resources</h1>
                <p className="text-neutral-500">
                  Articles, guides and worksheets to help with CBT techniques
                </p>
              </div>
              
              {user?.role === "admin" && (
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Cognitive Distortions Guide */}
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="p-0">
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 py-6 px-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                      <Brain className="h-6 w-6 text-amber-600" />
                    </div>
                    <CardTitle className="text-lg mb-1">Cognitive Distortions Guide</CardTitle>
                    <CardDescription className="text-amber-700">
                      Learn to identify common thinking traps
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-neutral-600 mb-4">
                    This comprehensive guide explains the most common cognitive distortions
                    and provides examples of how to challenge and reframe them.
                  </p>
                  <div className="flex items-center text-sm text-neutral-500 mb-2">
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    7-page PDF
                  </div>
                  <div className="flex items-center text-sm text-neutral-500 mb-4">
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                    Most popular resource
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  <Button variant="outline">View Resource</Button>
                  {user?.role === "therapist" && (
                    <Button variant="ghost" size="sm">
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                      </svg>
                      Assign to Client
                    </Button>
                  )}
                </CardFooter>
              </Card>
              
              {/* Emotion Wheel Guide */}
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="p-0">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 py-6 px-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                      <Heart className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg mb-1">Emotion Wheel Guide</CardTitle>
                    <CardDescription className="text-purple-700">
                      Expand your emotional vocabulary
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-neutral-600 mb-4">
                    Learn to identify and name your emotions more precisely with this
                    detailed emotion wheel guide and emotional awareness exercises.
                  </p>
                  <div className="flex items-center text-sm text-neutral-500 mb-2">
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    4-page Guide + Wheel Diagram
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  <Button variant="outline">View Resource</Button>
                  {user?.role === "therapist" && (
                    <Button variant="ghost" size="sm">
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                      </svg>
                      Assign to Client
                    </Button>
                  )}
                </CardFooter>
              </Card>
              
              {/* SMART Goals Worksheet */}
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="p-0">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 py-6 px-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                      <Flag className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-lg mb-1">SMART Goals Worksheet</CardTitle>
                    <CardDescription className="text-green-700">
                      Create effective, achievable goals
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-neutral-600 mb-4">
                    Learn how to set Specific, Measurable, Achievable, Relevant, and Time-bound goals
                    to increase your chances of success and maintain motivation.
                  </p>
                  <div className="flex items-center text-sm text-neutral-500 mb-2">
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    3-page Worksheet
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setCurrentResource({
                        id: "cognitive-distortions",
                        title: "Cognitive Distortions Guide",
                        description: "Learn to identify common thinking traps",
                        content: `
# Cognitive Distortions Guide

Cognitive distortions are patterns of thinking that are false or inaccurate, and have the potential to cause psychological damage. These patterns of thought tend to reinforce negative thinking or emotions, making us feel bad about ourselves or the world around us.

## Common Cognitive Distortions

### 1. All-or-Nothing Thinking
Seeing things in black-and-white categories. If a situation falls short of perfect, you see it as a total failure.

**Example:** "If I don't get an A on this test, I'm a complete failure."
**Reframe:** "Getting a B doesn't make me a failure. I did well on many parts of the test."

### 2. Overgeneralization
Taking one negative situation and seeing it as a never-ending pattern of defeat.

**Example:** "I didn't get called back after that job interview. I'll never find a job."
**Reframe:** "Not getting this job doesn't mean I won't get the next one. Each interview is different."

### 3. Mental Filter
Focusing exclusively on the negative aspects of a situation while filtering out all the positive ones.

**Example:** "I received feedback on my presentation with 5 compliments and 1 suggestion for improvement, but all I can think about is that one suggestion."
**Reframe:** "I received mostly positive feedback and one helpful suggestion that can make my next presentation even better."

### 4. Jumping to Conclusions
Making negative interpretations even though there are no definite facts to support the conclusion.

**Example:** "My friend hasn't texted me back in two hours. She must be mad at me."
**Reframe:** "There are many reasons why she might not have responded yet. She could be busy or her phone might be off."

### 5. Catastrophizing
Expecting disaster. You exaggerate the importance of a negative event.

**Example:** "If I make a mistake during my presentation, it will be catastrophic and my career will be ruined."
**Reframe:** "If I make a mistake, I'll correct it and move on. Most people are understanding of minor errors."

## How to Challenge Cognitive Distortions

1. **Identify the thought** - What exactly am I thinking right now?
2. **Identify the distortion** - Which cognitive distortion does this thought exemplify?
3. **Challenge the thought** - What evidence supports or contradicts this thought?
4. **Reframe the thought** - What's a more balanced and realistic way to view the situation?

Regular practice in identifying and challenging these distortions can lead to more balanced thinking and improved emotional well-being.
                        `,
                        type: "guide",
                        category: "cognitive",
                        thumbnail: "brain",
                        isEditing: false
                      });
                      setIsViewingResource(true);
                    }}
                  >
                    View Resource
                  </Button>
                  {user?.role === "therapist" && (
                    <Button variant="ghost" size="sm">
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952a4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                      </svg>
                      Assign to Client
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
            
            {/* Connect with Therapist / Support Section */}
            <div className="mt-10 border-t pt-8">
              <div className="bg-blue-50 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="md:flex-1">
                    <h3 className="text-xl font-semibold text-blue-800 mb-2">Need additional support?</h3>
                    <p className="text-blue-700 mb-4">
                      We're here to help you understand and apply these resources. Connect with a therapist for personalized guidance or join a community discussion.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user?.role === "client" && (
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                          </svg>
                          Message Therapist
                        </Button>
                      )}
                      
                      <Button variant={user?.role === "client" ? "outline" : "default"} className={user?.role !== "client" ? "bg-blue-600 hover:bg-blue-700" : ""}>
                        <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                        </svg>
                        Join Community Discussion
                      </Button>
                      
                      <Button variant="outline">
                        <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                        </svg>
                        Browse Resource Guides
                      </Button>
                    </div>
                  </div>
                  
                  <div className="hidden md:block border-l border-blue-200 h-24"></div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm md:w-72">
                    <h4 className="font-medium text-blue-800 mb-2">Weekly Support Group</h4>
                    <p className="text-sm text-blue-600 mb-3">
                      Join our therapist-led group sessions to discuss these resources with others.
                    </p>
                    <div className="flex items-center text-sm text-blue-800">
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      Thursdays, 7:00 PM
                    </div>
                    <Button size="sm" className="w-full mt-3 bg-blue-600 hover:bg-blue-700">
                      Register
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Client Assignments Tab (Only for therapists) */}
          {user?.role === "therapist" && (
            <TabsContent value="client-assignments">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-800">Client Resource Assignments</h1>
                  <p className="text-neutral-500">
                    Manage resources assigned to your clients
                  </p>
                </div>
                
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Assignment
                </Button>
              </div>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Assignment Dashboard</CardTitle>
                  <CardDescription>
                    Track assignment status and client engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-neutral-50 border-b">
                          <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500">Client</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500">Resource</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500">Assigned Date</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="px-4 py-3 text-sm">Alex Johnson</td>
                          <td className="px-4 py-3 text-sm">Cognitive Distortions Guide</td>
                          <td className="px-4 py-3 text-sm">May 1, 2025</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              Completed
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button variant="ghost" size="sm">View Details</Button>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-3 text-sm">Jamie Smith</td>
                          <td className="px-4 py-3 text-sm">Thought Record Template</td>
                          <td className="px-4 py-3 text-sm">April 28, 2025</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                              In Progress
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button variant="ghost" size="sm">View Details</Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm">Taylor Garcia</td>
                          <td className="px-4 py-3 text-sm">Emotion Wheel Guide</td>
                          <td className="px-4 py-3 text-sm">April 30, 2025</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              Assigned
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button variant="ghost" size="sm">View Details</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resource Usage Stats</CardTitle>
                    <CardDescription>
                      Most assigned and completed resources
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-500 mb-2">Most Assigned Resources</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Cognitive Distortions Guide</span>
                            <span className="text-sm font-medium">7 clients</span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: "70%" }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm">Thought Record Template</span>
                            <span className="text-sm font-medium">5 clients</span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: "50%" }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm">Emotion Wheel Guide</span>
                            <span className="text-sm font-medium">4 clients</span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: "40%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Client Engagement</CardTitle>
                    <CardDescription>
                      Client activity with assigned resources
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-500 mb-2">Most Engaged Clients</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Alex Johnson</span>
                            <span className="text-sm font-medium">95% completion</span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-2.5">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: "95%" }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm">Jamie Smith</span>
                            <span className="text-sm font-medium">65% completion</span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-2.5">
                            <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: "65%" }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm">Taylor Garcia</span>
                            <span className="text-sm font-medium">30% completion</span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-2.5">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: "30%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
        {/* Delete Protective Factor Confirmation Dialog */}
        <Dialog open={isDeleteFactorDialogOpen} onOpenChange={setIsDeleteFactorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Protective Factor</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this protective factor? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 p-4 border rounded bg-neutral-50">
              <h4 className="font-medium">{selectedFactor?.name}</h4>
              <p className="text-sm text-neutral-600 mt-1">
                {selectedFactor?.description || "No description provided."}
              </p>
            </div>
            <DialogFooter className="mt-4">
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
                    setIsDeleteFactorDialogOpen(false);
                  }
                }}
                disabled={deleteFactorMutation.isPending}
              >
                {deleteFactorMutation.isPending ? "Deleting..." : "Delete Factor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Coping Strategy Confirmation Dialog */}
        <Dialog open={isDeleteStrategyDialogOpen} onOpenChange={setIsDeleteStrategyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Coping Strategy</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this coping strategy? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 p-4 border rounded bg-neutral-50">
              <h4 className="font-medium">{selectedStrategy?.name}</h4>
              <p className="text-sm text-neutral-600 mt-1">
                {selectedStrategy?.description || "No description provided."}
              </p>
            </div>
            <DialogFooter className="mt-4">
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
                    setIsDeleteStrategyDialogOpen(false);
                  }
                }}
                disabled={deleteStrategyMutation.isPending}
              >
                {deleteStrategyMutation.isPending ? "Deleting..." : "Delete Strategy"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Educational Resource Viewing Dialog */}
        <Dialog open={isViewingResource} onOpenChange={setIsViewingResource}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentResource?.title}</DialogTitle>
              <DialogDescription>{currentResource?.description}</DialogDescription>
            </DialogHeader>
            
            {currentResource?.isEditing ? (
              <div className="mt-6">
                <Textarea 
                  className="min-h-[60vh] font-mono text-sm"
                  value={currentResource.content}
                  onChange={(e) => setCurrentResource({
                    ...currentResource,
                    content: e.target.value
                  })}
                />
              </div>
            ) : (
              <div className="mt-4 prose prose-stone dark:prose-invert max-w-none">
                {currentResource?.content && (
                  <div dangerouslySetInnerHTML={{ 
                    __html: marked.parse(currentResource.content) 
                  }} />
                )}
              </div>
            )}
            
            <DialogFooter className="flex justify-between mt-6">
              <div>
                {(user?.role === "admin" || user?.role === "therapist") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentResource) {
                        setCurrentResource({
                          ...currentResource,
                          isEditing: !currentResource.isEditing
                        });
                      }
                    }}
                  >
                    {currentResource?.isEditing ? "Preview" : "Edit"}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {currentResource?.isEditing && (
                  <Button 
                    variant="default"
                    onClick={() => {
                      if (currentResource) {
                        // Here would go API call to save changes
                        toast({
                          title: "Resource Updated",
                          description: "Your changes have been saved successfully.",
                        });
                        setCurrentResource({
                          ...currentResource,
                          isEditing: false
                        });
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                )}
                <Button 
                  variant="secondary"
                  onClick={() => setIsViewingResource(false)}
                >
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
