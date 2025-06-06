// Session caching middleware to reduce database lookups
import { User } from "@shared/schema";

interface CachedSession {
  user: User;
  timestamp: number;
}

class SessionCache {
  private cache = new Map<string, CachedSession>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes cache

  set(sessionId: string, user: User): void {
    this.cache.set(sessionId, {
      user,
      timestamp: Date.now()
    });
  }

  get(sessionId: string): User | null {
    const cached = this.cache.get(sessionId);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(sessionId);
      return null;
    }

    return cached.user;
  }

  delete(sessionId: string): void {
    this.cache.delete(sessionId);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [sessionId, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.TTL) {
        this.cache.delete(sessionId);
      }
    }
  }
}

export const sessionCache = new SessionCache();

// Cleanup expired sessions every 10 minutes
setInterval(() => {
  sessionCache.cleanup();
}, 10 * 60 * 1000);