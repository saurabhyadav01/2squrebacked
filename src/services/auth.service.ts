import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/database";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

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

export const authService = {
  // Register a new user
  async register(data: z.infer<typeof registerSchema>) {
    const { email, password, firstName, lastName, phone } = data;

    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, phone, role, is_active, created_at`,
      [email, passwordHash, firstName || null, lastName || null, phone || null]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
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

  // Login user
  async login(data: z.infer<typeof loginSchema>) {
    const { email, password } = data;

    // Find user
    const result = await query(
      "SELECT id, email, password_hash, first_name, last_name, phone, role, is_active FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error("Account is deactivated");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
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

  // Get user by ID
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

  // Update user profile
  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

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

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(userId);

    const result = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id, email, first_name, last_name, phone, role`,
      values
    );

    return result.rows[0];
  },
};

