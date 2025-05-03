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
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [currentResource, setCurrentResource] = useState<{
    id: string;
    title: string;
    description: string;
    content: string;
    type: string;
    category: string;
    thumbnail: string;
    isEditing: boolean;
    pdfUrl?: string;
    relatedTopics?: string[];
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
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <Input 
                      value={currentResource.title}
                      onChange={(e) => setCurrentResource({
                        ...currentResource,
                        title: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Input 
                      value={currentResource.category}
                      onChange={(e) => setCurrentResource({
                        ...currentResource,
                        category: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input 
                    value={currentResource.description}
                    onChange={(e) => setCurrentResource({
                      ...currentResource,
                      description: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Related Topics (helps connect to client content)</label>
                  <Input 
                    placeholder="depression, anxiety, stress, etc. (comma separated)"
                    value={currentResource.relatedTopics?.join(", ") || ""}
                    onChange={(e) => setCurrentResource({
                      ...currentResource,
                      relatedTopics: e.target.value.split(",").map(topic => topic.trim())
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <Textarea 
                    className="min-h-[40vh] font-mono text-sm"
                    value={currentResource.content}
                    onChange={(e) => setCurrentResource({
                      ...currentResource,
                      content: e.target.value
                    })}
                  />
                </div>
                
                <div className="border rounded-md p-4">
                  <label className="block text-sm font-medium mb-2">PDF Upload</label>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="file" 
                      accept=".pdf"
                      onChange={(e) => {
                        // In a real implementation this would upload to server
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          toast({
                            title: "File selected",
                            description: `Selected ${file.name} (${Math.round(file.size/1024)}KB)`,
                          });
                        }
                      }}
                    />
                    <Button variant="outline" size="sm">
                      Upload
                    </Button>
                  </div>
                  {currentResource.pdfUrl && (
                    <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      Current PDF: {currentResource.pdfUrl.split('/').pop()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {currentResource?.pdfUrl ? (
                  <div className="mb-4 border rounded-md overflow-hidden">
                    <div className="bg-gray-100 p-3 flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        {currentResource.pdfUrl.split('/').pop()}
                      </div>
                      <a 
                        href={currentResource.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Download PDF
                      </a>
                    </div>
                    <div className="h-[400px] bg-gray-50 flex items-center justify-center">
                      <div className="text-center px-4">
                        <svg className="mx-auto h-10 w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">PDF preview not available. Click "Download PDF" to view.</p>
                      </div>
                    </div>
                  </div>
                ) : null}
                
                <div className="prose prose-stone dark:prose-invert max-w-none">
                  {currentResource?.content && (
                    <div className="whitespace-pre-wrap">
                      {currentResource.content}
                    </div>
                  )}
                </div>
                
                {currentResource?.relatedTopics && currentResource.relatedTopics.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-sm font-semibold mb-2">Related Topics:</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentResource.relatedTopics.map((topic, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
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
                    {currentResource?.isEditing ? "Preview" : "Edit Resource"}
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
        
        {/* Add New Resource Dialog */}
        <Dialog open={isAddingResource} onOpenChange={setIsAddingResource}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add New Educational Resource</DialogTitle>
              <DialogDescription>Create a new resource that will be available in the library.</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input placeholder="Resource title" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="">Select a category</option>
                    <option value="cognitive">Cognitive Techniques</option>
                    <option value="emotional">Emotional Awareness</option>
                    <option value="behavioral">Behavioral Strategies</option>
                    <option value="mindfulness">Mindfulness</option>
                    <option value="goals">Goal Setting</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input placeholder="Brief description of the resource" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Related Topics</label>
                <Input placeholder="depression, anxiety, stress, etc. (comma separated)" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea placeholder="Write content in Markdown format" className="min-h-[200px]" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">PDF Upload (optional)</label>
                <Input type="file" accept=".pdf" />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingResource(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "Resource Created",
                    description: "New educational resource has been added to the library.",
                  });
                  setIsAddingResource(false);
                }}
              >
                Create Resource
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
