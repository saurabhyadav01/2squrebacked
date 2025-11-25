import { query } from "../config/database";
import { z } from "zod";

export const updateSettingsSchema = z.object({
  value: z.any(),
});

export interface Setting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export const settingsService = {
  async get(key: string): Promise<any> {
    const result = await query("SELECT * FROM settings WHERE key = $1", [key]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0].value;
  },

  async set(key: string, value: any, description?: string) {
    const existing = await query("SELECT id FROM settings WHERE key = $1", [key]);
    
    if (existing.rows.length > 0) {
      const result = await query(
        "UPDATE settings SET value = $1, description = COALESCE($2, description) WHERE key = $3 RETURNING *",
        [JSON.stringify(value), description, key]
      );
      return result.rows[0];
    } else {
      const result = await query(
        "INSERT INTO settings (key, value, description) VALUES ($1, $2, $3) RETURNING *",
        [key, JSON.stringify(value), description || null]
      );
      return result.rows[0];
    }
  },

  async getAll(): Promise<Setting[]> {
    const result = await query("SELECT * FROM settings ORDER BY key");
    return result.rows.map((row) => ({
      ...row,
      value: typeof row.value === "string" ? JSON.parse(row.value) : row.value,
    }));
  },

  async delete(key: string) {
    await query("DELETE FROM settings WHERE key = $1", [key]);
    return { message: "Setting deleted successfully" };
  },
};

