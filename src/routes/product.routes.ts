/**
 * Product Routes
 * 
 * Handles all product-related HTTP endpoints including listing, viewing,
 * creating, updating, and deleting products. Public endpoints are cached
 * for performance, while admin endpoints require authentication and authorization.
 */

import { Router, Request, Response } from "express";
import { productService, createProductSchema, updateProductSchema } from "../services/product.service";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { productListLimiter } from "../middleware/rateLimit";
import { cacheMiddleware, clearCache } from "../middleware/cache";

const router = Router();

/**
 * GET /api/products
 * Get all products with optional filtering
 * 
 * Public endpoint - no authentication required.
 * Supports query parameters for filtering:
 * - category: Filter by product category
 * - isActive: Filter by active status (true/false)
 * - search: Search in product name and description
 * - limit: Maximum number of results
 * - offset: Pagination offset
 * 
 * Cached for 5 minutes to reduce database load for frequently accessed data.
 */
router.get("/", productListLimiter, cacheMiddleware(300), async (req: Request, res: Response) => {
  try {
    // Extract and parse query parameters for filtering
    const filters = {
      category: req.query.category as string | undefined,
      isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    // Fetch products with applied filters
    const products = await productService.getAll(filters);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/products/:id
 * Get a single product by ID
 * 
 * Public endpoint - no authentication required.
 * Returns full product details including description, images, pricing, etc.
 * 
 * Cached for 10 minutes since individual product data changes less frequently.
 */
router.get("/:id", productListLimiter, cacheMiddleware(600), async (req: Request, res: Response) => {
  try {
    const product = await productService.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/products
 * Create a new product
 * 
 * Admin-only endpoint - requires authentication and admin role.
 * Validates product data using Zod schema before creation.
 * Clears product list cache after creation to ensure fresh data.
 */
router.post("/", authenticate, authorize("admin"), async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body against schema
    const validatedData = createProductSchema.parse(req.body);
    // Create product in database
    const product = await productService.create(validatedData);
    // Clear cache to ensure new product appears in listings
    clearCache("/api/products");
    res.status(201).json(product);
  } catch (error: any) {
    // Handle validation errors
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/products/:id
 * Update an existing product
 * 
 * Admin-only endpoint - requires authentication and admin role.
 * Supports partial updates (only provided fields are updated).
 * Clears both individual product cache and product list cache.
 */
router.put("/:id", authenticate, authorize("admin"), async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body (all fields optional for partial updates)
    const validatedData = updateProductSchema.parse(req.body);
    // Update product in database
    const product = await productService.update(req.params.id, validatedData);
    // Clear caches to ensure updated data is served
    clearCache(`/api/products/${req.params.id}`);
    clearCache("/api/products");
    res.json(product);
  } catch (error: any) {
    // Handle validation errors
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/products/:id
 * Delete a product
 * 
 * Admin-only endpoint - requires authentication and admin role.
 * Permanently removes product from database.
 * Clears caches to remove deleted product from listings.
 */
router.delete("/:id", authenticate, authorize("admin"), async (req: AuthRequest, res: Response) => {
  try {
    // Delete product from database
    await productService.delete(req.params.id);
    // Clear caches to ensure deleted product no longer appears
    clearCache(`/api/products/${req.params.id}`);
    clearCache("/api/products");
    res.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

