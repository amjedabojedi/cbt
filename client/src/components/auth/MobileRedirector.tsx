import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * A component that detects mobile devices and redirects them to the mobile-friendly login page
 * This helps prevent users from seeing the Replit login page on mobile
 */
export function MobileRedirector() {
  const [location, navigate] = useLocation();
  
  useEffect(() => {
    // More comprehensive mobile detection
    const detectMobile = () => {
      // Check user agent for mobile devices
      const userAgentCheck = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Check screen width as fallback (most mobile devices are under 768px wide)
      const screenWidthCheck = window.innerWidth < 768;
      
      // Check for touch capability as additional signal
      const touchCheck = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // If at least two checks are true, consider it a mobile device
      let mobileSignals = 0;
      if (userAgentCheck) mobileSignals++;
      if (screenWidthCheck) mobileSignals++;
      if (touchCheck) mobileSignals++;
      
      return mobileSignals >= 2;
    };
    
    const isMobile = detectMobile();
    const isAuthPage = location === '/auth';
    const isAlreadyOnMobileLogin = location === '/m/login';
    
    // Store the detected device type in localStorage for other components to use
    localStorage.setItem('isMobileDevice', isMobile ? 'true' : 'false');
    
    // If this is a mobile device and we're on the auth page, redirect to mobile login
    if (isMobile && isAuthPage && !isAlreadyOnMobileLogin) {
      console.log('Mobile device detected, redirecting to mobile login page');
      navigate('/m/login');
    }
    
    // Add a resize listener to handle orientation changes or window resizing
    const handleResize = () => {
      const newIsMobile = detectMobile();
      localStorage.setItem('isMobileDevice', newIsMobile ? 'true' : 'false');
      
      if (newIsMobile && location === '/auth' && !isAlreadyOnMobileLogin) {
        navigate('/m/login');
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [location, navigate]);
  
  // This component doesn't render anything
  return null;
}