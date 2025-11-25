import { Router, Response } from "express";
import { cartService, addToCartSchema, updateCartItemSchema } from "../services/cart.service";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// All cart routes require authentication
router.use(authenticate);

// Get cart
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const cart = await cartService.getCart(req.user!.id);
    const total = await cartService.getCartTotal(req.user!.id);
    res.json({ items: cart, total });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add item to cart
router.post("/items", async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = addToCartSchema.parse(req.body);
    const item = await cartService.addItem(req.user!.id, validatedData);
    res.status(201).json(item);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Update cart item
router.put("/items/:id", async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = updateCartItemSchema.parse(req.body);
    const item = await cartService.updateItem(req.user!.id, req.params.id, validatedData);
    res.json(item);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Remove item from cart
router.delete("/items/:id", async (req: AuthRequest, res: Response) => {
  try {
    await cartService.removeItem(req.user!.id, req.params.id);
    res.json({ message: "Item removed from cart" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Clear cart
router.delete("/", async (req: AuthRequest, res: Response) => {
  try {
    await cartService.clearCart(req.user!.id);
    res.json({ message: "Cart cleared" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

