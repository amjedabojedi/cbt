import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function EmergencyLoginPage() {
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Set up hardcoded login for testing
  const handleTherapistLogin = async () => {
    setLoading(true);
    try {
      // This is a direct login bypass for testing only
      const userData = {
        id: 20,
        username: "lcanady",
        email: "lcanady@resiliencec.com",
        name: "Linda Canady",
        role: "therapist",
        createdAt: new Date(),
      };
      
      // Store user data in localStorage for persistence
      localStorage.setItem('auth_user_backup', JSON.stringify(userData));
      localStorage.setItem('auth_timestamp', new Date().toISOString());
      
      // Set local flag to indicate we're using emergency bypass
      localStorage.setItem('emergency_login', 'true');
      
      toast({
        title: "Login successful",
        description: "You are now logged in as a therapist",
      });
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
        window.location.reload(); // Force reload to apply auth state
      }, 300);
    } catch (error) {
      console.error("Emergency login error:", error);
      toast({
        title: "Login failed",
        description: "Could not complete the emergency login process",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Emergency Access</CardTitle>
          <CardDescription className="text-center">
            This page provides direct access for testing and demonstrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center mb-6">
            <p className="text-muted-foreground mb-6">
              Use this page to bypass the database connection issues and test the application.
            </p>
            <Button 
              className="w-full" 
              onClick={handleTherapistLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login as Therapist"
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            This is for testing purposes only and bypasses normal authentication
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}