import express, { type Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { verifyOrigin } from "./middleware/csrf";
import { registerIntegrationRoutes } from "./services/integrationRoutes";
import { registerReframeCoachRoutes } from "./services/reframeCoach";
import indexRouter from "./routes/index";

/**
 * Register all backend API and web-socket entrypoint routes.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Parse cookies with signed secret
  const cookieSecret = process.env.COOKIE_SECRET || 'resilience-hub-cookie-secret';
  
  app.use(cookieParser(cookieSecret));

  // SECURITY: CSRF defense via Origin / Referer verification on all
  // state-changing requests (POST/PUT/PATCH/DELETE). Safe methods pass through.
  app.use("/api", verifyOrigin);

  // Register cross-component integration routes
  registerIntegrationRoutes(app);

  // Register Reframe Coach routes
  registerReframeCoachRoutes(app);

  // Mount the new modular, domain-driven API routes
  app.use("/api", indexRouter);

  // Add route for Microsoft identity verification
  app.get("/.well-known/microsoft-identity-association.json", (req, res) => {
    res.json({
      associatedApplications: [
        {
          applicationId: "ResilienceHub",
        },
      ],
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
