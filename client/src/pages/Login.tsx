import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import AuthForm from "@/components/auth/AuthForm";

export default function Login() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // The AuthForm component already handles the login logic
  return <AuthForm mode="login" />;
}
