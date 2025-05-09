import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      // Use direct window location for more reliable redirect
      window.location.href = "/dashboard";
    }
  }, [user]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Use apiRequest from queryClient which handles headers and credentials
      const response = await apiRequest("POST", "/api/auth/login", { 
        username, 
        password 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
      
      // Get the user data
      const userData = await response.json();
      console.log("Login successful, user data:", userData);
      
      // Reload the page to refresh authentication state
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: error instanceof Error ? error.message : "Failed to log in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 text-muted-foreground"
            onClick={() => window.location.href = "/"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="m12 19-7-7 7-7"></path>
              <path d="M19 12H5"></path>
            </svg>
            Back to Home
          </Button>
        </div>
        <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Log In</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
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
