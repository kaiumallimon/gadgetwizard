"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Star, Upload, X } from "lucide-react";

import type { ProductReview, OrderItem, OrderStatus } from "@/lib/client/types";
import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface OrderReviewPanelProps {
  orderId: number;
  orderStatus: OrderStatus;
  items: OrderItem[];
  initialReviews: ProductReview[];
}

type DraftState = {
  rating: number;
  comment: string;
  images: string[];
  busy: boolean;
  uploading: boolean;
  error: string | null;
  success: string | null;
};

function createDraft(): DraftState {
  return {
    rating: 5,
    comment: "",
    images: [],
    busy: false,
    uploading: false,
    error: null,
    success: null,
  };
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function OrderReviewPanel({ orderId, orderStatus, items, initialReviews }: OrderReviewPanelProps) {
  const { token } = useAuthStore();
  const [reviewsByProductId, setReviewsByProductId] = useState<Record<number, ProductReview>>(() => {
    const map: Record<number, ProductReview> = {};
    for (const review of initialReviews) {
      map[review.productId] = review;
    }
    return map;
  });

  const [drafts, setDrafts] = useState<Record<number, DraftState>>(() => {
    const map: Record<number, DraftState> = {};
    for (const item of items) {
      map[item.productId] = createDraft();
    }
    return map;
  });

  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const canReview = orderStatus === "delivered";

  const uniqueItems = useMemo(() => {
    const seen = new Set<number>();
    return items.filter((item) => {
      if (seen.has(item.productId)) {
        return false;
      }
      seen.add(item.productId);
      return true;
    });
  }, [items]);

  function updateDraft(productId: number, patch: Partial<DraftState>) {
    setDrafts((previous) => ({
      ...previous,
      [productId]: {
        ...(previous[productId] ?? createDraft()),
        ...patch,
      },
    }));
  }

  function removeImage(productId: number, imageIndex: number) {
    const draft = drafts[productId] ?? createDraft();
    updateDraft(productId, {
      images: draft.images.filter((_, index) => index !== imageIndex),
    });
  }

  async function uploadImage(productId: number, file: File | null) {
    if (!file) {
      return;
    }

    const draft = drafts[productId] ?? createDraft();
    if (draft.images.length >= 5) {
      updateDraft(productId, { error: "You can upload up to 5 images." });
      return;
    }

    updateDraft(productId, { uploading: true, error: null, success: null });
    try {
      const response = await apiClient.uploadReviewImage(file, token ?? undefined);
      updateDraft(productId, {
        images: [...draft.images, response.item.url],
      });
    } catch (error) {
      updateDraft(productId, {
        error: error instanceof Error ? error.message : "Image upload failed.",
      });
    } finally {
      updateDraft(productId, { uploading: false });
    }
  }

  async function submitReview(productId: number) {
    const existing = reviewsByProductId[productId];
    if (existing) {
      return;
    }

    const draft = drafts[productId] ?? createDraft();
    if (!draft.comment.trim()) {
      updateDraft(productId, { error: "Comment is required." });
      return;
    }

    updateDraft(productId, { busy: true, error: null, success: null });
    try {
      const response = await apiClient.submitOrderReview(
        orderId,
        {
          productId,
          rating: draft.rating,
          comment: draft.comment.trim(),
          images: draft.images.length > 0 ? draft.images : undefined,
        },
        token ?? undefined,
      );

      setReviewsByProductId((previous) => ({
        ...previous,
        [productId]: response.item,
      }));

      updateDraft(productId, {
        busy: false,
        success: "Review submitted. It will appear after admin approval.",
        error: null,
      });
    } catch (error) {
      updateDraft(productId, {
        busy: false,
        error: error instanceof Error ? error.message : "Failed to submit review.",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Product Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canReview && (
          <p className="text-sm text-zinc-600">
            Reviews unlock when the order is delivered.
          </p>
        )}

        {canReview && uniqueItems.map((item) => {
          const review = reviewsByProductId[item.productId];
          const draft = drafts[item.productId] ?? createDraft();

          return (
            <article key={item.productId} className="rounded-xl border border-zinc-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-zinc-900">{item.productName}</p>
                {review ? (
                  <p className="text-xs font-medium text-emerald-700">
                    Review submitted ({formatStatus(review.status)})
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500">One review allowed per product for this order</p>
                )}
              </div>

              {review ? (
                <div className="mt-3 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm text-zinc-700">You rated this {review.rating}/5.</p>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap">{review.comment}</p>
                  {review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {review.images.map((image, index) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={`${image}-${index}`}
                          src={image}
                          alt="Review upload"
                          className="h-16 w-16 rounded-md border border-zinc-200 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">Rating</label>
                    <Select
                      value={String(draft.rating)}
                      onValueChange={(value) => updateDraft(item.productId, { rating: Number(value) })}
                    >
                      <SelectTrigger className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900">
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

                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">Comment</label>
                    <Textarea
                      value={draft.comment}
                      onChange={(event) => updateDraft(item.productId, { comment: event.target.value })}
                      className="min-h-24"
                      placeholder="Share your experience with this product"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Review Images (optional)</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => inputRefs.current[item.productId]?.click()}
                        disabled={draft.uploading || draft.images.length >= 5}
                      >
                        <Upload className="h-4 w-4" />
                        {draft.uploading ? "Uploading..." : "Upload Image"}
                      </Button>
                      <input
                        ref={(node) => {
                          inputRefs.current[item.productId] = node;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (event) => {
                          const input = event.currentTarget;
                          const file = input.files?.[0] ?? null;
                          input.value = "";
                          await uploadImage(item.productId, file);
                        }}
                      />
                    </div>

                    {draft.images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {draft.images.map((image, index) => (
                          <div key={`${image}-${index}`} className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={image} alt="Uploaded preview" className="h-16 w-16 rounded-md border border-zinc-200 object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(item.productId, index)}
                              className="absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600"
                              aria-label="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {draft.error && <p className="text-sm text-red-600">{draft.error}</p>}
                  {draft.success && <p className="text-sm text-emerald-600">{draft.success}</p>}

                  <Button
                    type="button"
                    onClick={() => {
                      void submitReview(item.productId);
                    }}
                    disabled={draft.busy || draft.uploading}
                    className="bg-orange-500 text-white hover:bg-orange-600"
                  >
                    <Star className="h-4 w-4" />
                    {draft.busy ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              )}
            </article>
          );
        })}

        {canReview && uniqueItems.length === 0 && (
          <p className="text-sm text-zinc-600">No products found in this order.</p>
        )}

        {canReview && (
          <p className="text-xs text-zinc-500">
            Reviews are permanent once submitted from this order page.
            <Link href="/" className="ml-1 text-zinc-700 underline-offset-2 hover:underline">Continue shopping</Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
