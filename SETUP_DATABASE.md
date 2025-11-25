# Database Setup Guide

## Prerequisites
- PostgreSQL installed and running
- Access to PostgreSQL command line (psql) or pgAdmin

## Step 1: Create the Database

### Option A: Using psql (Command Line)
```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE 2square_db;

# Exit psql
\q
```

### Option B: Using SQL Command
```bash
psql -U postgres -c "CREATE DATABASE 2square_db;"
```

### Option C: Using pgAdmin
1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" > "Database"
4. Name: `2square_db`
5. Click "Save"

## Step 2: Configure Environment Variables

Create a `.env` file in the `2squrebacked` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=2square_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Stripe Configuration (optional, for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Step 3: Initialize Database Schema

Run the database initialization script:

```bash
npm run db:init
```

This will:
- Create all necessary tables
- Set up indexes
- Create triggers for `updated_at` timestamps

## Step 4: Verify Setup

Start the backend server:

```bash
npm run dev
```

You should see:
```
✅ Database connection successful
🚀 2Square Backend server is running on port 5000
```

## Troubleshooting

### Database connection failed
- Check if PostgreSQL is running: `pg_isready` or check services
- Verify database credentials in `.env`
- Ensure the database exists: `psql -U postgres -l` (lists all databases)

### Permission errors
- Make sure the database user has CREATE privileges
- Check PostgreSQL authentication settings in `pg_hba.conf`

### Port already in use
- Change PORT in `.env` to a different port (e.g., 5001)
- Or stop the process using port 5000

