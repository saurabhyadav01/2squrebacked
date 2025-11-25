import { query } from "../config/database";
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().positive().optional(),
  sku: z.string().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock_quantity: number;
  image_url: string | null;
  images: string[] | null;
  category: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const productService = {
  // Create a new product
  async create(data: z.infer<typeof createProductSchema>) {
    const result = await query(
      `INSERT INTO products (
        name, description, price, compare_at_price, sku, stock_quantity,
        image_url, images, category, tags, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.name,
        data.description || null,
        data.price,
        data.compareAtPrice || null,
        data.sku || null,
        data.stockQuantity,
        data.imageUrl || null,
        data.images || null,
        data.category || null,
        data.tags || null,
        data.isActive,
      ]
    );

    return result.rows[0];
  },

  // Get all products with optional filters
  async getAll(filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    let sql = "SELECT * FROM products WHERE 1=1";
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.category) {
      sql += ` AND category = $${paramCount++}`;
      params.push(filters.category);
    }

    if (filters?.isActive !== undefined) {
      sql += ` AND is_active = $${paramCount++}`;
      params.push(filters.isActive);
    }

    if (filters?.search) {
      sql += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    sql += " ORDER BY created_at DESC";

    if (filters?.limit) {
      sql += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    if (filters?.offset) {
      sql += ` OFFSET $${paramCount++}`;
      params.push(filters.offset);
    }

    const result = await query(sql, params);
    return result.rows;
  },

  // Get product by ID
  async getById(id: string): Promise<Product | null> {
    const result = await query("SELECT * FROM products WHERE id = $1", [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  },

  // Update product
  async update(id: string, data: z.infer<typeof updateProductSchema>) {
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
    if (data.price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(data.price);
    }
    if (data.compareAtPrice !== undefined) {
      updates.push(`compare_at_price = $${paramCount++}`);
      values.push(data.compareAtPrice);
    }
    if (data.sku !== undefined) {
      updates.push(`sku = $${paramCount++}`);
      values.push(data.sku);
    }
    if (data.stockQuantity !== undefined) {
      updates.push(`stock_quantity = $${paramCount++}`);
      values.push(data.stockQuantity);
    }
    if (data.imageUrl !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(data.imageUrl);
    }
    if (data.images !== undefined) {
      updates.push(`images = $${paramCount++}`);
      values.push(data.images);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(data.category);
    }
    if (data.tags !== undefined) {
      updates.push(`tags = $${paramCount++}`);
      values.push(data.tags);
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
      `UPDATE products SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  },

  // Delete product
  async delete(id: string) {
    await query("DELETE FROM products WHERE id = $1", [id]);
    return { message: "Product deleted successfully" };
  },
};

