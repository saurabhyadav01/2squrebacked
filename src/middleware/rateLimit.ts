/**
 * Rate Limiting Middleware
 * 
 * Provides various rate limiters to protect API endpoints from abuse,
 * DDoS attacks, and brute force attempts. Different endpoints have
 * different rate limits based on their sensitivity and usage patterns.
 * 
 * NOTE: Rate limiting is DISABLED in development mode (NODE_ENV !== 'production')
 * to allow unlimited requests during development and testing.
 */

import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Check if we're in development mode or if rate limiting is explicitly disabled
const isDevelopment = process.env.NODE_ENV !== "production";
const disableRateLimit = process.env.DISABLE_RATE_LIMIT === "true" || isDevelopment;

// Log rate limiting status on module load
if (disableRateLimit) {
  console.log("⚠️  Rate limiting DISABLED - Development mode or DISABLE_RATE_LIMIT=true");
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
}

/**
 * No-op middleware that passes through requests without rate limiting
 * Used in development mode to disable rate limiting
 */
const noOpLimiter = (req: Request, res: Response, next: NextFunction) => {
  next();
};

/**
 * Helper function to create rate limiter or no-op based on environment
 * 
 * @param config - Rate limit configuration
 * @returns Rate limiter middleware or no-op middleware in development
 */
const createRateLimiter = (config: Parameters<typeof rateLimit>[0]) => {
  if (disableRateLimit) {
    return noOpLimiter;
  }
  return rateLimit(config);
};

/**
 * General API Rate Limiter
 * 
 * Applied to all /api routes by default.
 * Limits: Configurable via API_RATE_LIMIT env var, default 1000 requests per 15 minutes per IP address
 * 
 * Purpose: Prevents general API abuse while allowing normal usage.
 * Suitable for most endpoints that don't require stricter limits.
 * DISABLED in development mode.
 */
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes time window
  max: parseInt(process.env.API_RATE_LIMIT || "1000"), // Configurable limit (default: 1000)
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers (RFC 7231)
  legacyHeaders: false, // Disable the deprecated `X-RateLimit-*` headers
});

/**
 * Strict Rate Limiter for Authentication Endpoints
 * 
 * Applied to login and registration routes.
 * Limits: Configurable via AUTH_RATE_LIMIT env var, default 100 requests per 15 minutes per IP address
 * 
 * Purpose: Prevents brute force attacks on authentication.
 * Restrictive to make automated password guessing impractical.
 * Successful requests don't count toward limit (skipSuccessfulRequests: true).
 * 
 * NOTE: Currently DISABLED - always returns no-op middleware
 * To re-enable: Change to use createRateLimiter() instead of noOpLimiter
 */
export const authLimiter = noOpLimiter; // Completely disabled - no rate limiting on auth endpoints

/**
 * Payment Endpoint Rate Limiter
 * 
 * Applied to payment processing routes.
 * Limits: Configurable via PAYMENT_RATE_LIMIT env var, default 100 requests per 15 minutes per IP address
 * 
 * Purpose: Prevents payment fraud and duplicate transaction attempts.
 * Stricter than general API but allows legitimate payment retries.
 * DISABLED in development mode.
 */
export const paymentLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes time window
  max: parseInt(process.env.PAYMENT_RATE_LIMIT || "100"), // Configurable limit (default: 100)
  message: {
    error: "Too many payment requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Admin Endpoint Rate Limiter
 * 
 * Applied to admin-only routes.
 * Limits: Configurable via ADMIN_RATE_LIMIT env var, default 1000 requests per 15 minutes per IP address
 * 
 * Purpose: Allows higher throughput for admin operations while still
 * providing protection. Admin users may need to perform bulk operations.
 * DISABLED in development mode.
 */
export const adminLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes time window
  max: parseInt(process.env.ADMIN_RATE_LIMIT || "1000"), // Configurable limit (default: 1000)
  message: {
    error: "Too many admin requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Product Listing Rate Limiter
 * 
 * Applied to public product browsing endpoints.
 * Limits: Configurable via PRODUCT_RATE_LIMIT env var, default 1000 requests per 15 minutes per IP address
 * 
 * Purpose: More lenient limit for public product browsing to allow
 * users to browse catalogs freely without hitting rate limits.
 * Public endpoints need higher limits for good user experience.
 * DISABLED in development mode.
 */
export const productListLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes time window
  max: parseInt(process.env.PRODUCT_RATE_LIMIT || "1000"), // Configurable limit (default: 1000)
  message: {
    error: "Too many product requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

