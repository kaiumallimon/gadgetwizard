import { getAnalyticsSummary } from "@/lib/server/repositories/analytics-repository";

export async function getAdminAnalytics() {
  return getAnalyticsSummary();
}
