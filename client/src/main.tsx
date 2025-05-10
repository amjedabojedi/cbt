import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";

// Suppress Vite HMR WebSocket errors
if (import.meta.env.DEV) {
  // Intercept unhandled promise rejections which include Vite's WebSocket connection errors
  window.addEventListener('unhandledrejection', (event) => {
    // Check if this is a Vite HMR WebSocket error (contains 'Failed to construct WebSocket')
    if (event.reason?.stack?.includes('Failed to construct \'WebSocket\'')) {
      // Prevent the error from being logged to the console
      event.preventDefault();
    }
  });
  
  // Suppress Vite's WebSocket connection errors in the console
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Filter out Vite HMR WebSocket connection errors
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('WebSocket connection') || 
       args[0].includes('Failed to construct \'WebSocket\''))
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class">
    <App />
  </ThemeProvider>
);
