import { Request, Response, NextFunction } from "express";
import NodeCache from "node-cache";

// Create cache instance with default TTL of 5 minutes
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Better performance
});

/**
 * Cache middleware
 * Caches GET requests for specified duration
 */
export const cacheMiddleware = (duration: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Generate cache key from URL and query params
    const key = `${req.originalUrl || req.url}`;

    // Check if data exists in cache
    const cachedData = cache.get(key);
    if (cachedData) {
      // Set cache headers
      res.setHeader("X-Cache", "HIT");
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (body: any) {
      // Cache the response
      cache.set(key, body, duration);
      // Set cache headers
      res.setHeader("X-Cache", "MISS");
      // Call original json method
      return originalJson(body);
    };

    next();
  };
};

/**
 * Clear cache for specific key pattern
 */
export const clearCache = (pattern: string) => {
  const keys = cache.keys();
  const regex = new RegExp(pattern);
  keys.forEach((key) => {
    if (regex.test(key)) {
      cache.del(key);
    }
  });
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  cache.flushAll();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return cache.getStats();
};

// Export cache instance for direct use if needed
export { cache };

