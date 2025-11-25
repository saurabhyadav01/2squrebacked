import { Router, Response } from "express";
import { paymentService } from "../services/payment.service";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { query } from "../config/database";

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize("admin"));

// Get all payments
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM payments ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment by ID
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json(payment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments by order ID
router.get("/order/:orderId", async (req: AuthRequest, res: Response) => {
  try {
    const payments = await paymentService.getPaymentsByOrderId(req.params.orderId);
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

