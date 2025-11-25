# 2Square Backend API Endpoints

Complete list of all API endpoints for the e-commerce platform.

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

---

## Authentication Endpoints

### POST `/api/auth/register`
Register a new user
- **Body**: `{ email, password, firstName?, lastName?, phone? }`
- **Response**: `{ user, token }`

### POST `/api/auth/login`
Login user
- **Body**: `{ email, password }`
- **Response**: `{ user, token }`

### GET `/api/auth/me`
Get current user (requires auth)
- **Response**: `{ id, email, firstName, lastName, phone, role }`

### PUT `/api/auth/profile`
Update user profile (requires auth)
- **Body**: `{ firstName?, lastName?, phone? }`

---

## Product Endpoints

### GET `/api/products`
Get all products (public)
- **Query params**: `category?, isActive?, search?, limit?, offset?`
- **Response**: `Product[]`

### GET `/api/products/:id`
Get product by ID (public)
- **Response**: `Product`

### POST `/api/products`
Create product (admin only)
- **Body**: `{ name, description?, price, compareAtPrice?, sku?, stockQuantity?, imageUrl?, images?, category?, tags?, isActive? }`

### PUT `/api/products/:id`
Update product (admin only)
- **Body**: Same as create (all fields optional)

### DELETE `/api/products/:id`
Delete product (admin only)

---

## Category Endpoints

### GET `/api/categories`
Get all categories (public)
- **Response**: `Category[]` (with product_count)

### GET `/api/categories/:id`
Get category by ID (public)
- **Response**: `Category`

### POST `/api/categories`
Create category (admin only)
- **Body**: `{ name, description?, slug?, imageUrl?, isActive? }`

### PUT `/api/categories/:id`
Update category (admin only)
- **Body**: Same as create (all fields optional)

### DELETE `/api/categories/:id`
Delete category (admin only)

---

## Cart Endpoints (All require auth)

### GET `/api/cart`
Get user's cart
- **Response**: `{ items: CartItem[], total: number }`

### POST `/api/cart/items`
Add item to cart
- **Body**: `{ productId, quantity }`

### PUT `/api/cart/items/:id`
Update cart item quantity
- **Body**: `{ quantity }`

### DELETE `/api/cart/items/:id`
Remove item from cart

### DELETE `/api/cart`
Clear entire cart

---

## Order Endpoints (All require auth)

### POST `/api/orders`
Create order from cart
- **Body**: `{ shippingAddress, billingAddress?, paymentMethod? }`
- **Response**: `Order`

### GET `/api/orders`
Get user's orders
- **Response**: `Order[]`

### GET `/api/orders/:id`
Get order by ID (user's own orders, or admin can view any)
- **Response**: `Order` (with items)

### GET `/api/orders/admin/all`
Get all orders (admin only)
- **Response**: `Order[]`

### PUT `/api/orders/:id/status`
Update order status (admin only)
- **Body**: `{ status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' }`

---

## Payment Endpoints (All require auth)

### POST `/api/payments/intent`
Create payment intent
- **Body**: `{ orderId, amount, currency?, paymentMethod? }`
- **Response**: `{ payment, clientSecret }`

### POST `/api/payments/confirm`
Confirm payment
- **Body**: `{ paymentIntentId }`
- **Response**: `Payment`

### GET `/api/payments/:id`
Get payment by ID
- **Response**: `Payment`

### GET `/api/payments/order/:orderId`
Get payments by order ID
- **Response**: `Payment[]`

### POST `/api/payments/:id/refund`
Refund payment
- **Response**: `{ message, refundId }`

### GET `/api/admin/payments`
Get all payments (admin only)
- **Response**: `Payment[]`

---

## Coupon Endpoints

### POST `/api/coupons/validate`
Validate coupon code (public)
- **Body**: `{ code, orderAmount }`
- **Response**: `{ valid: boolean, discount: number, message? }`

### GET `/api/coupons`
Get all coupons (admin only)
- **Response**: `Coupon[]`

### GET `/api/coupons/:id`
Get coupon by ID (admin only)
- **Response**: `Coupon`

### POST `/api/coupons`
Create coupon (admin only)
- **Body**: `{ code, discountType, discountValue, minPurchaseAmount?, maxDiscountAmount?, usageLimit?, validFrom, validUntil, isActive? }`

### PUT `/api/coupons/:id`
Update coupon (admin only)
- **Body**: Same as create (all fields optional)

### DELETE `/api/coupons/:id`
Delete coupon (admin only)

---

## User Management Endpoints (Admin only)

### GET `/api/users`
Get all users
- **Response**: `User[]`

### GET `/api/users/:id`
Get user by ID
- **Response**: `User`

### PUT `/api/users/:id`
Update user
- **Body**: `{ role?, isActive? }`

### DELETE `/api/users/:id`
Delete user

---

## Analytics Endpoints (Admin only)

### GET `/api/analytics/dashboard`
Get dashboard statistics
- **Response**: `{ totalRevenue, totalOrders, totalProducts, totalUsers, pendingOrders, lowStockProducts, averageOrderValue, ordersByStatus, recentOrders, topProducts }`

### GET `/api/analytics/revenue`
Get revenue by period
- **Query params**: `startDate?, endDate?`
- **Response**: Revenue data by month

### GET `/api/analytics/sales`
Get sales report
- **Query params**: `startDate?, endDate?`
- **Response**: Sales data by date

---

## Settings Endpoints (Admin only)

### GET `/api/settings`
Get all settings
- **Response**: `Setting[]`

### GET `/api/settings/:key`
Get setting by key
- **Response**: `{ key, value }`

### PUT `/api/settings/:key`
Set/Update setting
- **Body**: `{ value, description? }`

### DELETE `/api/settings/:key`
Delete setting

---

## Error Responses

All endpoints may return error responses in the following format:
```json
{
  "error": "Error message",
  "details": [] // Optional, for validation errors
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

