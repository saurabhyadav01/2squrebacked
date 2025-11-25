import { query } from "../config/database";
import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  slug: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const categoryService = {
  async create(data: z.infer<typeof createCategorySchema>) {
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-");
    
    const result = await query(
      `INSERT INTO categories (name, description, slug, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.name,
        data.description || null,
        slug,
        data.imageUrl || null,
        data.isActive,
      ]
    );

    return result.rows[0];
  },

  async getAll() {
    const result = await query(
      "SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON p.category = c.name WHERE c.is_active = true GROUP BY c.id ORDER BY c.name"
    );
    return result.rows.map((row) => ({
      ...row,
      product_count: parseInt(row.product_count || "0"),
    }));
  },

  async getById(id: string): Promise<Category | null> {
    const result = await query("SELECT * FROM categories WHERE id = $1", [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  },

  async update(id: string, data: z.infer<typeof updateCategorySchema>) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.slug !== undefined) {
      updates.push(`slug = $${paramCount++}`);
      values.push(data.slug);
    }
    if (data.imageUrl !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(data.imageUrl);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    const result = await query(
      `UPDATE categories SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async delete(id: string) {
    await query("DELETE FROM categories WHERE id = $1", [id]);
    return { message: "Category deleted successfully" };
  },
};

