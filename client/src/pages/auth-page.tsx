import { useEffect, useState } from "react";
import { useLocation, Route } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

// Schemas for form validation
const loginSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().default("client"),
  therapistId: z.number().optional(),
  status: z.string().optional(),
  isInvitation: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, login, register: registerUser } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isInvitation, setIsInvitation] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  
  const searchParams = new URLSearchParams(window.location.search);
  const invitationParam = searchParams.get("invitation");
  const emailParam = searchParams.get("email");
  const therapistIdParam = searchParams.get("therapistId");
  
  // Initialize forms
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: emailParam || "",
      password: "",
      name: "",
      role: "client",
      therapistId: therapistIdParam ? parseInt(therapistIdParam) : undefined,
      status: isInvitation ? "active" : undefined,
      isInvitation: isInvitation || false,
    },
  });
  
  // Check for invitation parameter and set registration tab active
  useEffect(() => {
    // If there's no invitation parameter and user wants to register, redirect to login
    if (invitationParam !== "true" && activeTab === "register") {
      setActiveTab("login");
      toast({
        title: "Registration Restricted",
        description: "Clients need an invitation from a therapist to register. Please check your email for an invitation link.",
        variant: "destructive"
      });
    }
    
    if (invitationParam === "true") {
      setIsInvitation(true);
      setActiveTab("register");
      
      // Display invitation toast
      toast({
        title: "Therapist Invitation",
        description: "Your therapist has invited you to create an account. Please register to access interactive CBT tools.",
      });
    }
  }, [invitationParam, toast, activeTab]);
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Handle login form submission
  const onLoginSubmit = async (data: LoginFormValues) => {
    setLoginSubmitting(true);
    try {
      await login(data.username, data.password);
      // Login is handled by the auth hook which will redirect on success
    } catch (error) {
      console.error(error);
      toast({
        title: "Login Failed",
        description: (error as Error).message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoginSubmitting(false);
    }
  };
  
  // Handle registration form submission
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setRegisterSubmitting(true);
    try {
      // Include therapistId in registration data if present in URL parameters
      const registrationData = { ...data };
      
      if (therapistIdParam) {
        const therapistId = parseInt(therapistIdParam);
        if (!isNaN(therapistId)) {
          registrationData.therapistId = therapistId;
          console.log("Registering with therapist ID:", therapistId);
        }
      }
      
      // If this is coming from an invitation, explicitly set status to active and isInvitation flag
      if (isInvitation) {
        console.log("Registering from invitation - setting status to active and isInvitation flag");
        registrationData.status = "active";
        registrationData.isInvitation = true;
      }
      
      const result = await registerUser(registrationData);
      
      // Registration is handled by the auth hook which will redirect on success
      if (isInvitation) {
        // If it's an invitation registration, make another API call to update the status to active
        try {
          const response = await fetch(`/api/users/${result.id}/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'active' })
          });
          
          if (response.ok) {
            console.log(`Successfully updated user status to active`);
          }
        } catch (statusError) {
          console.error("Error updating status:", statusError);
        }
        
        toast({
          title: "Registration Complete",
          description: "Your account has been created and connected to your therapist.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Registration Failed",
        description: (error as Error).message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRegisterSubmitting(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Auth Form Column */}
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="flex justify-center w-full mb-4">
              <Button asChild variant="ghost" className="flex items-center gap-2 text-muted-foreground">
                <Link href="/">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="m12 19-7-7 7-7"></path>
                    <path d="M19 12H5"></path>
                  </svg>
                  Back to Home
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-neutral-800">Resilience CBT</h1>
            <p className="text-neutral-500 mt-2">
              {isInvitation 
                ? "Complete your registration to connect with your therapist" 
                : "Your interactive CBT tools for better mental health"}
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            
            <TabsContent value="login" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username or Email</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe or john@example.com" {...field} />
                            </FormControl>
                            <FormDescription>
                              You can log in with either your username or email address
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={loginSubmitting}>
                        {loginSubmitting ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </div>
                        ) : (
                          "Log In"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-muted-foreground">
                    Clients need an invitation from a therapist to register.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isInvitation ? "Complete Your Registration" : "Create Account"}
                  </CardTitle>
                  <CardDescription>
                    {isInvitation 
                      ? "Fill out the form below to finalize your account creation" 
                      : "Join Resilience CBT to access interactive CBT tools"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormDescription>
                              This will be used to log in to your account
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="john.doe@example.com" 
                                {...field} 
                                disabled={isInvitation && !!emailParam}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormDescription>
                              Must be at least 6 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Hidden role field defaults to client */}
                      <input type="hidden" {...registerForm.register("role")} value="client" />
                      
                      <Button type="submit" className="w-full" disabled={registerSubmitting}>
                        {registerSubmitting ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </div>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button variant="link" className="p-0" onClick={() => setActiveTab("login")}>
                      Log in
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Hero Column */}
      <div className="hidden md:flex md:w-1/2 bg-primary/10 p-8 items-center justify-center">
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold text-primary mb-4">
            {isInvitation 
              ? "Welcome to Resilience CBT" 
              : "Advanced Interactive CBT Tools"}
          </h2>
          <p className="text-lg mb-6 text-neutral-700">
            {isInvitation 
              ? "Your therapist has invited you to join Resilience CBT, where you'll have access to personalized interactive CBT tools and resources."
              : "Resilience CBT provides a comprehensive suite of tools for tracking emotions, thoughts, and behaviors designed around evidence-based approaches."}
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
                  <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-primary mb-1">Therapist-Client Connection</h3>
                <p className="text-neutral-600">Share progress and insights with your therapist through secure communication.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-primary mb-1">Advanced Emotion Tracking</h3>
                <p className="text-neutral-600">Identify, record, and understand your emotions with our specialized tools.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-primary mb-1">Personal Progress Insights</h3>
                <p className="text-neutral-600">Track your progress with detailed analytics and visualizations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}