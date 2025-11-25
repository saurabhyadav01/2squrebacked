import { query } from "../config/database";

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  lowStockProducts: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  recentOrders: any[];
  topProducts: any[];
}

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    // Total Revenue
    const revenueResult = await query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'"
    );
    const totalRevenue = parseFloat(revenueResult.rows[0]?.total || "0");

    // Total Orders
    const ordersResult = await query("SELECT COUNT(*) as count FROM orders");
    const totalOrders = parseInt(ordersResult.rows[0]?.count || "0");

    // Total Products
    const productsResult = await query("SELECT COUNT(*) as count FROM products");
    const totalProducts = parseInt(productsResult.rows[0]?.count || "0");

    // Total Users
    const usersResult = await query("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    const totalUsers = parseInt(usersResult.rows[0]?.count || "0");

    // Pending Orders
    const pendingResult = await query(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"
    );
    const pendingOrders = parseInt(pendingResult.rows[0]?.count || "0");

    // Low Stock Products
    const lowStockResult = await query(
      "SELECT COUNT(*) as count FROM products WHERE stock_quantity < 10 AND is_active = true"
    );
    const lowStockProducts = parseInt(lowStockResult.rows[0]?.count || "0");

    // Average Order Value
    const avgOrderResult = await query(
      "SELECT COALESCE(AVG(total_amount), 0) as avg FROM orders WHERE payment_status = 'paid'"
    );
    const averageOrderValue = parseFloat(avgOrderResult.rows[0]?.avg || "0");

    // Orders by Status
    const statusResult = await query(
      "SELECT status, COUNT(*) as count FROM orders GROUP BY status"
    );
    const ordersByStatus: Record<string, number> = {};
    statusResult.rows.forEach((row) => {
      ordersByStatus[row.status] = parseInt(row.count);
    });

    // Recent Orders
    const recentOrdersResult = await query(
      `SELECT o.*, u.email, u.first_name, u.last_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );
    const recentOrders = recentOrdersResult.rows;

    // Top Products
    const topProductsResult = await query(
      `SELECT p.id, p.name, p.image_url, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       GROUP BY p.id, p.name, p.image_url
       ORDER BY total_sold DESC
       LIMIT 10`
    );
    const topProducts = topProductsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      image_url: row.image_url,
      total_sold: parseInt(row.total_sold || "0"),
      revenue: parseFloat(row.revenue || "0"),
    }));

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      pendingOrders,
      lowStockProducts,
      averageOrderValue,
      ordersByStatus,
      recentOrders,
      topProducts,
    };
  },

  async getRevenueByPeriod(startDate: string, endDate: string) {
    const result = await query(
      `SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
       FROM orders
       WHERE created_at >= $1 AND created_at <= $2 AND payment_status = 'paid'
       GROUP BY month
       ORDER BY month`,
      [startDate, endDate]
    );
    return result.rows;
  },

  async getSalesReport(startDate: string, endDate: string) {
    const result = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_order_value
       FROM orders
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [startDate, endDate]
    );
    return result.rows;
  },
};

