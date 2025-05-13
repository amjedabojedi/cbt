import { Request, Response, NextFunction, CookieOptions } from 'express';
import { storage } from '../storage';
import { User } from '@shared/schema';

// Import the getSessionCookieOptions function from routes
// This ensures consistent cookie handling across the application
import { getSessionCookieOptions } from '../routes';

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
  console.log("Authenticating request with cookies:", req.cookies);
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId) {
    console.log("No sessionId cookie found");
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    console.log("Looking up session ID:", sessionId);
    const session = await storage.getSessionById(sessionId);
    
    if (!session) {
      console.log("Session not found in database");
      // Clear the invalid cookie to prevent future issues
      const clearOptions = getSessionCookieOptions();
      delete clearOptions.maxAge; // Remove maxAge to ensure cookie gets deleted
      console.log("Clearing invalid session cookie with options:", clearOptions);
      res.clearCookie("sessionId", clearOptions);
      return res.status(401).json({ message: 'Invalid session' });
    }
    
    console.log("Found session:", session.id, "for user:", session.userId);
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      console.log("Session expired at:", session.expiresAt);
      await storage.deleteSession(sessionId);
      // Clear the expired cookie with consistent options
      const clearOptions = getSessionCookieOptions();
      delete clearOptions.maxAge; // Remove maxAge to ensure cookie gets deleted
      console.log("Clearing expired session cookie with options:", clearOptions);
      res.clearCookie("sessionId", clearOptions);
      return res.status(401).json({ message: 'Session expired' });
    }
    
    const user = await storage.getUser(session.userId);
    
    if (!user) {
      console.log("User not found for session:", session.userId);
      return res.status(401).json({ message: 'User not found' });
    }
    
    console.log("Authentication successful for user:", user.id, user.username);
    
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
export function checkResourceCreationPermission(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const requestedUserId = parseInt(req.params.userId);
  
  // If user is creating a resource for themselves - always allow
  if (req.user.id === requestedUserId) {
    console.log('User creating resource for themselves - ALLOWED');
    return next();
  }
  
  // Admin can create resources for anyone - check this FIRST
  if (req.user.role === 'admin') {
    console.log('Admin creating resource for user', requestedUserId, '- ALWAYS ALLOWED');
    return next();
  }
  
  // If professional is creating a resource for their client - allow
  if (req.user.role === 'therapist') {
    console.log('Professional creating resource for client - checking relationship');
    
    // Verify the requested user is their client
    (async () => {
      try {
        const client = await storage.getUser(requestedUserId);
        if (client && client.therapistId === req.user.id) {
          console.log('This client belongs to the professional - ALLOWED');
          return next();
        }
        console.log('This client does not belong to the professional - DENIED');
        res.status(403).json({ message: 'Access denied. You can only create resources for your own clients.' });
      } catch (error) {
        console.error('Resource creation permission check error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    })();
    return;
  }
  
  // Otherwise deny
  console.log('Access DENIED - User has no permission');
  res.status(403).json({ message: 'Access denied. You can only create resources for yourself.' });
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

export function checkUserAccess(req: Request, res: Response, next: NextFunction) {
  // First ensure user is authenticated (eliminates TypeScript warnings)
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const requestedUserId = parseInt(req.params.userId);
  
  // Debug info
  console.log(`User Access Check - User ${req.user.id} (${req.user.username}, role: ${req.user.role}) is accessing user ${requestedUserId} data`);
  
  // FIRST check: If user is an admin, always allow
  console.log('**CHECKING IF USER IS ADMIN**', 
              'User role:', req.user.role, 
              'Is admin?', req.user.role === 'admin');
              
  if (req.user.role === 'admin') {
    console.log('*** ADMIN ACCESS GRANTED *** User is an admin, access ALWAYS ALLOWED for all users');
    return next();
  }
  
  // SECOND check: If user is accessing their own data, allow
  if (req.user.id === requestedUserId) {
    console.log('User is accessing their own data - ALLOWED');
    return next();
  }
  
  // THIRD check: If user is a professional accessing a client's data
  if (req.user.role === 'therapist') {
    console.log('User is a mental health professional, checking if they are accessing their client');
    
    // Use async/await instead of promise chains for clarity
    (async () => {
      try {
        const client = await storage.getUser(requestedUserId);
        console.log(`Client ${requestedUserId} lookup result:`, client ? `Found: therapistId = ${client.therapistId}` : 'Not found');
        
        if (client && client.therapistId === req.user.id) {
          console.log('This client belongs to the professional - ALLOWED');
          return next();
        }
        
        console.log('This client does not belong to the professional - DENIED');
        res.status(403).json({ message: 'Access denied. Not your client.' });
      } catch (error) {
        console.error('Check user access error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    })();
    return;
  }
  
  // If none of the above conditions are met, deny access
  console.log('Access DENIED - User has no permission');
  res.status(403).json({ message: 'Access denied.' });
}
