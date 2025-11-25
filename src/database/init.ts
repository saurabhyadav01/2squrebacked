import { readFileSync } from "fs";
import { join } from "path";
import { query, pool } from "../config/database";

export async function initializeDatabase() {
  try {
    console.log("📦 Initializing database...");

    // Read schema file
    const schemaPath = join(__dirname, "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    // Execute schema
    await pool.query(schema);

    console.log("✅ Database initialized successfully");
  } catch (error: any) {
    // If tables already exist, that's okay
    if (error.code === "42P07") {
      console.log("ℹ️  Database tables already exist");
    } else {
      console.error("❌ Error initializing database:", error.message);
      throw error;
    }
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

