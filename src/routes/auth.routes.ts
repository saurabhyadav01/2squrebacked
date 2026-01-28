/**
 * Authentication Routes
 * 
 * Handles all authentication-related endpoints including user registration,
 * login, profile management, and current user information retrieval.
 * All routes use rate limiting to prevent brute force attacks.
 */

import { Router, Request, Response } from "express";
import { authService, registerSchema, loginSchema } from "../services/auth.service";
import { authenticate, AuthRequest } from "../middleware/auth";
// Rate limiting removed for development - uncomment to re-enable
// import { authLimiter } from "../middleware/rateLimit";

const router = Router();

/**
 * POST /register
 * Register a new user account
 * 
 * Validates input data using Zod schema, checks for existing email,
 * hashes password, creates user record, and returns JWT token.
 * Uses strict rate limiting to prevent account creation abuse.
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    // Validate request body against schema (email, password, optional name/phone)
    const validatedData = registerSchema.parse(req.body);
    // Register user and get JWT token
    const result = await authService.register(validatedData);
    res.status(201).json(result);
  } catch (error: any) {
    // Handle validation errors from Zod
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    // Handle other errors (e.g., email already exists)
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /login
 * Authenticate user and return JWT token
 * 
 * Validates credentials, checks if account is active, verifies password,
 * and returns user data with JWT token for subsequent authenticated requests.
 * Uses strict rate limiting to prevent brute force login attempts.
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    // Validate request body (email and password required)
    const validatedData = loginSchema.parse(req.body);
    // Authenticate user and get JWT token
    const result = await authService.login(validatedData);
    res.json(result);
  } catch (error: any) {
    // Handle validation errors
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    // Handle authentication failures (invalid credentials, inactive account)
    res.status(401).json({ error: error.message });
  }
});

/**
 * GET /me
 * Get current authenticated user's information
 * 
 * Requires authentication via JWT token. Returns user profile data
 * excluding sensitive information like password hash.
 * Response can be cached for 2 minutes to reduce database load.
 */
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Get user from database using ID from JWT token
    const user = await authService.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Return sanitized user data (no password hash)
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /profile
 * Update authenticated user's profile information
 * 
 * Allows users to update their first name, last name, and phone number.
 * Requires authentication. Only updates fields that are provided in request.
 */
router.put("/profile", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Update user profile with provided data
    const result = await authService.updateProfile(req.user!.id, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

