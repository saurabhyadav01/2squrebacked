import { query } from "../config/database";
import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive("Discount value must be positive"),
  minPurchaseAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  isActive: z.boolean().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();

export interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: Date;
  valid_until: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const couponService = {
  async create(data: z.infer<typeof createCouponSchema>) {
    // Check if code already exists
    const existing = await query("SELECT id FROM coupons WHERE code = $1", [data.code]);
    if (existing.rows.length > 0) {
      throw new Error("Coupon code already exists");
    }

    const result = await query(
      `INSERT INTO coupons (
        code, discount_type, discount_value, min_purchase_amount, max_discount_amount,
        usage_limit, valid_from, valid_until, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.code.toUpperCase(),
        data.discountType,
        data.discountValue,
        data.minPurchaseAmount || 0,
        data.maxDiscountAmount || null,
        data.usageLimit || null,
        data.validFrom,
        data.validUntil,
        data.isActive,
      ]
    );

    return result.rows[0];
  },

  async getAll() {
    const result = await query(
      "SELECT * FROM coupons ORDER BY created_at DESC"
    );
    return result.rows;
  },

  async getById(id: string): Promise<Coupon | null> {
    const result = await query("SELECT * FROM coupons WHERE id = $1", [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  },

  async getByCode(code: string): Promise<Coupon | null> {
    const result = await query(
      "SELECT * FROM coupons WHERE code = $1 AND is_active = true",
      [code.toUpperCase()]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  },

  async validateCoupon(code: string, orderAmount: number): Promise<{ valid: boolean; discount: number; message?: string }> {
    const coupon = await this.getByCode(code);
    
    if (!coupon) {
      return { valid: false, discount: 0, message: "Invalid coupon code" };
    }

    const now = new Date();
    if (new Date(coupon.valid_from) > now || new Date(coupon.valid_until) < now) {
      return { valid: false, discount: 0, message: "Coupon has expired" };
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return { valid: false, discount: 0, message: "Coupon usage limit reached" };
    }

    if (orderAmount < coupon.min_purchase_amount) {
      return { valid: false, discount: 0, message: `Minimum purchase amount is $${coupon.min_purchase_amount}` };
    }

    let discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = (orderAmount * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }
    } else {
      discount = coupon.discount_value;
    }

    return { valid: true, discount };
  },

  async applyCoupon(code: string) {
    const result = await query(
      "UPDATE coupons SET used_count = used_count + 1 WHERE code = $1 RETURNING *",
      [code.toUpperCase()]
    );
    return result.rows[0];
  },

  async update(id: string, data: z.infer<typeof updateCouponSchema>) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.code !== undefined) {
      updates.push(`code = $${paramCount++}`);
      values.push(data.code.toUpperCase());
    }
    if (data.discountType !== undefined) {
      updates.push(`discount_type = $${paramCount++}`);
      values.push(data.discountType);
    }
    if (data.discountValue !== undefined) {
      updates.push(`discount_value = $${paramCount++}`);
      values.push(data.discountValue);
    }
    if (data.minPurchaseAmount !== undefined) {
      updates.push(`min_purchase_amount = $${paramCount++}`);
      values.push(data.minPurchaseAmount);
    }
    if (data.maxDiscountAmount !== undefined) {
      updates.push(`max_discount_amount = $${paramCount++}`);
      values.push(data.maxDiscountAmount);
    }
    if (data.usageLimit !== undefined) {
      updates.push(`usage_limit = $${paramCount++}`);
      values.push(data.usageLimit);
    }
    if (data.validFrom !== undefined) {
      updates.push(`valid_from = $${paramCount++}`);
      values.push(data.validFrom);
    }
    if (data.validUntil !== undefined) {
      updates.push(`valid_until = $${paramCount++}`);
      values.push(data.validUntil);
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
      `UPDATE coupons SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async delete(id: string) {
    await query("DELETE FROM coupons WHERE id = $1", [id]);
    return { message: "Coupon deleted successfully" };
  },
};

