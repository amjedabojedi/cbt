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
  
  const resetLoginError = () => {
    setLoginError(null);
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
        
        {/* Display error message when authentication fails */}
        {loginError && (
          <div className="mb-6">
            <ConnectionErrorFallback 
              error={loginError}
              resetError={resetLoginError}
              title="Authentication Error"
              description="There was a problem with your login attempt"
            />
          </div>
        )}
        
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
              />
            </div>
            
            <Alert className="my-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/30">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs">
                <div className="font-semibold">IMPORTANT: Use EXACTLY these credentials:</div>
                <div className="mt-1 p-2 bg-amber-100 dark:bg-amber-900/40 rounded border border-amber-200 dark:border-amber-800/30">
                  <div className="flex items-center justify-between">
                    <div>Admin: username: <span className="font-mono font-bold">admin</span>, password: <span className="font-mono font-bold">123456</span></div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[10px] py-0 px-2 hover:bg-amber-200/50" 
                      onClick={() => {
                        setUsername('admin');
                        setPassword('123456');
                      }}
                    >
                      Auto-fill
                    </Button>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div>Therapist: username: <span className="font-mono font-bold">lcanady</span>, password: <span className="font-mono font-bold">123456</span></div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[10px] py-0 px-2 hover:bg-amber-200/50" 
                      onClick={() => {
                        setUsername('lcanady');
                        setPassword('123456');
                      }}
                    >
                      Auto-fill
                    </Button>
                  </div>
                </div>
                <div className="mt-2 text-[10px]">Note: Make sure password is exactly 6 digits (123456), not 7 digits (1234567)</div>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Log In"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={loading}
                onClick={() => {
                  setUsername('admin');
                  setPassword('123456');
                  
                  // Short delay to ensure state is updated before submitting
                  setTimeout(() => {
                    handleLogin({ preventDefault: () => {} } as React.FormEvent);
                  }, 50);
                }}
              >
                Login as Admin
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
