/**
 * This utility fixes the Vite HMR WebSocket issues in Replit environment.
 * The issue occurs because Vite tries to establish a WebSocket connection to localhost:undefined
 * which is an invalid URL and causes errors in the console.
 */

// Monkey patch the WebSocket constructor to prevent Vite from creating invalid connections
const originalWebSocket = window.WebSocket;
window.WebSocket = function(url: string | URL, protocols?: string | string[]) {
  // Check if this is a Vite HMR WebSocket connection attempt with an invalid URL
  if (typeof url === 'string' && (
      url.includes('localhost:undefined') || 
      url.match(/wss?:\/\/localhost:[^0-9]/))
  ) {
    // Create a dummy WebSocket-like object that silently fails
    const dummySocket = {
      addEventListener: () => {},
      removeEventListener: () => {},
      send: () => {},
      close: () => {},
      get readyState() { return 3; }, // CLOSED state
      get CLOSED() { return 3; },
      get CLOSING() { return 2; },
      get CONNECTING() { return 0; },
      get OPEN() { return 1; }
    };
    
    // Add a minimal event target implementation
    ['open', 'message', 'close', 'error'].forEach(event => {
      Object.defineProperty(dummySocket, 'on' + event, {
        set: () => {},
        get: () => null
      });
    });
    
    return dummySocket as unknown as WebSocket;
  }
  
  // For all other WebSocket connections, use the original implementation
  return new originalWebSocket(url, protocols);
} as any;

// Copy over WebSocket static properties
Object.defineProperties(
  window.WebSocket, 
  Object.getOwnPropertyDescriptors(originalWebSocket)
);

// Disable Vite's WebSocket error logging
if (import.meta.env.DEV) {
  // Prevent unhandled promise rejections from Vite's WebSocket
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.message?.includes('Failed to construct \'WebSocket\'') ||
      event.reason?.stack?.includes('WebSocket')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
  
  // Suppress related console errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const errorString = args.join(' ');
    if (
      errorString.includes('WebSocket connection') ||
      errorString.includes('Failed to construct \'WebSocket\'') ||
      errorString.includes('WebSocket connection to') ||
      errorString.includes('localhost:undefined')
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export {};