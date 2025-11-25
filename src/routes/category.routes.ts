import { Router, Request, Response } from "express";
import { categoryService, createCategorySchema, updateCategorySchema } from "../services/category.service";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { productListLimiter } from "../middleware/rateLimit";
import { cacheMiddleware, clearCache } from "../middleware/cache";

const router = Router();

// Get all categories (public) - cached for 10 minutes
router.get("/", productListLimiter, cacheMiddleware(600), async (req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAll();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get category by ID (public) - cached for 10 minutes
router.get("/:id", productListLimiter, cacheMiddleware(600), async (req: Request, res: Response) => {
  try {
    const category = await categoryService.getById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create category (admin only)
router.post("/", authenticate, authorize("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createCategorySchema.parse(req.body);
    const category = await categoryService.create(validatedData);
    // Clear category cache
    clearCache("/api/categories");
    res.status(201).json(category);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Update category (admin only)
router.put("/:id", authenticate, authorize("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = updateCategorySchema.parse(req.body);
    const category = await categoryService.update(req.params.id, validatedData);
    // Clear cache
    clearCache(`/api/categories/${req.params.id}`);
    clearCache("/api/categories");
    res.json(category);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete category (admin only)
router.delete("/:id", authenticate, authorize("admin"), async (req: AuthRequest, res: Response) => {
  try {
    await categoryService.delete(req.params.id);
    // Clear cache
    clearCache(`/api/categories/${req.params.id}`);
    clearCache("/api/categories");
    res.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

