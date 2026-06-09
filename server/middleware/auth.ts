import { Request, Response, NextFunction, CookieOptions } from 'express';
import { storage } from '../storage';
import { User } from '@shared/schema';

// Helper function to create consistent cookie options for all session cookies
// This ensures mobile and cross-device compatibility
export function getSessionCookieOptions(req?: Request): CookieOptions {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = !isDevelopment;
  
  // Define the base cookie settings
  const cookieOptions: CookieOptions = {
    httpOnly: true, // Protect cookie from JS access
    path: "/", // Ensure cookie is available on all paths
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  
  // Try a different approach for Replit environment
  cookieOptions.path = "/";
  
  // For Replit's proxied environment, we need to ensure cookies
  // are accessible across subdomains and HTTPS is required
  cookieOptions.secure = true;
  cookieOptions.sameSite = 'none';
  
  // Make the cookie more persistent with a longer expiration
  cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days instead of 7
  
  // Check if request is from mobile or local testing
  const isMobile = req && (
    req.headers["x-requested-with"] === "ResilienceHub-Mobile" ||
    req.headers["x-app-platform"] === "mobile" ||
    req.get?.("User-Agent")?.includes("Expo")
  );
  
  const host = req ? (req.headers["x-forwarded-host"] as string || req.headers.host || "") : "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("192.168.");
  
  console.log(`[COOKIE_DBG] req exists: ${!!req}`);
  if (req) {
    console.log(`[COOKIE_DBG] headers: ${JSON.stringify(req.headers)}`);
    console.log(`[COOKIE_DBG] host: ${host}`);
  }
  console.log(`[COOKIE_DBG] FORCE_INSECURE_COOKIES: ${process.env.FORCE_INSECURE_COOKIES}`);
  console.log(`[COOKIE_DBG] isMobile: ${isMobile}, isLocalhost: ${isLocalhost}`);

  // Handle special override for different environments
  if (process.env.REPLIT_DOMAINS) {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'none';
    console.log('Using Replit-compatible cookie settings');
  } else if (process.env.FORCE_INSECURE_COOKIES === 'true' || isMobile || isLocalhost) {
    cookieOptions.secure = false;
    cookieOptions.sameSite = 'lax';
    console.log(`Using insecure cookies (secure=false, sameSite=lax) for ${isMobile ? 'mobile' : isLocalhost ? 'local' : 'FORCE_INSECURE_COOKIES'}`);
  }
  
  console.log(`Cookie options: secure=${cookieOptions.secure}, sameSite=${cookieOptions.sameSite}, domain=${cookieOptions.domain || 'not set'}`);
  return cookieOptions;
}

// Simple in-memory cache for session lookups (fixed implementation)
const sessionLookupCache = new Map<string, { user: User; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

// Clean up expired cache entries periodically - disabled to prevent startup crash
// setInterval(() => {
//   const now = Date.now();
//   const keysToDelete: string[] = [];
//   sessionLookupCache.forEach((value, key) => {
//     if (now - value.timestamp > CACHE_TTL) {
//       keysToDelete.push(key);
//     }
//   });
//   keysToDelete.forEach(key => sessionLookupCache.delete(key));
// }, 30000);

// Extend Express Request type to include user information.
// `user` is typed as non-optional because every route that reads `req.user`
// is guarded by the `authenticate` middleware (or one of its derivatives),
// which sets the value before passing control to the handler. The runtime
// `if (!req.user)` checks remain in this file as defence-in-depth.
declare global {
  namespace Express {
    interface Request {
      user: User;
      session?: any;
    }
  }
}

/**
 * Authenticate the user based on their session cookie
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  console.log(`[AUTH] Authenticating request: ${req.method} ${req.originalUrl}`);
  console.log(`[AUTH] Headers: ${JSON.stringify(req.headers)}`);
  console.log(`[AUTH] Cookies in req.cookies: ${JSON.stringify(req.cookies)}`);
  console.log(`[AUTH] Raw Cookie Header: ${req.headers.cookie}`);

  let sessionId = req.cookies?.sessionId;
  
  // Try to parse manually from headers if it's missing from req.cookies
  if (!sessionId && req.headers.cookie) {
    const cookieString = req.headers.cookie;
    // Look for sessionId cookie
    const match = cookieString.match(/(?:^|;)\s*sessionId=([^;]+)/);
    if (match) {
      sessionId = decodeURIComponent(match[1].trim());
      // Handle potential signing prefix s: from cookie-parser
      if (sessionId.startsWith('s:')) {
        const signedMatch = sessionId.match(/^s:([^.]+)/);
        sessionId = signedMatch ? signedMatch[1] : sessionId.slice(2);
      }
      console.log(`[AUTH] Manually parsed sessionId from headers: ${sessionId}`);
    }
  }

  // Try to parse from Authorization header (e.g. Authorization: Bearer <sessionId>)
  if (!sessionId && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      sessionId = authHeader.substring(7).trim();
      console.log(`[AUTH] Parsed sessionId from Authorization Bearer header: ${sessionId}`);
    }
  }
  
  console.log(`[AUTH] Resolved sessionId: ${sessionId}`);
  
  // SECURITY: Only session-based authentication is allowed
  if (!sessionId) {
    console.log(`[AUTH] Authentication failed: No sessionId found`);
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    // PERFORMANCE FIX: Check cache first to avoid repeated database calls
    const cached = sessionLookupCache.get(sessionId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Use cached user data
      req.user = cached.user;
      req.session = {
        id: sessionId,
        userId: cached.user.id,
        expiresAt: new Date(Date.now() + CACHE_TTL)
      };
      return next();
    }

    const session = await storage.getSessionById(sessionId);
    
    if (!session) {
      // Clear the invalid cookie to prevent future issues
      const clearOptions = getSessionCookieOptions(req);
      delete clearOptions.maxAge; // Remove maxAge to ensure cookie gets deleted
      res.clearCookie("sessionId", clearOptions);
      return res.status(401).json({ message: 'Invalid session' });
    }
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await storage.deleteSession(sessionId);
      // Clear the expired cookie with consistent options
      const clearOptions = getSessionCookieOptions(req);
      delete clearOptions.maxAge; // Remove maxAge to ensure cookie gets deleted
      res.clearCookie("sessionId", clearOptions);
      return res.status(401).json({ message: 'Session expired' });
    }
    
    const user = await storage.getUser(session.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // PERFORMANCE FIX: Cache the user data
    sessionLookupCache.set(sessionId, { user, timestamp: Date.now() });
    
    // Attach user and session to the request
    req.user = user;
    req.session = session;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Check if the user is a therapist or admin
 * Note: DB role is 'therapist' and displayed as 'therapist'
 */
export function isTherapist(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'therapist' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Therapist role required.' });
  }
  
  next();
}

/**
 * Check if the user is a therapist or admin (alias for isTherapist)
 * Created for better semantic naming in routes
 */
export function isTherapistOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'therapist' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Therapist or admin role required.' });
  }
  
  next();
}

