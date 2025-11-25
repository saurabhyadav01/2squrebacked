# Database Setup

## Initial Setup

1. Make sure PostgreSQL is installed and running on your system.

2. Create the database:
```bash
createdb 2square_db
```

Or using psql:
```sql
CREATE DATABASE 2square_db;
```

3. Update your `.env` file with database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=2square_db
DB_USER=postgres
DB_PASSWORD=your_password
```

4. Initialize the database schema:
```bash
npm run db:init
```

This will create all necessary tables, indexes, and triggers.

## Schema Overview

### Tables

- **users** - User accounts with authentication
- **products** - Product catalog
- **cart** - Shopping cart items (linked to users)
- **orders** - Order records
- **order_items** - Order line items
- **payments** - Payment transactions

### Features

- UUID primary keys for all tables
- Automatic `updated_at` timestamp triggers
- Foreign key constraints for data integrity
- Indexes for performance optimization
- Check constraints for data validation

## Manual Setup

If you prefer to set up manually, you can run the SQL file directly:

```bash
psql -U postgres -d 2square_db -f src/database/schema.sql
```

## Resetting Database

To reset the database (⚠️ This will delete all data):

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Then run `npm run db:init` again.

