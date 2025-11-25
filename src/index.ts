import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Import middleware
import { apiLimiter } from "./middleware/rateLimit";

// Import routes
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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Test database connection
pool.query("SELECT NOW()")
  .then(() => {
    console.log("✅ Database connection successful");
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    console.log("💡 Make sure PostgreSQL is running and database credentials are correct");
  });

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiting for all API routes
app.use("/api", apiLimiter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "2Square Backend API is running",
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
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

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/payments", paymentAdminRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 2Square Backend server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
});

