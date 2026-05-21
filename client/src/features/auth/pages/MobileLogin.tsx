import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Create a schema for the login form validation
const loginSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function MobileLogin() {
  const { login, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Detect if the user is on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    if (user) {
      navigate("/dashboard");
    }
    
    return () => clearTimeout(timer);
  }, [user, navigate]);

  // Handle form submission - using the mobile-specific login endpoint
  async function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    try {
      console.log("Attempting mobile login for user:", data.username);
      // Pass true as the third parameter to use the mobile-specific endpoint
      await login(data.username, data.password, true);
      
      // Login is handled by the auth hook which will redirect on success
      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
    } catch (error) {
      console.error("Mobile login error:", error);
      
      // More user-friendly error message
      let errorMessage = "An error occurred. Please try again.";
      
      if ((error as Error).message) {
        // Extract the most useful part of the error message
        const message = (error as Error).message;
        
        if (message.includes("401") || message.includes("unauthorized") || message.includes("invalid credentials")) {
          errorMessage = "Your username or password is incorrect. Please try again.";
        } else if (message.includes("network") || message.includes("fetch")) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (message.includes("timeout")) {
          errorMessage = "The request timed out. Please try again.";
        } else if (message.includes("cookie")) {
          errorMessage = "Cookie error. Please try clearing your browser cookies and try again.";
        } else {
          // Use the original message but limit its length
          errorMessage = message.length > 100 ? message.substring(0, 100) + "..." : message;
        }
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-white to-blue-50">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">ResilienceHub</h1>
          <p className="text-lg text-neutral-700">
            Mobile-Friendly Login
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> View Landing Page
            </Link>
          </Button>
        </div>

        {/* Mobile-optimized explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            Welcome to ResilienceHub - your personal CBT interactive tool for tracking emotional wellbeing and personal development.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Username or Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your username or email" 
                        autoComplete="username"
                        className="h-11 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your password" 
                        autoComplete="current-password"
                        className="h-11 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium mt-2" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-neutral-600">
            Having trouble signing in? Try to:
          </p>
          <ul className="text-sm text-neutral-600 mt-2 space-y-1">
            <li>• Check that your username and password are correct</li>
            <li>• Clear your browser cookies and try again</li>
            <li>• Use a different browser if possible</li>
          </ul>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-neutral-600">
            Don't have an account?{" "}
            <Button 
              variant="link" 
              className="p-0 font-medium" 
              onClick={() => navigate("/auth")}
            >
              Register here
            </Button>
          </p>
        </div>
        
        {/* Return to main option */}
        <div className="text-center mt-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            Return to home page
          </Button>
        </div>
        
        {/* Support info */}
        <div className="text-center mt-6">
          <p className="text-xs text-neutral-500">
            ResilienceHub - A tool for tracking progress with CBT techniques<br />
            Need help? Contact support at<br />
            <a href="mailto:mail@resiliencec.com" className="text-primary">
              mail@resiliencec.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}