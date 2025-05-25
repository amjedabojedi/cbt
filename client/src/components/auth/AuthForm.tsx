import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Define the form validation schema for login
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Define the form validation schema for registration
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["client", "therapist"]),
  therapistId: z.number().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface AuthFormProps {
  mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const { login, register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Check if this is an invitation registration
  const urlParams = new URLSearchParams(window.location.search);
  const isInvitation = urlParams.get('invitation') === 'true';
  const invitationEmail = urlParams.get('email');
  const therapistId = urlParams.get('therapistId');

  // Use the appropriate schema based on the mode
  const schema = mode === "login" ? loginSchema : registerSchema;
  
  // Initialize the form with react-hook-form
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: mode === "login" 
      ? { username: "", password: "" } 
      : { 
          username: "", 
          email: invitationEmail || "", 
          password: "", 
          name: "", 
          role: isInvitation ? "client" : "client",
          therapistId: therapistId ? parseInt(therapistId) : undefined
        },
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormValues | RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await login((data as LoginFormValues).username, (data as LoginFormValues).password);
      } else {
        await register(data as RegisterFormValues);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: (error as Error).message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === "login" 
            ? "Log In" 
            : isInvitation 
              ? "Complete Your Registration" 
              : "Create Account"}
        </CardTitle>
        <CardDescription>
          {mode === "login" 
            ? "Enter your credentials to access your account" 
            : isInvitation
              ? "You've been invited to join as a client. Please complete your registration below."
              : "Fill out the form below to create your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {mode === "register" && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john.doe@example.com" 
                          {...field} 
                          disabled={isInvitation}
                          className={isInvitation ? "bg-muted" : ""}
                        />
                      </FormControl>
                      {isInvitation && (
                        <FormDescription>
                          This email is from your invitation link
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
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
                
                {!isInvitation && (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="therapist">Therapist</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose your role in the system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}
            
            <FormField
              control={form.control}
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
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                  {mode === "login" ? "Logging in..." : "Creating account..."}
                </div>
              ) : (
                <>{mode === "login" ? "Log In" : "Create Account"}</>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        {mode === "login" ? (
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
