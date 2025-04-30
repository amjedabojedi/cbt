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
  StarIcon,
  Edit,
  Trash2,
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
    onError: (error) => {
      console.error("Error creating coping strategy:", error);
      toast({
        title: "Error",
        description: "Failed to add coping strategy. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submissions
  const onSubmitFactor = (data: ProtectiveFactorFormValues) => {
    createFactorMutation.mutate(data);
  };
  
  const onSubmitStrategy = (data: CopingStrategyFormValues) => {
    createStrategyMutation.mutate(data);
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
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4 text-neutral-500" />
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
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4 text-neutral-500" />
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
        </Tabs>
      </div>
    </AppLayout>
  );
}
