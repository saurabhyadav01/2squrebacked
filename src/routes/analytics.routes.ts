import { Router, Response } from "express";
import { analyticsService } from "../services/analytics.service";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { adminLimiter } from "../middleware/rateLimit";
import { cacheMiddleware } from "../middleware/cache";

const router = Router();

// All analytics routes require admin authentication
router.use(authenticate);
router.use(authorize("admin"));
router.use(adminLimiter);

// Get dashboard stats - cached for 2 minutes
router.get("/dashboard", cacheMiddleware(120), async (req: AuthRequest, res: Response) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get revenue by period - cached for 5 minutes
router.get("/revenue", cacheMiddleware(300), async (req: AuthRequest, res: Response) => {
  try {
    const startDate = req.query.startDate as string || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate as string || new Date().toISOString();
    const revenue = await analyticsService.getRevenueByPeriod(startDate, endDate);
    res.json(revenue);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get sales report - cached for 5 minutes
router.get("/sales", cacheMiddleware(300), async (req: AuthRequest, res: Response) => {
  try {
    const startDate = req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate as string || new Date().toISOString();
    const report = await analyticsService.getSalesReport(startDate, endDate);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

