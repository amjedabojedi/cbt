import { Request, Response, NextFunction, CookieOptions } from 'express';
import { storage } from '../storage';
import { User } from '@shared/schema';

// Import the getSessionCookieOptions function from routes
// This ensures consistent cookie handling across the application
import { getSessionCookieOptions } from '../routes';

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

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: any;
    }
  }
}

/**
 * Authenticate the user based on their session cookie
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.sessionId;
  
  // SECURITY: Only session-based authentication is allowed
  if (!sessionId) {
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
      const clearOptions = getSessionCookieOptions();
      delete clearOptions.maxAge; // Remove maxAge to ensure cookie gets deleted
      res.clearCookie("sessionId", clearOptions);
      return res.status(401).json({ message: 'Invalid session' });
    }
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await storage.deleteSession(sessionId);
      // Clear the expired cookie with consistent options
      const clearOptions = getSessionCookieOptions();
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
  
  console.log(`User Access Check - User ${currentUser.id} (${currentUser.username}, role: ${currentUser.role}) is accessing user ${requestedUserId} data`);
  
  // FIRST check: If user is an admin, always allow
  console.log('**CHECKING IF USER IS ADMIN**', 
              'User role:', currentUser.role, 
              'Is admin?', currentUser.role === 'admin');
              
  if (currentUser.role === 'admin') {
    console.log('*** ADMIN ACCESS GRANTED *** User is an admin, access ALWAYS ALLOWED for all users');
    return next();
  }
  
  // SECOND check: If user is accessing their own data, allow
  if (currentUser.id === requestedUserId) {
    console.log('User is accessing their own data - ALLOWED');
    return next();
  }
  
  // THIRD check: If user is a professional accessing a client's data
  if (currentUser.role === 'therapist') {
    console.log('User is a mental health professional, checking if they are accessing their client');
    
    try {
      const client = await storage.getUser(requestedUserId);
      console.log(`Client ${requestedUserId} lookup result:`, client ? `Found: therapistId = ${client.therapistId}` : 'Not found');
      
      if (client && client.therapistId === currentUser.id) {
        console.log('This client belongs to the professional - ALLOWED');
        return next();
      }
      
      console.log('This client does not belong to the professional - DENIED');
      return res.status(403).json({ message: 'Access denied. Not your client.' });
    } catch (error) {
      console.error('Check user access error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // If none of the above conditions are met, deny access
  console.log('Access DENIED - User has no permission');
  return res.status(403).json({ message: 'Access denied.' });
}
