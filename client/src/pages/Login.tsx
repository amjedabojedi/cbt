import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ConnectionErrorFallback from "@/components/error/ConnectionErrorFallback";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Reset any previous errors
      setLoginError(null);
      
      // Use apiRequest from queryClient which handles headers and credentials
      // Our enhanced apiRequest now properly handles error responses
      const response = await apiRequest("POST", "/api/auth/login", { 
        username, 
        password 
      });
      
      // Get the user data
      const userData = await response.json();
      console.log("Login successful, user data:", userData);
      
      // Reload the page to refresh authentication state
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      
      // Save the error for displaying a more detailed error UI
      setLoginError(error instanceof Error ? error : new Error("Failed to log in"));
      
      // Show a more helpful error message if credentials are invalid
      if (error instanceof Error && 
          (error.message.includes('Invalid credentials') || 
           error.message.includes('401'))) {
        toast({
          title: "Invalid Credentials",
          description: "The username or password you entered is incorrect. Please check your credentials and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Error",
          description: error instanceof Error ? error.message : "Failed to log in. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
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
        <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Log In</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
          <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded-md">
            <span className="font-semibold">Admin Account:</span> username: admin, password: 123456<br/>
            <span className="font-semibold">Therapist:</span> username: lcanady, password: 123456
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">Username or Email</label>
              <Input 
                id="username" 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="johndoe or john@example.com"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can log in with either your username or email address
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
