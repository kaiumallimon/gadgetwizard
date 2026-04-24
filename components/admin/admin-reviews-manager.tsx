"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiRefreshCw, FiTrash2, FiX } from "react-icons/fi";

import type { ProductReview, ReviewStatus } from "@/lib/client/types";
import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle>Reviews Table</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
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
      </CardHeader>

      <CardContent>
        {reviews.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">
            No reviews found for the selected filter.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Review</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Moderation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => {
                const statusMeta = STATUS_META[review.status];
                return (
                  <TableRow key={review.id}>
                    <TableCell>
                      <p className="font-semibold text-zinc-900">{review.productName}</p>
                      <p className="text-xs text-zinc-400">Order #{review.orderId}</p>
                      <p className="text-xs text-zinc-400">{new Date(review.createdAt).toLocaleString()}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-zinc-800">{review.userName}</p>
                      <p className="text-xs text-zinc-500">{review.userEmail}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold text-zinc-900">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-72">
                      <p className="line-clamp-4 whitespace-pre-wrap text-sm text-zinc-700">{review.comment}</p>
                    </TableCell>
                    <TableCell>
                      {review.images.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {review.images.map((src, index) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={`${review.id}-${index}`}
                              src={src}
                              alt={`Review image ${index + 1}`}
                              className="h-12 w-12 rounded-md border border-zinc-200 object-cover"
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">No images</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-64">
                      {review.status === "pending" ? (
                        <div className="space-y-2">
                          <Textarea
                            value={notes[review.id] ?? ""}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [review.id]: e.target.value }))}
                            placeholder="Optional moderation note..."
                            className="min-h-16 text-xs"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => void updateReviewStatus(review.id, "rejected")}
                              disabled={busyId === review.id}
                            >
                              <FiX className="h-4 w-4" /> Reject
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                              onClick={() => void updateReviewStatus(review.id, "approved")}
                              disabled={busyId === review.id}
                            >
                              <FiCheck className="h-4 w-4" /> Approve
                            </Button>
                          </div>
                        </div>
                      ) : review.adminNote ? (
                        <p className="text-xs text-zinc-600">
                          <span className="font-semibold text-zinc-700">Admin note:</span> {review.adminNote}
                        </p>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => void deleteReview(review.id)}
                        disabled={busyId === review.id}
                      >
                        <FiTrash2 className="h-4 w-4" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
