import { query } from "../config/database";

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: Date;
}

export const userService = {
  // Get all users (admin only)
  async getAll(): Promise<User[]> {
    const result = await query(
      "SELECT id, email, first_name, last_name, phone, role, is_active, created_at FROM users ORDER BY created_at DESC"
    );
    return result.rows;
  },

  // Get user by ID
  async getById(id: string): Promise<User | null> {
    const result = await query(
      "SELECT id, email, first_name, last_name, phone, role, is_active, created_at FROM users WHERE id = $1",
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  },

  // Update user (admin only)
  async update(id: string, data: { role?: string; isActive?: boolean }) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(data.role);
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
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id, email, first_name, last_name, phone, role, is_active, created_at`,
      values
    );

    return result.rows[0];
  },

  // Delete user (admin only)
  async delete(id: string) {
    await query("DELETE FROM users WHERE id = $1", [id]);
    return { message: "User deleted successfully" };
  },
};

