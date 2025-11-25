import { Router, Request, Response } from "express";
import { couponService, createCouponSchema, updateCouponSchema } from "../services/coupon.service";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { adminLimiter, apiLimiter } from "../middleware/rateLimit";
import { cacheMiddleware, clearCache } from "../middleware/cache";

const router = Router();

// Get all coupons (admin only) - cached for 5 minutes
router.get("/", authenticate, authorize("admin"), adminLimiter, cacheMiddleware(300), async (req: AuthRequest, res: Response) => {
  try {
    const coupons = await couponService.getAll();
    res.json(coupons);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get coupon by ID (admin only) - cached for 5 minutes
router.get("/:id", authenticate, authorize("admin"), adminLimiter, cacheMiddleware(300), async (req: AuthRequest, res: Response) => {
  try {
    const coupon = await couponService.getById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }
    res.json(coupon);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Validate coupon (public) - rate limited
router.post("/validate", apiLimiter, async (req: Request, res: Response) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code || !orderAmount) {
      return res.status(400).json({ error: "Code and orderAmount are required" });
    }
    const validation = await couponService.validateCoupon(code, parseFloat(orderAmount));
    res.json(validation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create coupon (admin only)
router.post("/", authenticate, authorize("admin"), adminLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createCouponSchema.parse(req.body);
    const coupon = await couponService.create(validatedData);
    // Clear coupon cache
    clearCache("/api/coupons");
    res.status(201).json(coupon);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Update coupon (admin only)
router.put("/:id", authenticate, authorize("admin"), adminLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = updateCouponSchema.parse(req.body);
    const coupon = await couponService.update(req.params.id, validatedData);
    // Clear cache
    clearCache(`/api/coupons/${req.params.id}`);
    clearCache("/api/coupons");
    res.json(coupon);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete coupon (admin only)
router.delete("/:id", authenticate, authorize("admin"), adminLimiter, async (req: AuthRequest, res: Response) => {
  try {
    await couponService.delete(req.params.id);
    // Clear cache
    clearCache(`/api/coupons/${req.params.id}`);
    clearCache("/api/coupons");
    res.json({ message: "Coupon deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

