import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add custom headers instead of using Helmet
app.use((req, res, next) => {
  // Set basic security headers manually
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Set Permissions-Policy (formerly Feature-Policy) to help with SmartScreen
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Set a very relaxed Content-Security-Policy that SmartScreen won't block
  // This is less secure but better than being blocked entirely
  res.setHeader('Content-Security-Policy', 
    "default-src * data: blob: 'unsafe-inline' 'unsafe-eval';" +
    "script-src * data: blob: 'unsafe-inline' 'unsafe-eval';" + 
    "style-src * data: blob: 'unsafe-inline';" +
    "img-src * data: blob:;" +
    "font-src * data: blob:;" +
    "connect-src * data: blob: ws: wss:;"
  );
  
  // Add trust indicators
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
