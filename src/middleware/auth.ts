/**
 * Authentication Middleware
 * 
 * Provides middleware functions for protecting routes that require authentication
 * and authorization. Verifies JWT tokens and checks user roles.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Extended Request interface that includes user information
 * After authentication, req.user will contain decoded JWT payload
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication Middleware
 * 
 * Verifies JWT token from Authorization header and attaches user info to request.
 * Token should be in format: "Bearer <token>"
 * 
 * @param req - Express request with optional user property
 * @param res - Express response
 * @param next - Express next function to continue to next middleware
 * 
 * Process:
 * 1. Extract token from Authorization header (Bearer token format)
 * 2. Verify token signature and expiration using JWT_SECRET
 * 3. Attach decoded user info (id, email, role) to req.user
 * 4. Call next() to continue request processing
 * 
 * Returns 401 if token is missing, invalid, or expired
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Extract token from "Bearer <token>" format
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify token signature and expiration
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const decoded = jwt.verify(token, jwtSecret) as { id: string; email: string; role: string };

    // Attach user information to request object for use in route handlers
    req.user = decoded;
    next();
  } catch (error) {
    // Token is invalid, expired, or malformed
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Authorization Middleware Factory
 * 
 * Creates middleware that checks if authenticated user has required role(s).
 * Must be used after authenticate middleware.
 * 
 * @param roles - Array of allowed roles (e.g., ['admin', 'manager'])
 * @returns Middleware function that checks user role
 * 
 * Usage:
 * router.get('/admin/users', authenticate, authorize('admin'), handler)
 * 
 * Returns 401 if user is not authenticated
 * Returns 403 if user role is not in allowed roles list
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Ensure user is authenticated (authenticate middleware must run first)
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user's role is in the list of allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // User has required role, continue to route handler
    next();
  };
};

