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
