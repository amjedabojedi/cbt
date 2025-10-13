import { useEffect } from "react";
import { useLocation } from "wouter";
import { usePostHog } from "posthog-js/react";

export default function PostHogPageTracker() {
  const [location] = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog) {
      posthog.capture("$pageview", {
        $current_url: window.location.href,
        path: location
      });
    }
  }, [location, posthog]);

  return null;
}
