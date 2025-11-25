import { Router, Response } from "express";
import { userService } from "../services/user.service";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// All user routes require admin authentication
router.use(authenticate);
router.use(authorize("admin"));

// Get all users
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.update(req.params.id, req.body);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    await userService.delete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

