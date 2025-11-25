import { pool } from "../config/database";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

async function seedAdmin() {
  try {
    console.log("📦 Creating admin user...");

    const email = "admin@2square.com";
    const password = "admin";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const checkResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (checkResult.rows.length > 0) {
      console.log("ℹ️  Admin user already exists");
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      await pool.end();
      return;
    }

    // Insert admin user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role`,
      [email, hashedPassword, "Admin", "User", "admin", true]
    );

    console.log("✅ Admin user created successfully!");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: admin`);
    console.log(`   User ID: ${result.rows[0].id}`);

    await pool.end();
  } catch (error: any) {
    console.error("❌ Error creating admin user:", error.message);
    await pool.end();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log("✅ Admin seeding complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Admin seeding failed:", error);
      process.exit(1);
    });
}

export { seedAdmin };

