"use client";

import { useMemo, useState } from "react";
import { FiImage, FiSend, FiStar } from "react-icons/fi";

import type { ProductReview, Order } from "@/lib/client/types";
import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductReviewsSectionProps {
  productId: number;
  productSlug: string;
  initialReviews: ProductReview[];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ProductReviewsSection({
  productId,
  productSlug,
  initialReviews,
}: ProductReviewsSectionProps) {
  const { session, token } = useAuthStore();
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imagesInput, setImagesInput] = useState("");
  const [eligibleOrders, setEligibleOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  const canSubmit = session?.role === "user";

  async function loadEligibleOrders() {
    if (!canSubmit || eligibleOrders.length > 0 || loadingOrders) return;

    setLoadingOrders(true);
    setError(null);
    try {
      const { items } = await apiClient.getOrders(token ?? undefined);
      const deliveredWithProduct = items.filter((order) => {
        if (order.status !== "delivered") return false;
        return order.items.some((item) => item.productId === productId);
      });

      setEligibleOrders(deliveredWithProduct);
      if (deliveredWithProduct.length > 0) {
        setSelectedOrderId(String(deliveredWithProduct[0].id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load delivered orders.");
    } finally {
      setLoadingOrders(false);
    }
  }

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setSuccess(null);

    if (!selectedOrderId) {
      setError("Select a delivered order first.");
      return;
    }

    if (!comment.trim()) {
      setError("Comment is required.");
      return;
    }

    const images = imagesInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      const { item } = await apiClient.submitReview(
        productSlug,
        {
          orderId: Number(selectedOrderId),
          rating,
          comment: comment.trim(),
          images: images.length > 0 ? images : undefined,
        },
        token ?? undefined,
      );

      setSuccess("Review submitted successfully. It will be visible after admin approval.");
      setComment("");
      setImagesInput("");
      void item;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="order-5 space-y-6 border-t border-zinc-100 pt-10 xl:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Customer Reviews</h2>
          <p className="text-sm text-zinc-500">Verified reviews from delivered orders only.</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-zinc-900">{averageRating.toFixed(1)} / 5</p>
          <p className="text-xs text-zinc-500">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-zinc-500">
              No approved reviews yet for this product.
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
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
          ))
        )}
      </div>

      {canSubmit && (
        <Card className="border-zinc-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Write A Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitReview} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Rating</Label>
                  <Select value={String(rating)} onValueChange={(value) => setRating(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="2">2 - Poor</SelectItem>
                      <SelectItem value="1">1 - Bad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Delivered Order</Label>
                  <Select
                    value={selectedOrderId}
                    onOpenChange={(open) => {
                      if (open) {
                        void loadEligibleOrders();
                      }
                    }}
                    onValueChange={setSelectedOrderId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingOrders ? "Loading..." : "Select order"} />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleOrders.length === 0 ? (
                        <SelectItem value="__empty" disabled>
                          {loadingOrders ? "Loading delivered orders..." : "No delivered order found"}
                        </SelectItem>
                      ) : (
                        eligibleOrders.map((order) => (
                          <SelectItem key={order.id} value={String(order.id)}>
                            #{order.id} - {new Date(order.createdAt).toLocaleDateString()}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="review-comment" className="text-xs">Comment</Label>
                <Textarea
                  id="review-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share your experience with this product..."
                  className="min-h-25"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="review-images" className="text-xs">
                  Optional Image URLs
                </Label>
                <Input
                  id="review-images"
                  value={imagesInput}
                  onChange={(event) => setImagesInput(event.target.value)}
                  placeholder="https://... , https://..."
                />
                <p className="text-xs text-zinc-500 inline-flex items-center gap-1">
                  <FiImage className="h-3.5 w-3.5" />
                  Separate multiple image URLs with commas.
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-emerald-600">{success}</p>}

              <Button
                type="submit"
                disabled={submitting || loadingOrders || eligibleOrders.length === 0}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                <FiSend className="h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!session && (
        <Card>
          <CardContent className="py-4 text-sm text-zinc-600">
            Login with a customer account to submit reviews after delivery.
          </CardContent>
        </Card>
      )}

      {session?.role === "admin" && (
        <Card>
          <CardContent className="py-4 text-sm text-zinc-600">
            Admin accounts cannot submit product reviews.
          </CardContent>
        </Card>
      )}
    </section>
  );
}
