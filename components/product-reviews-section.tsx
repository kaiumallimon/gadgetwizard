import type { ProductReview } from "@/lib/client/types";
import { Card, CardContent } from "@/components/ui/card";

interface ProductReviewsSectionProps {
  initialReviews: ProductReview[];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ProductReviewsSection({ initialReviews }: ProductReviewsSectionProps) {
  if (initialReviews.length === 0) {
    return null;
  }

  const averageRating = initialReviews.reduce((sum, review) => sum + review.rating, 0) / initialReviews.length;

  return (
    <section className="order-5 space-y-6 border-t border-zinc-100 pt-10 xl:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Customer Reviews</h2>
          <p className="text-sm text-zinc-500">Approved reviews from delivered orders.</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-zinc-900">{averageRating.toFixed(1)} / 5</p>
          <p className="text-xs text-zinc-500">
            {initialReviews.length} review{initialReviews.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {initialReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-900">{review.userName ?? "Verified Buyer"}</p>
                  <p className="text-xs text-zinc-500">{formatDate(review.createdAt)}</p>
                </div>
                <p className="text-sm font-semibold text-zinc-800">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </p>
              </div>

              <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">{review.comment}</p>

              {review.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {review.images.map((src, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${review.id}-${index}`}
                      src={src}
                      alt="Review"
                      className="h-20 w-20 rounded-lg border border-zinc-200 object-cover"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
