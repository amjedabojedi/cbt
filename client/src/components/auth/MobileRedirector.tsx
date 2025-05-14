import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * A component that detects mobile devices and redirects them to the mobile-friendly login page
 * when they try to access the regular auth page, but allows access to the landing page.
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
    const isLoginPage = location === '/login';
    const isRegisterPage = location === '/register';
    const isAlreadyOnMobileLogin = location === '/m/login' || location === '/mobile-login';
    const isLandingPage = location === '/' || location === '/landing';
    
    // Store the detected device type in localStorage for other components to use
    localStorage.setItem('isMobileDevice', isMobile ? 'true' : 'false');
    
    // ONLY redirect if we're on the auth, login or register page - NOT the landing page
    // This ensures mobile users can see the landing page before logging in
    if (isMobile && (isAuthPage || isLoginPage || isRegisterPage) && !isAlreadyOnMobileLogin) {
      console.log('Mobile device detected on auth page, redirecting to mobile login page');
      navigate('/m/login');
    }
    
    // Add a resize listener to handle orientation changes or window resizing
    const handleResize = () => {
      const newIsMobile = detectMobile();
      localStorage.setItem('isMobileDevice', newIsMobile ? 'true' : 'false');
      
      // Only redirect if on auth/login/register - not on landing page
      if (newIsMobile && (isAuthPage || isLoginPage || isRegisterPage) && !isAlreadyOnMobileLogin) {
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