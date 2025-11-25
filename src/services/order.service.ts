import { query } from "../config/database";
import { z } from "zod";

export const createOrderSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  billingAddress: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      country: z.string(),
    })
    .optional(),
  paymentMethod: z.string().default("card"),
});

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  shipping_address: any;
  billing_address: any;
  payment_status: string;
  payment_method: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: Date;
  product?: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

export const orderService = {
  // Create order from cart
  async createOrderFromCart(data: z.infer<typeof createOrderSchema>) {
    const { userId, shippingAddress, billingAddress, paymentMethod } = data;

    // Get cart items
    const cartResult = await query(
      `SELECT c.*, p.price, p.stock_quantity, p.name
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      throw new Error("Cart is empty");
    }

    // Calculate total
    let totalAmount = 0;
    const orderItems: Array<{ productId: string; quantity: number; price: number }> = [];

    for (const item of cartResult.rows) {
      if (item.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }

      const itemTotal = parseFloat(item.price) * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.product_id,
        quantity: item.quantity,
        price: parseFloat(item.price),
      });
    }

    // Create order
    const orderResult = await query(
      `INSERT INTO orders (
        user_id, total_amount, shipping_address, billing_address, payment_method, status, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        userId,
        totalAmount,
        JSON.stringify(shippingAddress),
        JSON.stringify(billingAddress || shippingAddress),
        paymentMethod,
        "pending",
        "pending",
      ]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of orderItems) {
      await query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [order.id, item.productId, item.quantity, item.price]
      );

      // Update product stock
      await query("UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2", [
        item.quantity,
        item.productId,
      ]);
    }

    // Clear cart
    await query("DELETE FROM cart WHERE user_id = $1", [userId]);

    return order;
  },

  // Get order by ID
  async getOrderById(orderId: string, userId?: string): Promise<Order | null> {
    let sql = "SELECT * FROM orders WHERE id = $1";
    const params: any[] = [orderId];

    if (userId) {
      sql += " AND user_id = $2";
      params.push(userId);
    }

    const result = await query(sql, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  },

  // Get order items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const result = await query(
      `SELECT 
        oi.*,
        p.id as product_id_full, p.name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at`,
      [orderId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      order_id: row.order_id,
      product_id: row.product_id,
      quantity: row.quantity,
      price: parseFloat(row.price),
      created_at: row.created_at,
      product: {
        id: row.product_id_full,
        name: row.name,
        image_url: row.image_url,
      },
    }));
  },

  // Get user orders
  async getUserOrders(userId: string): Promise<Order[]> {
    const result = await query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows;
  },

  // Get all orders (admin only)
  async getAllOrders(): Promise<Order[]> {
    const result = await query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );
    return result.rows;
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: string) {
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid order status");
    }

    const result = await query(
      "UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, orderId]
    );

    return result.rows[0];
  },
};

