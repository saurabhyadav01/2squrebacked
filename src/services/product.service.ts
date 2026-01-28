/**
 * Product Service
 * 
 * Contains all business logic for product management including CRUD operations,
 * filtering, searching, and inventory management. Handles database interactions
 * for the products table.
 */

import { query } from "../config/database";
import { z } from "zod";

/**
 * Zod validation schema for creating a new product
 * Ensures all required fields are present and valid
 */
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

/**
 * Zod validation schema for updating a product
 * All fields are optional (partial update)
 */
export const updateProductSchema = createProductSchema.partial();

/**
 * Product interface matching database schema
 * Represents a product record from the database
 */
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

/**
 * Product Service Object
 * Contains all product-related database operations
 */
export const productService = {
  /**
   * Create a new product
   * 
   * @param data - Validated product data from createProductSchema
   * @returns Created product object
   * 
   * Inserts a new product record into the database with all provided fields.
   * Handles optional fields by converting undefined to null for database compatibility.
   */
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

  /**
   * Get all products with optional filtering and pagination
   * 
   * @param filters - Optional filters for category, active status, search, limit, offset
   * @returns Array of product objects
   * 
   * Builds a dynamic SQL query based on provided filters:
   * - category: Exact match on category field
   * - isActive: Filter by active status
   * - search: Case-insensitive search in name and description (ILIKE)
   * - limit: Maximum number of results (pagination)
   * - offset: Skip N results (pagination)
   * 
   * Results are ordered by creation date (newest first).
   */
  async getAll(filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    // Start with base query (WHERE 1=1 allows easy addition of AND clauses)
    let sql = "SELECT * FROM products WHERE 1=1";
    const params: any[] = [];
    let paramCount = 1;

    // Add category filter if provided
    if (filters?.category) {
      sql += ` AND category = $${paramCount++}`;
      params.push(filters.category);
    }

    // Add active status filter if provided
    if (filters?.isActive !== undefined) {
      sql += ` AND is_active = $${paramCount++}`;
      params.push(filters.isActive);
    }

    // Add search filter (case-insensitive search in name and description)
    if (filters?.search) {
      sql += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`); // % wildcards for partial matching
      paramCount++;
    }

    // Order by creation date (newest first)
    sql += " ORDER BY created_at DESC";

    // Add pagination limit if provided
    if (filters?.limit) {
      sql += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    // Add pagination offset if provided
    if (filters?.offset) {
      sql += ` OFFSET $${paramCount++}`;
      params.push(filters.offset);
    }

    const result = await query(sql, params);
    return result.rows;
  },

  /**
   * Get a single product by ID
   * 
   * @param id - Product UUID
   * @returns Product object or null if not found
   */
  async getById(id: string): Promise<Product | null> {
    const result = await query("SELECT * FROM products WHERE id = $1", [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  },

  /**
   * Update an existing product
   * 
   * @param id - Product UUID to update
   * @param data - Partial product data (only provided fields will be updated)
   * @returns Updated product object
   * @throws Error if no fields provided to update
   * 
   * Dynamically builds UPDATE query based on provided fields.
   * Only updates fields that are explicitly provided (partial update).
   * This allows flexible updates without requiring all fields.
   */
  async update(id: string, data: z.infer<typeof updateProductSchema>) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic UPDATE clause for each provided field
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

    // Ensure at least one field is being updated
    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    // Add product ID as last parameter for WHERE clause
    values.push(id);

    // Execute dynamic UPDATE query
    const result = await query(
      `UPDATE products SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  },

  /**
   * Delete a product
   * 
   * @param id - Product UUID to delete
   * @returns Success message
   * 
   * Permanently removes product from database.
   * Note: Consider soft delete (is_active = false) instead for data retention.
   */
  async delete(id: string) {
    await query("DELETE FROM products WHERE id = $1", [id]);
    return { message: "Product deleted successfully" };
  },
};

