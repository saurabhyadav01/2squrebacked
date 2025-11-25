import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Payment endpoint rate limiter
 * Limits: 10 requests per 15 minutes per IP
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: "Too many payment requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Admin endpoint rate limiter
 * Limits: 200 requests per 15 minutes per IP
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    error: "Too many admin requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Product listing rate limiter (more lenient for public browsing)
 * Limits: 200 requests per 15 minutes per IP
 */
export const productListLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    error: "Too many product requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

