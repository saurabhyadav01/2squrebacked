# 2Square Backend API

Backend API server for the 2Square e-commerce platform with PostgreSQL database.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database:
```bash
# Create database
createdb 2square_db

# Or using psql
psql -U postgres
CREATE DATABASE 2square_db;
```

3. Copy the environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials and API keys:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=2square_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=your-stripe-key
```

5. Initialize the database schema:
```bash
npm run db:init
```

6. Run the development server:
```bash
npm run dev
```

7. The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)

### Products
- `GET /api/products` - Get all products (public)
- `GET /api/products/:id` - Get product by ID (public)
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Cart
- `GET /api/cart` - Get user's cart (requires auth)
- `POST /api/cart/items` - Add item to cart (requires auth)
- `PUT /api/cart/items/:id` - Update cart item (requires auth)
- `DELETE /api/cart/items/:id` - Remove item from cart (requires auth)
- `DELETE /api/cart` - Clear cart (requires auth)

### Orders
- `POST /api/orders` - Create order from cart (requires auth)
- `GET /api/orders` - Get user's orders (requires auth)
- `GET /api/orders/:id` - Get order by ID (requires auth)

### Payments
- `POST /api/payments/intent` - Create payment intent (requires auth)
- `POST /api/payments/confirm` - Confirm payment (requires auth)
- `GET /api/payments/:id` - Get payment by ID (requires auth)
- `GET /api/payments/order/:orderId` - Get payments by order (requires auth)
- `POST /api/payments/:id/refund` - Refund payment (requires auth)

## Database Schema

The database includes the following tables:
- `users` - User accounts and authentication
- `products` - Product catalog
- `cart` - Shopping cart items
- `orders` - Order records
- `order_items` - Order line items
- `payments` - Payment transactions

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:init` - Initialize database schema

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Validation**: Zod
- **Security**: Helmet, JWT
- **Payment**: Stripe
- **Password Hashing**: bcryptjs
- **Logging**: Morgan

## Environment Variables

See `.env.example` for all required environment variables.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

