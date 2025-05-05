import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { User } from '@shared/schema';

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
  console.log("Request headers:", req.headers);
  
  // Debug information
  console.log("Cookie header:", req.headers.cookie);
  
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId) {
    console.log("No sessionId cookie found");
    
    // Check if this is a preflight OPTIONS request from CORS
    if (req.method === 'OPTIONS') {
      console.log("This is a preflight OPTIONS request");
      return next();
    }
    
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    console.log("Looking up session ID:", sessionId);
    const session = await storage.getSessionById(sessionId);
    
    if (!session) {
      console.log("Session not found in database");
      return res.status(401).json({ message: 'Invalid session' });
    }
    
    console.log("Found session:", session.id, "for user:", session.userId);
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      console.log("Session expired at:", session.expiresAt);
      await storage.deleteSession(sessionId);
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
    
    // For debugging - refresh cookie to ensure it persists
    res.cookie("sessionId", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Always use lax for better compatibility
      path: '/', // Ensure cookie is available on all paths
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Check if the user is a therapist or admin
 */
export function isTherapist(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'therapist' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Therapist role required.' });
  }
  
  next();
}

/**
 * Check if the user is an admin
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  
  next();
}

/**
 * Check if the user is a client or admin
 */
export function isClientOrAdmin(req: Request, res: Response, next: NextFunction) {
  // If user is admin, always allow
  if (req.user?.role === 'admin') {
    console.log('Admin access for client resource - ALLOWED');
    return next();
  }
  
  // If user is therapist (but not admin), deny access
  if (req.user?.role === 'therapist') {
    return res.status(403).json({ message: 'Therapists cannot create emotion or thought records. Only clients can record emotions and thoughts.' });
  }
  
  // Otherwise, assume client role and allow
  next();
}

/**
 * Check if the user has permission to create a resource for the specified user
 */
export function checkResourceCreationPermission(req: Request, res: Response, next: NextFunction) {
  const requestedUserId = parseInt(req.params.userId);
  
  // If user is creating a resource for themselves - always allow
  if (req.user?.id === requestedUserId) {
    console.log('User creating resource for themselves - ALLOWED');
    return next();
  }
  
  // Admin can create resources for anyone - check this FIRST
  if (req.user?.role === 'admin') {
    console.log('Admin creating resource for user', requestedUserId, '- ALWAYS ALLOWED');
    return next();
  }
  
  // If therapist is creating a resource for their client - allow
  if (req.user?.role === 'therapist') {
    console.log('Therapist creating resource for client - checking relationship');
    
    // Verify the requested user is their client
    (async () => {
      try {
        const client = await storage.getUser(requestedUserId);
        if (client && client.therapistId === req.user!.id) {
          console.log('This client belongs to the therapist - ALLOWED');
          return next();
        }
        console.log('This client does not belong to the therapist - DENIED');
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
 * Check if the user has permission to access the specified user's data
 */
export function checkUserAccess(req: Request, res: Response, next: NextFunction) {
  const requestedUserId = parseInt(req.params.userId);
  
  // Debug info
  console.log(`User Access Check - User ${req.user?.id} (${req.user?.username}, role: ${req.user?.role}) is accessing user ${requestedUserId} data`);
  
  // FIRST check: If user is an admin, always allow
  console.log('**CHECKING IF USER IS ADMIN**', 
              'User role:', req.user?.role, 
              'Is admin?', req.user?.role === 'admin');
              
  if (req.user?.role === 'admin') {
    console.log('*** ADMIN ACCESS GRANTED *** User is an admin, access ALWAYS ALLOWED for all users');
    return next();
  }
  
  // SECOND check: If user is accessing their own data, allow
  if (req.user?.id === requestedUserId) {
    console.log('User is accessing their own data - ALLOWED');
    return next();
  }
  
  // THIRD check: If user is a therapist accessing a client's data
  if (req.user?.role === 'therapist') {
    console.log('User is a therapist, checking if they are accessing their client');
    
    // Use async/await instead of promise chains for clarity
    (async () => {
      try {
        const client = await storage.getUser(requestedUserId);
        console.log(`Client ${requestedUserId} lookup result:`, client ? `Found: therapistId = ${client.therapistId}` : 'Not found');
        
        if (client && client.therapistId === req.user!.id) {
          console.log('This client belongs to the therapist - ALLOWED');
          return next();
        }
        
        console.log('This client does not belong to the therapist - DENIED');
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
