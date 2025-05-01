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
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const session = await storage.getSessionById(sessionId);
    
    if (!session) {
      return res.status(401).json({ message: 'Invalid session' });
    }
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await storage.deleteSession(sessionId);
      return res.status(401).json({ message: 'Session expired' });
    }
    
    const user = await storage.getUser(session.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
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
  
  // If therapist is creating a resource for their client - allow
  if (req.user?.role === 'therapist') {
    // Import storage at top of file
    const { storage } = require('../storage');
    
    // Verify the requested user is their client
    storage.getUser(requestedUserId)
      .then(client => {
        if (client && client.therapistId === req.user.id) {
          return next();
        }
        res.status(403).json({ message: 'Access denied. You can only create resources for your own clients.' });
      })
      .catch(error => {
        console.error('Resource creation permission check error:', error);
        res.status(500).json({ message: 'Internal server error' });
      });
    return;
  }
  
  // Admin can create resources for anyone
  if (req.user?.role === 'admin') {
    return next();
  }
  
  // Otherwise deny
  res.status(403).json({ message: 'Access denied. You can only create resources for yourself.' });
}

export function checkUserAccess(req: Request, res: Response, next: NextFunction) {
  const requestedUserId = parseInt(req.params.userId);
  
  // If it's the user's own data
  if (req.user?.id === requestedUserId) {
    return next();
  }
  
  // If it's a therapist accessing their client's data
  if (req.user?.role === 'therapist') {
    // Fetch the client to check if they belong to this therapist
    storage.getUser(requestedUserId)
      .then(client => {
        if (client && client.therapistId === req.user.id) {
          return next();
        }
        res.status(403).json({ message: 'Access denied. Not your client.' });
      })
      .catch(error => {
        console.error('Check user access error:', error);
        res.status(500).json({ message: 'Internal server error' });
      });
    return;
  }
  
  // Admin can access all data
  if (req.user?.role === 'admin') {
    return next();
  }
  
  res.status(403).json({ message: 'Access denied.' });
}
