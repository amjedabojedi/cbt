import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design that detects if a media query matches
 * @param query - CSS media query string to check
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with a default value to avoid hydration mismatch
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Create a media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set the initial value based on the media query match
    setMatches(mediaQuery.matches);
    
    // Create a handler function to update state when the match changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add the listener for changes
    mediaQuery.addEventListener('change', handler);
    
    // Clean up the listener when the component unmounts
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]); // Only re-run if the query changes
  
  return matches;
}