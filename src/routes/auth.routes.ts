import { Router, Request, Response } from "express";
import { authService, registerSchema, loginSchema } from "../services/auth.service";
import { authenticate, AuthRequest } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";

const router = Router();

// Register - strict rate limiting
router.post("/register", authLimiter, async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.register(validatedData);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Login - strict rate limiting
router.post("/login", authLimiter, async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData);
    res.json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(401).json({ error: error.message });
  }
});

// Get current user - cached for 2 minutes
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put("/profile", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await authService.updateProfile(req.user!.id, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