/**
 * Check if the user is an admin
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  
  next();
}

/**
 * Check if the user is a client or admin
 */
export function isClientOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // If user is admin, always allow
  if (req.user.role === 'admin') {
    console.log('Admin access for client resource - ALLOWED');
    return next();
  }
  
  // If user is professional (but not admin), deny access
  if (req.user.role === 'therapist') {
    return res.status(403).json({ message: 'Mental health professionals cannot create emotion or thought records. Only clients can record emotions and thoughts.' });
  }
  
  // Otherwise, assume client role and allow
  next();
}

/**
 * Check if the user has permission to create a resource for the specified user
 */
export async function checkResourceCreationPermission(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const requestedUserId = parseInt(req.params.userId);
  const currentUser = req.user; // Type assertion helper
  
  // If user is creating a resource for themselves - always allow
  if (currentUser.id === requestedUserId) {
    return next();
  }
  
  // Admin can create resources for anyone - check this FIRST
  if (currentUser.role === 'admin') {
    return next();
  }
  
  // If professional is creating a resource for their client - allow
  if (currentUser.role === 'therapist') {
    try {
      const client = await storage.getUser(requestedUserId);
      if (client && client.therapistId === currentUser.id) {
        return next();
      }
      return res.status(403).json({ message: 'Access denied. You can only create resources for your own clients.' });
    } catch (error) {
      console.error('Resource creation permission check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Otherwise deny
  return res.status(403).json({ message: 'Access denied. You can only create resources for yourself.' });
}

/**
 * Middleware to ensure req.user is defined
 * This helps eliminate many TypeScript warnings about req.user possibly being undefined
 */
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

export async function checkUserAccess(req: Request, res: Response, next: NextFunction) {
  // First ensure user is authenticated (eliminates TypeScript warnings)
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const requestedUserId = parseInt(req.params.userId);
  const currentUser = req.user; // Type assertion helper
  
  // Verbose access-check logging removed for production cleanliness.
  
  // 1) Admins always allowed
  if (currentUser.role === 'admin') return next();

  // 2) Users may always access their own data
  if (currentUser.id === requestedUserId) return next();

  // 3) Therapists may access their assigned clients' data
  if (currentUser.role === 'therapist') {
    try {
      const client = await storage.getUser(requestedUserId);
      if (client && client.therapistId === currentUser.id) return next();
      return res.status(403).json({ message: 'Access denied. Not your client.' });
    } catch (error) {
      console.error('Check user access error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(403).json({ message: 'Access denied.' });
}
