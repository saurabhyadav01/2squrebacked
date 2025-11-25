import { Router, Response } from "express";
import { paymentService, createPaymentIntentSchema } from "../services/payment.service";
import { authenticate, AuthRequest } from "../middleware/auth";
import { paymentLimiter } from "../middleware/rateLimit";

const router = Router();

// All payment routes require authentication and rate limiting
router.use(authenticate);
router.use(paymentLimiter);

// Create payment intent
router.post("/intent", async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createPaymentIntentSchema.parse(req.body);
    const result = await paymentService.createPaymentIntent(validatedData);
    res.json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Confirm payment
router.post("/confirm", async (req: AuthRequest, res: Response) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment intent ID is required" });
    }

    const payment = await paymentService.confirmPayment(paymentIntentId);
    res.json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
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

// Refund payment
router.post("/:id/refund", async (req: AuthRequest, res: Response) => {
  try {
    const result = await paymentService.refundPayment(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

