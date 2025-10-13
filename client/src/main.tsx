// We now handle WebSocket errors directly in index.html

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

// Initialize PostHog
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || "phc_rwjZUYs5cDOK2dxkP8NvSly1sFX45CnioeuE240BVEx";
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false, // We'll manually track with wouter
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-private]'
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <PostHogProvider client={posthog}>
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <App />
    </ThemeProvider>
  </PostHogProvider>
);
