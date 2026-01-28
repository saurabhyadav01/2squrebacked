import { readFileSync } from "fs";
import { join } from "path";
import { query, pool } from "../config/database";

export async function initializeDatabase() {
  try {
    console.log("📦 Initializing database...");

    // Read schema file
    const schemaPath = join(__dirname, "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    // Execute schema - wrap in try-catch to handle existing objects gracefully
    try {
      await pool.query(schema);
      console.log("✅ Database initialized successfully");
    } catch (error: any) {
      // Check if it's just objects that already exist
      if (
        error.code === "42P07" || // relation already exists
        error.code === "42710" || // duplicate object (trigger, index, etc.)
        error.code === "42723" || // function already exists
        error.message.includes("already exists")
      ) {
        console.log("ℹ️  Some database objects already exist, continuing...");
      } else {
        // For other errors, try to continue - tables might already be created
        console.log("⚠️  Some errors occurred, but continuing to verify tables...");
      }
    }

    // Verify users table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log("✅ Users table exists and is ready");
    } else {
      console.log("❌ Users table does not exist - please check database connection");
      throw new Error("Users table was not created");
    }
  } catch (error: any) {
    console.error("❌ Error initializing database:", error.message);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log("Database setup complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Database setup failed:", error);
      process.exit(1);
    });
}

