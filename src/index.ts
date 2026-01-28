/**
 * 2Square Backend - Main Application Entry Point
 * 
 * This is the main Express.js server file that sets up the backend API for the 2Square e-commerce platform.
 * It configures middleware, routes, error handling, and database connections.
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Import middleware for rate limiting API requests
import { apiLimiter } from "./middleware/rateLimit";

// Import all route handlers for different API endpoints
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import categoryRoutes from "./routes/category.routes";
import couponRoutes from "./routes/coupon.routes";
import analyticsRoutes from "./routes/analytics.routes";
import settingsRoutes from "./routes/settings.routes";
import userRoutes from "./routes/user.routes";
import paymentAdminRoutes from "./routes/payment-admin.routes";
import { pool } from "./config/database";

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();
// Get port from environment variable or default to 5000
const PORT = process.env.PORT || 5000;

/**
 * Test database connection on server startup
 * Verifies that PostgreSQL is accessible and credentials are correct
 */
pool.query("SELECT NOW()")
  .then(async () => {
    console.log("✅ Database connection successful");
    
    // Verify users table exists
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )
      `);
      
      if (tableCheck.rows[0].exists) {
        console.log("✅ Users table exists");
      } else {
        console.error("❌ Users table does NOT exist!");
        console.log("💡 Run: npm run db:init to create database tables");
      }
    } catch (err: any) {
      console.error("❌ Error checking users table:", err.message);
    }
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    console.log("💡 Make sure PostgreSQL is running and database credentials are correct");
    console.log(`💡 Current DB: ${process.env.DB_NAME || "2square_db"} @ ${process.env.DB_HOST || "localhost"}`);
  });

/**
 * Middleware Configuration
 * These are applied to all incoming requests in the order they are defined
 */
// Helmet: Sets various HTTP headers for security (XSS protection, content type sniffing, etc.)
app.use(helmet());
// CORS: Enables Cross-Origin Resource Sharing to allow frontend to make requests
app.use(cors());
// Morgan: HTTP request logger middleware for development (logs requests to console)
app.use(morgan("dev"));
// Express JSON parser: Parses incoming JSON payloads
app.use(express.json());
// Express URL-encoded parser: Parses URL-encoded payloads (extended: true allows rich objects)
app.use(express.urlencoded({ extended: true }));

/**
 * Global Rate Limiting
 * Applies rate limiting to all routes under /api to prevent abuse and DDoS attacks
 */
app.use("/api", apiLimiter);

/**
 * Health Check Endpoint
 * Used by monitoring tools and load balancers to verify server is running
 * Returns server status and current timestamp
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "2Square Backend API is running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Information Endpoint
 * Provides API documentation and available endpoints for developers
 * Useful for API discovery and integration
 */
app.get("/api", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to 2Square Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      products: "/api/products",
      cart: "/api/cart",
      orders: "/api/orders",
      payments: "/api/payments",
      categories: "/api/categories",
      coupons: "/api/coupons",
      analytics: "/api/analytics",
      settings: "/api/settings",
      users: "/api/users",
    },
  });
});

/**
 * API Route Handlers
 * Mounts all route modules to their respective paths
 * Each route module handles specific business logic for its domain
 */
app.use("/api/auth", authRoutes);              // Authentication: login, register, profile management
app.use("/api/products", productRoutes);       // Product management: CRUD operations, inventory
app.use("/api/cart", cartRoutes);             // Shopping cart: add, remove, update items
app.use("/api/orders", orderRoutes);          // Order management: create, track, update orders
app.use("/api/payments", paymentRoutes);      // Payment processing: handle transactions
app.use("/api/categories", categoryRoutes);   // Product categories: organize products
app.use("/api/coupons", couponRoutes);        // Coupon system: discounts and promotions
app.use("/api/analytics", analyticsRoutes);   // Analytics: sales data, reports, statistics
app.use("/api/settings", settingsRoutes);     // Application settings: configuration management
app.use("/api/users", userRoutes);            // User management: user CRUD operations
app.use("/api/admin/payments", paymentAdminRoutes); // Admin payment operations: refunds, adjustments

/**
 * Global Error Handling Middleware
 * Catches any unhandled errors in route handlers and sends appropriate error response
 * Should be defined after all routes to catch errors from them
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

/**
 * 404 Not Found Handler
 * Catches any requests to routes that don't exist
 * Must be defined last, after all other routes and middleware
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

/**
 * Start Server
 * Binds the Express app to the specified port and begins listening for requests
 */
app.listen(PORT, () => {
  console.log(`🚀 2Square Backend server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
});

