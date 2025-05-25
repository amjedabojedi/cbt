import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * A component that detects mobile devices and redirects them to the mobile-friendly login page
 * when they try to access the regular auth page, but allows access to the landing page.
 */
export function MobileRedirector() {
  const [location, navigate] = useLocation();
  
  useEffect(() => {
    // Check if this is the first visit to the landing page
    const isFirstLandingVisit = sessionStorage.getItem('landing_page_first') === 'true';
    
    // If this is the landing page or initial visit, don't redirect
    if (location === '/' || location === '/landing' || isFirstLandingVisit) {
      // Still detect mobile for other components to use, but don't redirect
      handleMobileDetection(false); // false = don't redirect
      
      // Clear the first visit flag if we're not on the landing page anymore
      if (location !== '/' && location !== '/landing' && isFirstLandingVisit) {
        sessionStorage.removeItem('landing_page_first');
      }
      return;
    }
    
    // Check for user preference to skip mobile redirection (for testing)
    if (localStorage.getItem('disable_mobile_redirect') === 'true') {
      console.log('Mobile redirection disabled by user preference');
      return;
    }
    
    // Handle the mobile detection and redirection logic
    handleMobileDetection(true); // true = can redirect if needed
    
    // Add a resize listener to handle orientation changes or window resizing
    window.addEventListener('resize', () => handleMobileDetection(true));
    
    return () => {
      window.removeEventListener('resize', () => handleMobileDetection(true));
    };
  }, [location, navigate]);
  
  // Extracted function to handle mobile detection logic
  const handleMobileDetection = (canRedirect: boolean) => {
    // More gentle mobile detection (require 2 out of 3 signals)
    const userAgentCheck = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const screenWidthCheck = window.innerWidth < 768;
    const touchCheck = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    let mobileSignals = 0;
    if (userAgentCheck) mobileSignals++;
    if (screenWidthCheck) mobileSignals++;
    if (touchCheck) mobileSignals++;
    
    const isMobile = mobileSignals >= 2;
    
    // Store the detected device type in localStorage for other components to use
    localStorage.setItem('isMobileDevice', isMobile ? 'true' : 'false');
    
    // If we can't redirect (e.g., on landing page), just store the detection result and exit
    if (!canRedirect) return;
    
    // Define which pages to check for redirection
    const isAuthPage = location === '/auth';
    const isLoginPage = location === '/login';
    const isRegisterPage = location === '/register';
    const isAlreadyOnMobileLogin = location === '/m/login' || location === '/mobile-login';
    const isLandingPage = location === '/' || location === '/landing';
    
    // Check if current URL has invitation parameters
    const hasInvitationParams = window.location.search.includes('invitation=') || 
                               window.location.search.includes('email=') || 
                               window.location.search.includes('therapistId=');
    
    // Only redirect if:
    // 1. This is a mobile device
    // 2. User is on auth/login/register page
    // 3. User is not already on mobile login page
    // 4. User is not on landing page
    // 5. NO invitation parameters present (preserve invitation flow)
    if (isMobile && 
        (isAuthPage || isLoginPage || isRegisterPage) && 
        !isAlreadyOnMobileLogin && 
        !isLandingPage &&
        !hasInvitationParams) {
      console.log('Mobile device detected on auth page, redirecting to mobile login page');
      navigate('/m/login');
    }
  };
  
  // This component doesn't render anything
  return null;
}