import Stripe from "stripe";
import { query } from "../config/database";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export const createPaymentIntentSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("usd"),
  paymentMethod: z.string().default("card"),
});

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_intent_id: string | null;
  status: string;
  transaction_id: string | null;
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

export const paymentService = {
  // Create payment intent with Stripe
  async createPaymentIntent(data: z.infer<typeof createPaymentIntentSchema>) {
    const { orderId, amount, currency, paymentMethod } = data;

    // Verify order exists
    const orderResult = await query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderResult.rows.length === 0) {
      throw new Error("Order not found");
    }

    const order = orderResult.rows[0];

    if (order.payment_status === "paid") {
      throw new Error("Order is already paid");
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method_types: [paymentMethod],
      metadata: {
        orderId: orderId,
      },
    });

    // Create payment record
    const paymentResult = await query(
      `INSERT INTO payments (
        order_id, amount, currency, payment_method, payment_intent_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [orderId, amount, currency, paymentMethod, paymentIntent.id, "pending"]
    );

    return {
      payment: paymentResult.rows[0],
      clientSecret: paymentIntent.client_secret,
    };
  },

  // Confirm payment
  async confirmPayment(paymentIntentId: string) {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Update payment record
    const paymentResult = await query(
      `UPDATE payments 
       SET status = $1, transaction_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE payment_intent_id = $3
       RETURNING *`,
      [
        paymentIntent.status === "succeeded" ? "succeeded" : "failed",
        paymentIntent.id,
        paymentIntentId,
      ]
    );

    if (paymentResult.rows.length === 0) {
      throw new Error("Payment record not found");
    }

    const payment = paymentResult.rows[0];

    // Update order payment status
    if (paymentIntent.status === "succeeded") {
      await query(
        "UPDATE orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [payment.order_id]
      );
    } else if ((paymentIntent.status as string) === "payment_failed") {
      await query(
        "UPDATE orders SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [payment.order_id]
      );
    }

    return payment;
  },

  // Get payment by ID
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    const result = await query("SELECT * FROM payments WHERE id = $1", [paymentId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  },

  // Get payments by order ID
  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    const result = await query(
      "SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC",
      [orderId]
    );
    return result.rows;
  },

  // Refund payment
  async refundPayment(paymentId: string) {
    const paymentResult = await query("SELECT * FROM payments WHERE id = $1", [paymentId]);
    if (paymentResult.rows.length === 0) {
      throw new Error("Payment not found");
    }

    const payment = paymentResult.rows[0];

    if (!payment.payment_intent_id) {
      throw new Error("Payment intent ID not found");
    }

    if (payment.status !== "succeeded") {
      throw new Error("Only succeeded payments can be refunded");
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.payment_intent_id,
    });

    // Update payment status
    await query(
      `UPDATE payments 
       SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [paymentId]
    );

    // Update order payment status
    await query(
      "UPDATE orders SET payment_status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [payment.order_id]
    );

    return { message: "Payment refunded successfully", refundId: refund.id };
  },
};

