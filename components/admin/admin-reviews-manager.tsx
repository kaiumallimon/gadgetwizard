"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiRefreshCw, FiTrash2, FiX } from "react-icons/fi";

import type { ProductReview, ReviewStatus } from "@/lib/client/types";
import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AdminReviewsManagerProps {
  initialReviews: ProductReview[];
}

const STATUS_META: Record<ReviewStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
};

export function AdminReviewsManager({ initialReviews }: AdminReviewsManagerProps) {
  const { token } = useAuthStore();
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("all");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  async function loadReviews() {
    setLoading(true);
    try {
      const response = await apiClient.adminGetReviews(
        {
          page: 1,
          pageSize: 100,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
        token ?? undefined,
      );
      setReviews(response.items);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function updateReviewStatus(reviewId: number, status: "approved" | "rejected") {
    setBusyId(reviewId);
    try {
      const { item } = await apiClient.adminUpdateReviewStatus(
        reviewId,
        {
          status,
          adminNote: notes[reviewId] || undefined,
        },
        token ?? undefined,
      );

      setReviews((prev) => prev.map((r) => (r.id === item.id ? item : r)));
      setNotes((prev) => ({ ...prev, [reviewId]: "" }));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to update review");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteReview(reviewId: number) {
    const confirmed = window.confirm("Delete this review permanently?");
    if (!confirmed) {
      return;
    }

    setBusyId(reviewId);
    try {
      await apiClient.adminDeleteReview(reviewId, token ?? undefined);
      setReviews((previous) => previous.filter((review) => review.id !== reviewId));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to delete review");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | ReviewStatus)}>
          <SelectTrigger className="w-55">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => void loadReviews()} disabled={loading}>
          <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            No reviews found for the selected filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const statusMeta = STATUS_META[review.status];
            return (
              <Card key={review.id}>
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-zinc-900">{review.productName}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600">By {review.userName} ({review.userEmail})</p>
                      <p className="text-xs text-zinc-400">Order #{review.orderId} · {new Date(review.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-zinc-900">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => void deleteReview(review.id)}
                        disabled={busyId === review.id}
                      >
                        <FiTrash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-700 whitespace-pre-wrap">
                    {review.comment}
                  </div>

                  {review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {review.images.map((src, index) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={`${review.id}-${index}`}
                          src={src}
                          alt={`Review image ${index + 1}`}
                          className="h-20 w-20 rounded-lg border border-zinc-200 object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {review.status === "pending" ? (
                    <div className="space-y-2 rounded-lg border border-orange-200 bg-orange-50/40 p-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Admin note (optional)</Label>
                        <Textarea
                          value={notes[review.id] ?? ""}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [review.id]: e.target.value }))}
                          placeholder="Optional moderation note..."
                          className="min-h-18"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => void updateReviewStatus(review.id, "rejected")}
                          disabled={busyId === review.id}
                        >
                          <FiX className="h-4 w-4" /> Reject
                        </Button>
                        <Button
                          type="button"
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => void updateReviewStatus(review.id, "approved")}
                          disabled={busyId === review.id}
                        >
                          <FiCheck className="h-4 w-4" /> Approve
                        </Button>
                      </div>
                    </div>
                  ) : review.adminNote ? (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
                      <span className="font-semibold text-zinc-700">Admin note:</span> {review.adminNote}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
