/**
 * Authentication Service
 * 
 * Handles all authentication business logic including user registration,
 * login, password hashing, JWT token generation, and user profile management.
 * Uses bcrypt for secure password hashing and JWT for token-based authentication.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/database";
import { z } from "zod";

// JWT configuration from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Zod validation schema for user registration
 * Ensures email is valid, password meets minimum length, and optional fields are handled
 */
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

/**
 * Zod validation schema for user login
 * Requires valid email and non-empty password
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * User interface matching database schema
 * Represents a user record from the database
 */
export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: Date;
}

/**
 * Authentication Service Object
 * Contains all authentication-related business logic methods
 */
export const authService = {
  /**
   * Register a new user account
   * 
   * @param data - Validated registration data (email, password, optional name/phone)
   * @returns User object and JWT token
   * @throws Error if email already exists
   * 
   * Process:
   * 1. Check if user with email already exists
   * 2. Hash password using bcrypt (10 rounds)
   * 3. Insert new user into database
   * 4. Generate JWT token with user ID, email, and role
   * 5. Return user data (without password) and token
   */
  async register(data: z.infer<typeof registerSchema>) {
    const { email, password, firstName, lastName, phone } = data;

    // Check if user already exists to prevent duplicate accounts
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Hash password with bcrypt (10 salt rounds for good security/performance balance)
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user into database and return created user record
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, phone, role, is_active, created_at`,
      [email, passwordHash, firstName || null, lastName || null, phone || null]
    );

    const user = result.rows[0];

    // Generate JWT token containing user ID, email, and role for authentication
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as any
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
      },
      token,
    };
  },

  /**
   * Authenticate user and generate JWT token
   * 
   * @param data - Validated login data (email and password)
   * @returns User object and JWT token
   * @throws Error if credentials are invalid or account is deactivated
   * 
   * Process:
   * 1. Find user by email
   * 2. Check if user exists
   * 3. Verify account is active
   * 4. Compare provided password with stored hash
   * 5. Generate and return JWT token if authentication succeeds
   */
  async login(data: z.infer<typeof loginSchema>) {
    const { email, password } = data;

    // Find user by email address
    const result = await query(
      "SELECT id, email, password_hash, first_name, last_name, phone, role, is_active FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = result.rows[0];

    // Check if user account is active (prevents login for deactivated accounts)
    if (!user.is_active) {
      throw new Error("Account is deactivated");
    }

    // Verify password by comparing plain text with bcrypt hash
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token for authenticated user
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as any
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
      },
      token,
    };
  },

  /**
   * Get user by ID
   * 
   * @param userId - Unique user identifier
   * @returns User object or null if not found
   * 
   * Retrieves user information from database excluding sensitive data like password hash
   */
  async getUserById(userId: string): Promise<User | null> {
    const result = await query(
      "SELECT id, email, first_name, last_name, phone, role, is_active, created_at FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  },

  /**
   * Update user profile information
   * 
   * @param userId - ID of user to update
   * @param data - Partial user data (firstName, lastName, phone)
   * @returns Updated user object
   * @throws Error if no fields provided to update
   * 
   * Dynamically builds UPDATE query based on provided fields.
   * Only updates fields that are explicitly provided in the data object.
   */
  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic UPDATE query based on provided fields
    if (data.firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(data.lastName);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(data.phone);
    }

    // Ensure at least one field is being updated
    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    // Add userId as last parameter for WHERE clause
    values.push(userId);

    // Execute dynamic UPDATE query
    const result = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id, email, first_name, last_name, phone, role`,
      values
    );

    return result.rows[0];
  },
};

