import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Connect to PostgreSQL default database to create our database
const adminPool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: "postgres", // Connect to default postgres database
  password: process.env.DB_PASSWORD || "postgres",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function createDatabase() {
  const dbName = process.env.DB_NAME || "2square_db";

  try {
    console.log(`📦 Creating database "${dbName}"...`);

    // Check if database already exists
    const checkResult = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (checkResult.rows.length > 0) {
      console.log(`ℹ️  Database "${dbName}" already exists`);
      await adminPool.end();
      return;
    }

    // Create the database (quote the name to handle special characters and numbers)
    await adminPool.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✅ Database "${dbName}" created successfully!`);

    await adminPool.end();

    // Now initialize the schema
    console.log(`📦 Initializing database schema...`);
    const { initializeDatabase } = await import("./init");
    await initializeDatabase();
  } catch (error: any) {
    console.error(`❌ Error creating database:`, error.message);
    
    if (error.code === "3D000") {
      console.log("💡 Make sure PostgreSQL is running and you have permission to create databases");
    } else if (error.code === "28P01") {
      console.log("💡 Authentication failed. Check your DB_USER and DB_PASSWORD in .env file");
    } else if (error.code === "ECONNREFUSED") {
      console.log("💡 Could not connect to PostgreSQL. Make sure it's running on the specified host and port");
    }
    
    await adminPool.end();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  createDatabase()
    .then(() => {
      console.log("✅ Database setup complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Database setup failed:", error);
      process.exit(1);
    });
}

export { createDatabase };

