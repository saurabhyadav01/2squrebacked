import { query } from "../config/database";
import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive("Quantity must be positive"),
});

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: Date;
  updated_at: Date;
  // Joined product data
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    stock_quantity: number;
  };
}

export const cartService = {
  // Add item to cart
  async addItem(userId: string, data: z.infer<typeof addToCartSchema>) {
    const { productId, quantity } = data;

    // Check if product exists and is available
    const productResult = await query(
      "SELECT id, name, price, image_url, stock_quantity, is_active FROM products WHERE id = $1",
      [productId]
    );

    if (productResult.rows.length === 0) {
      throw new Error("Product not found");
    }

    const product = productResult.rows[0];

    if (!product.is_active) {
      throw new Error("Product is not available");
    }

    if (product.stock_quantity < quantity) {
      throw new Error("Insufficient stock");
    }

    // Check if item already exists in cart
    const existingItem = await query(
      "SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2",
      [userId, productId]
    );

    if (existingItem.rows.length > 0) {
      // Update quantity
      const newQuantity = existingItem.rows[0].quantity + quantity;
      if (product.stock_quantity < newQuantity) {
        throw new Error("Insufficient stock");
      }

      const result = await query(
        "UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *",
        [newQuantity, userId, productId]
      );

      return result.rows[0];
    } else {
      // Insert new item
      const result = await query(
        "INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
        [userId, productId, quantity]
      );

      return result.rows[0];
    }
  },

  // Get user's cart with product details
  async getCart(userId: string): Promise<CartItem[]> {
    const result = await query(
      `SELECT 
        c.id, c.user_id, c.product_id, c.quantity, c.created_at, c.updated_at,
        p.id as product_id_full, p.name, p.price, p.image_url, p.stock_quantity
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      quantity: row.quantity,
      created_at: row.created_at,
      updated_at: row.updated_at,
      product: {
        id: row.product_id_full,
        name: row.name,
        price: parseFloat(row.price),
        image_url: row.image_url,
        stock_quantity: row.stock_quantity,
      },
    }));
  },

  // Update cart item quantity
  async updateItem(userId: string, cartItemId: string, data: z.infer<typeof updateCartItemSchema>) {
    // Get cart item with product info
    const cartItem = await query(
      `SELECT c.*, p.stock_quantity, p.is_active
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [cartItemId, userId]
    );

    if (cartItem.rows.length === 0) {
      throw new Error("Cart item not found");
    }

    const item = cartItem.rows[0];

    if (!item.is_active) {
      throw new Error("Product is not available");
    }

    if (item.stock_quantity < data.quantity) {
      throw new Error("Insufficient stock");
    }

    const result = await query(
      "UPDATE cart SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [data.quantity, cartItemId, userId]
    );

    return result.rows[0];
  },

  // Remove item from cart
  async removeItem(userId: string, cartItemId: string) {
    const result = await query(
      "DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING *",
      [cartItemId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error("Cart item not found");
    }

    return { message: "Item removed from cart" };
  },

  // Clear user's cart
  async clearCart(userId: string) {
    await query("DELETE FROM cart WHERE user_id = $1", [userId]);
    return { message: "Cart cleared" };
  },

  // Get cart total
  async getCartTotal(userId: string): Promise<number> {
    const result = await query(
      `SELECT SUM(c.quantity * p.price) as total
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [userId]
    );

    return parseFloat(result.rows[0]?.total || "0");
  },
};

