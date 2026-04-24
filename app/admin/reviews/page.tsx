import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminReviews } from "@/lib/server/services/review-service";
import { AdminReviewsManager } from "@/components/admin/admin-reviews-manager";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireServerRole(["admin"]);

  const result = await getAdminReviews({
    page: 1,
    pageSize: 100,
    status: "pending",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Product Reviews</h1>
        <p className="text-sm text-zinc-500">Moderate customer reviews before they go live on product pages.</p>
      </div>

      <AdminReviewsManager initialReviews={result.items} />
    </div>
  );
}
