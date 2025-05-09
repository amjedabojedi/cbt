import { useEffect, useState } from "react";

/**
 * Custom hook for responsive design that detects if a media query matches
 * @param query - CSS media query string to check
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the current match state if window exists (client-side)
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if window is defined (client-side rendering)
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    // Default to false for server-side rendering
    return false;
  });

  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") return;

    // Create media query list
    const mediaQueryList = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQueryList.matches);

    // Define handler for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener for changes
    mediaQueryList.addEventListener("change", handler);
    
    // Clean up event listener on unmount
    return () => {
      mediaQueryList.removeEventListener("change", handler);
    };
  }, [query]); // Re-run if query changes

  return matches;
}