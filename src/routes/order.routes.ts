import { Router, Response } from "express";
import { orderService, createOrderSchema } from "../services/order.service";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { apiLimiter, adminLimiter } from "../middleware/rateLimit";
import { cacheMiddleware, clearCache } from "../middleware/cache";

const router = Router();

// All order routes require authentication
router.use(authenticate);

// Create order from cart
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createOrderSchema.parse({
      ...req.body,
      userId: req.user!.id,
    });
    const order = await orderService.createOrderFromCart(validatedData);
    // Clear order list cache for this user
    clearCache("/api/orders");
    res.status(201).json(order);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Get user orders (or all orders if admin) - cached for 1 minute
router.get("/", cacheMiddleware(60), async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role === "admin") {
      const orders = await orderService.getAllOrders();
      res.json(orders);
    } else {
      const orders = await orderService.getUserOrders(req.user!.id);
      res.json(orders);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status (admin only)
router.put("/:id/status", authorize("admin"), adminLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    const order = await orderService.updateOrderStatus(req.params.id, status);
    // Clear order cache
    clearCache(`/api/orders/${req.params.id}`);
    clearCache("/api/orders");
    res.json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get order by ID - cached for 2 minutes
router.get("/:id", cacheMiddleware(120), async (req: AuthRequest, res: Response) => {
  try {
    // Admin can view any order, users can only view their own
    const userId = req.user!.role === "admin" ? undefined : req.user!.id;
    const order = await orderService.getOrderById(req.params.id, userId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const items = await orderService.getOrderItems(order.id);
    res.json({ ...order, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

