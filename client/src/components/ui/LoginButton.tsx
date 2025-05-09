import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface LoginButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function LoginButton({ className = "", variant = "default", size = "default" }: LoginButtonProps) {
  const handleLogin = () => {
    // Use direct browser navigation instead of client-side routing
    window.location.href = "/login";
  };

  return (
    <Button 
      onClick={handleLogin} 
      className={`gap-2 ${className}`}
      variant={variant}
      size={size}
    >
      Login <ArrowRight size={18} />
    </Button>
  );
}