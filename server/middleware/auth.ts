import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: any;
      session?: any;
    }
  }
}

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
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export function isTherapist(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'therapist' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Therapist role required.' });
  }
  
  next();
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  
  next();
}

// Middleware to ensure only clients can create personal records (emotions, thoughts)
export function isClientOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === 'therapist') {
    return res.status(403).json({ message: 'Therapists cannot create emotion or thought records. Only clients can record emotions and thoughts.' });
  }
  
  next();
}

// Middleware for resource creation with proper permissions
export function checkResourceCreationPermission(req: Request, res: Response, next: NextFunction) {
  const requestedUserId = parseInt(req.params.userId);
  
  // If user is creating a resource for themselves - always allow
  if (req.user?.id === requestedUserId) {
    return next();
  }
  
  // Admin can create resources for anyone - check this FIRST
  if (req.user?.role === 'admin') {
    console.log('Admin creating resource for user', requestedUserId, '- ALLOWED');
    return next();
  }
  
  // If therapist is creating a resource for their client - allow
  if (req.user?.role === 'therapist') {
    // Import storage at top of file
    const { storage } = require('../storage');
    
    // Verify the requested user is their client
    storage.getUser(requestedUserId)
      .then((client: any) => {
        if (client && client.therapistId === req.user.id) {
          return next();
        }
        res.status(403).json({ message: 'Access denied. You can only create resources for your own clients.' });
      })
      .catch((error: Error) => {
        console.error('Resource creation permission check error:', error);
        res.status(500).json({ message: 'Internal server error' });
      });
    return;
  }
  
  // Otherwise deny
  res.status(403).json({ message: 'Access denied. You can only create resources for yourself.' });
}

export function checkUserAccess(req: Request, res: Response, next: NextFunction) {
  const requestedUserId = parseInt(req.params.userId);
  
  console.log(`User Access Check - User ${req.user?.id} (${req.user?.username}, role: ${req.user?.role}) is accessing user ${requestedUserId} data`);
  
  // If it's the user's own data
  if (req.user?.id === requestedUserId) {
    console.log('User is accessing their own data - ALLOWED');
    return next();
  }
  
  // Admin can access all data - check this FIRST to ensure admins always have access
  if (req.user?.role === 'admin') {
    console.log('User is an admin, access ALLOWED for all users');
    return next();
  }
  
  // If it's a therapist accessing a client's data
  if (req.user?.role === 'therapist') {
    console.log('User is a therapist, checking if they are accessing their client');
    // Fetch the client to check if they belong to this therapist
    storage.getUser(requestedUserId)
      .then((client: any) => {
        console.log(`Client ${requestedUserId} lookup result:`, client ? `Found: therapistId = ${client.therapistId}` : 'Not found');
        if (client && client.therapistId === req.user.id) {
          console.log('This client belongs to the therapist - ALLOWED');
          return next();
        }
        console.log('This client does not belong to the therapist - DENIED');
        res.status(403).json({ message: 'Access denied. Not your client.' });
      })
      .catch((error: Error) => {
        console.error('Check user access error:', error);
        res.status(500).json({ message: 'Internal server error' });
      });
    return;
  }
  
  console.log('Access DENIED - User has no permission');
  res.status(403).json({ message: 'Access denied.' });
}
