import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

class RateLimiter {
  private requests = new Map<string, number[]>();
  
  constructor(private config: RateLimitConfig) {}
  
  middleware = (req: Request, res: Response, next: NextFunction) => {
    const clientId = this.getClientId(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing requests for this client
    const clientRequests = this.requests.get(clientId) || [];
    
    // Filter out old requests
    const recentRequests = clientRequests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.config.maxRequests) {
      return res.status(429).json({
        message: this.config.message || 'Too many requests',
        retryAfter: Math.ceil(this.config.windowMs / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(clientId, recentRequests);
    
    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }
    
    next();
  };
  
  private getClientId(req: Request): string {
    return req.user?.id?.toString() || req.ip || 'anonymous';
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [clientId, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > now - this.config.windowMs);
      if (recentRequests.length === 0) {
        this.requests.delete(clientId);
      } else {
        this.requests.set(clientId, recentRequests);
      }
    }
  }
}

export const createRateLimiter = (config: RateLimitConfig) => new RateLimiter(config);

// Common rate limiters
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts'
});

export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'API rate limit exceeded'
});