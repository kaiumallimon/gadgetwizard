import { queryOne, queryRows } from "@/lib/server/core/db";

interface CountRow {
  total: number;
}

interface ActionCountRow {
  action: "add" | "update" | "remove";
  total: number;
}

interface RewardDistributionRow {
  tier: "eligible_discount" | "standard";
  total_users: number;
  avg_points: number;
}

interface RecentActivityRow {
  id: number;
  action: "add" | "update" | "remove";
  quantity_before: number | null;
  quantity_after: number | null;
  created_at: Date | string;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  product_id: number | null;
  product_name: string | null;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function getAnalyticsSummary() {
  const users = await queryOne<CountRow>("SELECT COUNT(*) AS total FROM users");
  const products = await queryOne<CountRow>("SELECT COUNT(*) AS total FROM products");

  const cartActivity = await queryRows<ActionCountRow>(
    `
      SELECT action, COUNT(*) AS total
      FROM cart_activity_logs
      GROUP BY action
    `,
  );

  const rewardDistribution = await queryRows<RewardDistributionRow>(
    `
      SELECT
        CASE WHEN reward_points >= 100 THEN 'eligible_discount' ELSE 'standard' END AS tier,
        COUNT(*) AS total_users,
        AVG(reward_points) AS avg_points
      FROM users
      GROUP BY CASE WHEN reward_points >= 100 THEN 'eligible_discount' ELSE 'standard' END
    `,
  );

  return {
    totalUsers: users?.total ?? 0,
    totalProducts: products?.total ?? 0,
    cartActivity,
    rewardDistribution: rewardDistribution.map((row) => ({
      tier: row.tier,
      totalUsers: row.total_users,
      averagePoints: Number(row.avg_points ?? 0),
    })),
  };
}

export async function getRecentCartActivity(limit = 30) {
  const rows = await queryRows<RecentActivityRow>(
    `
      SELECT
        logs.id,
        logs.action,
        logs.quantity_before,
        logs.quantity_after,
        logs.created_at,
        users.id AS user_id,
        users.name AS user_name,
        users.email AS user_email,
        products.id AS product_id,
        products.name AS product_name
      FROM cart_activity_logs AS logs
      LEFT JOIN users ON users.id = logs.user_id
      LEFT JOIN products ON products.id = logs.product_id
      ORDER BY logs.created_at DESC, logs.id DESC
      LIMIT ?
    `,
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    quantityBefore: row.quantity_before,
    quantityAfter: row.quantity_after,
    createdAt: toIso(row.created_at),
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    productId: row.product_id,
    productName: row.product_name,
  }));
}

export async function getRecentCartActivityPage(input: { page: number; pageSize: number }) {
  const page = Number.isFinite(input.page) ? Math.max(1, Math.floor(input.page)) : 1;
  const pageSize = Number.isFinite(input.pageSize)
    ? Math.min(100, Math.max(5, Math.floor(input.pageSize)))
    : 20;
  const offset = (page - 1) * pageSize;

  const count = await queryOne<CountRow>("SELECT COUNT(*) AS total FROM cart_activity_logs");
  const total = count?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const rows = await queryRows<RecentActivityRow>(
    `
      SELECT
        logs.id,
        logs.action,
        logs.quantity_before,
        logs.quantity_after,
        logs.created_at,
        users.id AS user_id,
        users.name AS user_name,
        users.email AS user_email,
        products.id AS product_id,
        products.name AS product_name
      FROM cart_activity_logs AS logs
      LEFT JOIN users ON users.id = logs.user_id
      LEFT JOIN products ON products.id = logs.product_id
      ORDER BY logs.created_at DESC, logs.id DESC
      LIMIT ? OFFSET ?
    `,
    [pageSize, offset],
  );

  const items = rows.map((row) => ({
    id: row.id,
    action: row.action,
    quantityBefore: row.quantity_before,
    quantityAfter: row.quantity_after,
    createdAt: toIso(row.created_at),
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    productId: row.product_id,
    productName: row.product_name,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}
