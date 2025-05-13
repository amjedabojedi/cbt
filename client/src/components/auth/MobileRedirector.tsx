import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * A component that detects mobile devices and redirects them to the mobile-friendly login page
 * This helps prevent users from seeing the Replit login page on mobile
 */
export function MobileRedirector() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Check if this is a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isAuthPage = window.location.pathname === '/auth';
    
    // If this is a mobile device and we're on the auth page, redirect to mobile login
    if (isMobile && isAuthPage) {
      console.log('Mobile device detected, redirecting to mobile login page');
      navigate('/m/login');
    }
  }, [navigate]);
  
  // This component doesn't render anything
  return null;
}