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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
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
  role: z.string().default("therapist"), // Default to therapist as clients need invitations
  therapistId: z.number().optional(),
  status: z.string().optional(),
  isInvitation: z.boolean().optional(),
  invitationToken: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, login, register: registerUser } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  // Enhanced mobile parameter parsing - check multiple sources
  const fullUrl = window.location.href;
  const searchString = window.location.search || (fullUrl.includes('?') ? fullUrl.split('?')[1] : '');
  const searchParams = new URLSearchParams(searchString);
  
  // Mobile browsers sometimes strip parameters - check hash and referrer too
  const hashParams = window.location.hash.includes('?') ? 
    new URLSearchParams(window.location.hash.split('?')[1]) : new URLSearchParams();
  
  const invitationParam = searchParams.get("invitation") || hashParams.get("invitation");
  const emailParam = searchParams.get("email") || hashParams.get("email");
  const therapistIdParam = searchParams.get("therapistId") || hashParams.get("therapistId");
  const tokenParam = searchParams.get("token") || hashParams.get("token");
  
  // Store invitation data if URL parameters are present (before they get lost)
  useEffect(() => {
    // Enhanced mobile detection - check for invitation parameters in multiple ways
    const hasInvitationParams = (invitationParam === "true" && emailParam && therapistIdParam) ||
                               (emailParam && therapistIdParam); // Sometimes mobile strips the invitation=true param
    
    if (hasInvitationParams) {
      const invitationData = {
        email: emailParam,
        therapistId: therapistIdParam,
        token: tokenParam,
        timestamp: Date.now()
      };
      localStorage.setItem('pending_invitation', JSON.stringify(invitationData));
      console.log('Mobile invitation data stored:', { email: invitationData.email, therapistId: invitationData.therapistId });
      
      // Force mobile users to signup tab if they have invitation parameters
      setActiveTab("register");
    }
  }, [invitationParam, emailParam, therapistIdParam, tokenParam]);

  // Get invitation data from URL params or localStorage
  const storedInvitationData = localStorage.getItem('pending_invitation');
  let invitationData = null;
  if (storedInvitationData) {
    try {
      invitationData = JSON.parse(storedInvitationData);
      // Clear old data (older than 1 hour)
      if (Date.now() - (invitationData.timestamp || 0) > 3600000) {
        localStorage.removeItem('pending_invitation');
        invitationData = null;
      }
    } catch (e) {
      localStorage.removeItem('pending_invitation');
    }
  }
  
  const isInvitation = invitationParam === "true" || !!emailParam || !!invitationData;
  const finalEmail = emailParam || invitationData?.email || "";
  const finalTherapistId = therapistIdParam ? parseInt(therapistIdParam) : invitationData?.therapistId || undefined;
  const finalToken = tokenParam || invitationData?.token || undefined;
  const [activeTab, setActiveTab] = useState(isInvitation ? "register" : "login");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  
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
      email: finalEmail,
      password: "",
      name: "",
      role: isInvitation ? "client" : "therapist", // Default to therapist for direct registration, client for invitations
      therapistId: finalTherapistId,
      status: isInvitation ? "active" : undefined,
      isInvitation: isInvitation || false,
    },
  });
  
  // Check for invitation parameter and set registration tab active
  useEffect(() => {
    // If invitation parameter is present, set up for client registration
    if (isInvitation) {
      setActiveTab("register");
      
      // Display invitation toast
      toast({
        title: "Client Invitation",
        description: "A mental health professional has invited you to create an account. Please register to access your therapy tools.",
      });
    }
    
    // Note: We no longer redirect away from the register tab for non-invitation users
    // This allows professionals to register directly
  }, [invitationParam, toast]);
  
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
      
      // If this is coming from an invitation, explicitly set status to active, isInvitation flag, and token
      if (isInvitation) {
        console.log("Registering from invitation - setting status to active and isInvitation flag");
        registrationData.status = "active";
        registrationData.isInvitation = true;
        if (finalToken) {
          registrationData.invitationToken = finalToken;
        }
      }
      
      const result = await registerUser(registrationData);
      
      // Clear stored invitation data after successful registration
      if (isInvitation) {
        localStorage.removeItem('pending_invitation');
      }
      
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
  
  const inputClass = "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-400 transition-all disabled:bg-slate-50 disabled:text-slate-400";

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: Brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[460px] xl:w-[500px] shrink-0 flex-col bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-teal-600/20 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col justify-between h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z"/>
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none tracking-wide">ResilienceHub</p>
              <p className="text-teal-300/70 text-[10px] font-semibold tracking-widest uppercase mt-0.5">
                {isInvitation ? "Client Portal" : "Clinical Suite"}
              </p>
            </div>
          </div>

          {/* Main message */}
          <div>
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-snug mb-4">
              {isInvitation
                ? "Your therapist has invited you"
                : "Evidence-based CBT, built for practice"}
            </h2>
            <p className="text-teal-100/75 text-base leading-relaxed mb-10">
              {isInvitation
                ? "Create your account to access personalized CBT tools and stay connected with your mental health professional."
                : "ResilienceHub gives therapists and clients a shared workspace for emotion tracking, thought records, journaling, and goal setting."}
            </p>

            <div className="space-y-5">
              {[
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    </svg>
                  ),
                  title: "Emotion Tracking",
                  desc: "Interactive emotion wheel with 4-step reflection wizard.",
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z"/>
                      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z"/>
                    </svg>
                  ),
                  title: "Cognitive Restructuring",
                  desc: "Thought records with 12 ANT categories and reframe coaching.",
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                  ),
                  title: "AI-Assisted Journaling",
                  desc: "Smart emotion detection and personalised progress insights.",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-teal-200 shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm leading-tight">{title}</p>
                    <p className="text-teal-200/65 text-xs mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-teal-300/40 text-xs">
            © {new Date().getFullYear()} ResilienceHub · Evidence-Based CBT Platform
          </p>
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-6 py-5 bg-teal-800 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z"/>
            </svg>
          </div>
          <span className="text-white font-bold text-base tracking-wide">ResilienceHub</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">

            {/* Back link */}
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-teal-700 mb-8 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
              </svg>
              Back to home
            </Link>

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {isInvitation ? "Complete your registration" : activeTab === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isInvitation
                  ? "Your therapist has sent you an invitation — fill in the details below."
                  : activeTab === "login"
                    ? "Sign in to access your ResilienceHub workspace."
                    : "Join ResilienceHub to access evidence-based CBT tools."}
              </p>
            </div>

            {/* Tab switcher */}
            {!isInvitation && (
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
                {[
                  { key: "login", label: "Log In" },
                  { key: "register", label: "Professional Registration" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      activeTab === key
                        ? "bg-white text-teal-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Invitation notice */}
            {isInvitation && (
              <div className="mb-6 flex items-start gap-3 p-3.5 bg-teal-50 border border-teal-100 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-700 mt-0.5 shrink-0">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <p className="text-xs text-teal-800 leading-relaxed">
                  You were invited by your mental health professional. Your email is pre-filled — just set a username and password.
                </p>
              </div>
            )}

            {/* Non-invitation info note */}
            {!isInvitation && activeTab === "register" && (
              <div className="mb-5 flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mt-0.5 shrink-0">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>
                  <line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
                </svg>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Client accounts require an invitation from a professional. This form registers <strong>mental health professionals</strong> only.
                </p>
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {(activeTab === "login" && !isInvitation) && (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Username or Email</FormLabel>
                        <FormControl>
                          <input className={inputClass} placeholder="johndoe or john@example.com" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium text-slate-700">Password</FormLabel>
                          <Link href="/forgot-password" className="text-xs text-teal-700 hover:text-teal-800 font-medium transition-colors">
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <input type="password" className={inputClass} placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={loginSubmitting}
                    className="w-full h-11 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm border-0 transition-all mt-2"
                  >
                    {loginSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
                    ) : "Sign In"}
                  </Button>
                  <p className="text-center text-xs text-slate-400 pt-1">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => setActiveTab("register")} className="text-teal-700 font-semibold hover:underline">
                      Register as a professional
                    </button>
                  </p>
                </form>
              </Form>
            )}

            {/* ── REGISTER FORM ── */}
            {(activeTab === "register" || isInvitation) && (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Full Name</FormLabel>
                        <FormControl>
                          <input className={inputClass} placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Username</FormLabel>
                        <FormControl>
                          <input className={inputClass} placeholder="johndoe" {...field} />
                        </FormControl>
                        <p className="text-xs text-slate-400">Used to log in to your account</p>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Email</FormLabel>
                        <FormControl>
                          <input
                            type="email"
                            className={inputClass}
                            placeholder="john.doe@example.com"
                            disabled={isInvitation}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Password</FormLabel>
                        <FormControl>
                          <input type="password" className={inputClass} placeholder="••••••••" {...field} />
                        </FormControl>
                        <p className="text-xs text-slate-400">At least 6 characters</p>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />
                  {!isInvitation && (
                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">Account Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:ring-teal-500/30 focus:border-teal-400 text-sm">
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="therapist">Mental Health Professional</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-400">You'll be enrolled in the free trial automatically</p>
                          <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                  )}
                  {isInvitation && <input type="hidden" {...registerForm.register("role")} value="client" />}
                  <Button
                    type="submit"
                    disabled={registerSubmitting}
                    className="w-full h-11 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm border-0 transition-all mt-2"
                  >
                    {registerSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</>
                    ) : "Create Account"}
                  </Button>
                  {!isInvitation && (
                    <p className="text-center text-xs text-slate-400 pt-1">
                      Already have an account?{" "}
                      <button type="button" onClick={() => setActiveTab("login")} className="text-teal-700 font-semibold hover:underline">
                        Sign in
                      </button>
                    </p>
                  )}
                </form>
              </Form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}