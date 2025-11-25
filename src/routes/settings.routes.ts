import { Router, Response } from "express";
import { settingsService } from "../services/settings.service";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// All settings routes require admin authentication
router.use(authenticate);
router.use(authorize("admin"));

// Get all settings
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const settings = await settingsService.getAll();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get setting by key
router.get("/:key", async (req: AuthRequest, res: Response) => {
  try {
    const value = await settingsService.get(req.params.key);
    if (value === null) {
      return res.status(404).json({ error: "Setting not found" });
    }
    res.json({ key: req.params.key, value });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Set/Update setting
router.put("/:key", async (req: AuthRequest, res: Response) => {
  try {
    const { value, description } = req.body;
    if (value === undefined) {
      return res.status(400).json({ error: "Value is required" });
    }
    const setting = await settingsService.set(req.params.key, value, description);
    res.json(setting);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete setting
router.delete("/:key", async (req: AuthRequest, res: Response) => {
  try {
    await settingsService.delete(req.params.key);
    res.json({ message: "Setting deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

