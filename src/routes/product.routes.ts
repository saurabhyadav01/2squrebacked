import { Router, Request, Response } from "express";
import { productService, createProductSchema, updateProductSchema } from "../services/product.service";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { productListLimiter } from "../middleware/rateLimit";
import { cacheMiddleware, clearCache } from "../middleware/cache";

const router = Router();

// Get all products (public) - cached for 5 minutes
router.get("/", productListLimiter, cacheMiddleware(300), async (req: Request, res: Response) => {
  try {
    const filters = {
      category: req.query.category as string | undefined,
      isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const products = await productService.getAll(filters);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID (public) - cached for 10 minutes
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

// Create product (admin only)
router.post("/", authenticate, authorize("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createProductSchema.parse(req.body);
    const product = await productService.create(validatedData);
    // Clear product list cache
    clearCache("/api/products");
    res.status(201).json(product);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Update product (admin only)
router.put("/:id", authenticate, authorize("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = updateProductSchema.parse(req.body);
    const product = await productService.update(req.params.id, validatedData);
    // Clear cache for this product and product list
    clearCache(`/api/products/${req.params.id}`);
    clearCache("/api/products");
    res.json(product);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete product (admin only)
router.delete("/:id", authenticate, authorize("admin"), async (req: AuthRequest, res: Response) => {
  try {
    await productService.delete(req.params.id);
    // Clear cache for this product and product list
    clearCache(`/api/products/${req.params.id}`);
    clearCache("/api/products");
    res.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

