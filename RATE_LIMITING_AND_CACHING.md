# Rate Limiting & Caching Implementation

## Overview
This backend implements comprehensive rate limiting and caching to improve performance, prevent abuse, and reduce database load.

## Rate Limiting

### Global Rate Limiter
- **Applied to**: All `/api/*` routes
- **Limit**: 100 requests per 15 minutes per IP
- **Purpose**: General API protection

### Authentication Rate Limiter
- **Applied to**: `/api/auth/register`, `/api/auth/login`
- **Limit**: 5 requests per 15 minutes per IP
- **Purpose**: Prevent brute force attacks
- **Feature**: Skips successful requests (only counts failures)

### Payment Rate Limiter
- **Applied to**: All `/api/payments/*` routes
- **Limit**: 10 requests per 15 minutes per IP
- **Purpose**: Prevent payment abuse

### Admin Rate Limiter
- **Applied to**: Admin-only routes (analytics, coupons, etc.)
- **Limit**: 200 requests per 15 minutes per IP
- **Purpose**: Allow higher throughput for admin operations

### Product List Rate Limiter
- **Applied to**: Product and category listing routes
- **Limit**: 200 requests per 15 minutes per IP
- **Purpose**: Allow browsing while preventing abuse

## Caching

### Cache Strategy
- **Library**: `node-cache`
- **Default TTL**: 5 minutes (300 seconds)
- **Cache Check Period**: 60 seconds

### Cached Endpoints

#### Products
- `GET /api/products` - 5 minutes cache
- `GET /api/products/:id` - 10 minutes cache

#### Categories
- `GET /api/categories` - 10 minutes cache
- `GET /api/categories/:id` - 10 minutes cache

#### Analytics (Admin Only)
- `GET /api/analytics/dashboard` - 2 minutes cache
- `GET /api/analytics/revenue` - 5 minutes cache
- `GET /api/analytics/sales` - 5 minutes cache

#### Orders
- `GET /api/orders` - 1 minute cache
- `GET /api/orders/:id` - 2 minutes cache

#### Coupons (Admin Only)
- `GET /api/coupons` - 5 minutes cache
- `GET /api/coupons/:id` - 5 minutes cache

#### Auth
- `GET /api/auth/me` - 2 minutes cache

### Cache Invalidation
Cache is automatically cleared when:
- Products are created, updated, or deleted
- Categories are created, updated, or deleted
- Coupons are created, updated, or deleted
- Orders are created or status is updated

### Cache Headers
Responses include cache status headers:
- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response fetched from database

## Rate Limit Headers
Responses include rate limit information in standard headers:
- `RateLimit-Limit` - Maximum requests allowed
- `RateLimit-Remaining` - Remaining requests in window
- `RateLimit-Reset` - Time when limit resets

## Configuration

### Environment Variables
Rate limiting and caching can be configured via environment variables (optional):
```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Caching
CACHE_TTL=300  # 5 minutes
```

### Adjusting Limits
Edit `src/middleware/rateLimit.ts` to adjust limits for specific routes.

### Adjusting Cache TTL
Edit individual route files to change cache duration:
```typescript
cacheMiddleware(600) // 10 minutes
cacheMiddleware(120) // 2 minutes
```

## Benefits

1. **Performance**: Cached responses reduce database queries
2. **Security**: Rate limiting prevents brute force and DDoS attacks
3. **Cost**: Reduced database load lowers infrastructure costs
4. **User Experience**: Faster response times for cached data
5. **Scalability**: Better handling of traffic spikes

## Monitoring

### Cache Statistics
Access cache statistics programmatically:
```typescript
import { getCacheStats } from "./middleware/cache";
const stats = getCacheStats();
```

### Rate Limit Monitoring
Monitor rate limit hits via response headers and logs.

## Best Practices

1. **Cache Duration**: 
   - Static data (categories): 10 minutes
   - Dynamic data (orders): 1-2 minutes
   - User-specific data: 2 minutes

2. **Rate Limits**:
   - Stricter for authentication (5 req/15min)
   - Moderate for payments (10 req/15min)
   - Lenient for browsing (200 req/15min)

3. **Cache Invalidation**:
   - Always clear related caches on mutations
   - Use pattern matching for bulk invalidation

4. **Production Considerations**:
   - Consider Redis for distributed caching
   - Use Redis for rate limiting in multi-server setups
   - Monitor cache hit rates
   - Adjust TTLs based on data update frequency

