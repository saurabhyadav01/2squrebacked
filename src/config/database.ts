/**
 * Database Configuration
 * 
 * Sets up PostgreSQL connection pool using node-postgres (pg).
 * Provides connection pooling for efficient database access and
 * includes query execution helper with logging.
 */

import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * PostgreSQL Connection Pool Configuration
 * 
 * Uses environment variables for configuration with sensible defaults.
 * Connection pooling allows reuse of database connections, improving
 * performance by avoiding the overhead of establishing new connections.
 */
const poolConfig: PoolConfig = {
  user: process.env.DB_USER || "postgres",           // Database user
  host: process.env.DB_HOST || "localhost",         // Database host
  database: process.env.DB_NAME || "2square_db",    // Database name
  password: process.env.DB_PASSWORD || "postgres",  // Database password
  port: parseInt(process.env.DB_PORT || "5432"),    // PostgreSQL default port
  max: 20,                                           // Maximum number of clients in pool
  idleTimeoutMillis: 30000,                          // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000,                     // Timeout after 2 seconds if connection cannot be established
};

// Log database connection info (without password) for debugging
console.log("🔗 Database connection config:", {
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
  // password: "***" // Don't log password
});

// Create and export connection pool instance
export const pool = new Pool(poolConfig);

/**
 * Connection Event Handlers
 * Monitor pool lifecycle events for debugging and error handling
 */

// Log successful database connections
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

// Handle errors on idle clients (e.g., database server restart)
pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
  // Exit process to allow process manager (PM2, Docker, etc.) to restart
  process.exit(-1);
});

/**
 * Query Execution Helper Function
 * 
 * Wraps pool.query() with logging and error handling.
 * Logs query execution time and row count for performance monitoring.
 * 
 * @param text - SQL query string (can use $1, $2, etc. for parameters)
 * @param params - Optional array of parameter values for parameterized queries
 * @returns Promise resolving to query result
 * @throws Error if query execution fails
 * 
 * Example usage:
 * await query('SELECT * FROM users WHERE id = $1', [userId])
 */
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    // Execute parameterized query (prevents SQL injection)
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Log query performance metrics for monitoring
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    // Log query errors for debugging
    console.error("Query error", { text, error });
    throw error;
  }
};

