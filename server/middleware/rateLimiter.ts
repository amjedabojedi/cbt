import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

class RateLimiter {
  private requests = new Map<string, number[]>();
  
  constructor(private config: RateLimitConfig) {}

  getClientId(req: Request): string {
    return req.user?.id?.toString() || req.ip || 'anonymous';
  }

  tryConsume(clientId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const clientRequests = this.requests.get(clientId) || [];
    const recentRequests = clientRequests.filter(time => time > windowStart);

    if (recentRequests.length >= this.config.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(clientId, recentRequests);

    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }
  
  middleware = (req: Request, res: Response, next: NextFunction) => {
    const clientId = this.getClientId(req);
    const allowed = this.tryConsume(clientId);

    if (!allowed) {
      return res.status(429).json({
        message: this.config.message || 'Too many requests',
        retryAfter: Math.ceil(this.config.windowMs / 1000)
      });
    }
    
    next();
  };
  
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

export const createRateLimiter = (config: RateLimitConfig) =>
  new RateLimiter(config).middleware;

// Common rate limiters (already bound middleware functions)
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

// AI rate limiter instance — exported so routes can use both middleware and tryConsume
export const aiRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  message: 'AI analysis rate limit exceeded. Please wait before making more AI requests.'
});

export const aiRateLimit = aiRateLimiter.middleware;
