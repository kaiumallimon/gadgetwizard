"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import type { BusinessAccount, BusinessAccountStatus } from "@/lib/client/types";
import { apiClient } from "@/lib/client/api";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function statusClass(status: BusinessAccountStatus): string {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

interface AdminBusinessAccountRequestsManagerProps {
  initialItems: BusinessAccount[];
}

export function AdminBusinessAccountRequestsManager({
  initialItems,
}: AdminBusinessAccountRequestsManagerProps) {
  const { token } = useAuthStore();
  const [items, setItems] = useState<BusinessAccount[]>(initialItems);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notesById, setNotesById] = useState<Record<number, string>>({});

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  async function review(item: BusinessAccount, status: "approved" | "rejected") {
    setBusyId(item.id);
    try {
      const response = await apiClient.adminReviewBusinessAccount(
        item.id,
        {
          status,
          reviewNotes: notesById[item.id]?.trim() ? notesById[item.id].trim() : null,
        },
        token ?? undefined,
      );

      setItems((previous) => previous.map((entry) => (entry.id === item.id ? response.item : entry)));
      toast.success(`Application ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update request");
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">No business account requests found for the selected filters.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50 hover:bg-zinc-50">
            <TableHead>Applicant</TableHead>
            <TableHead>Business</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Review Note</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isBusy = busyId === item.id;

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <p className="font-medium text-zinc-900">{item.userName ?? "Unknown user"}</p>
                  <p className="text-xs text-zinc-500">{item.userEmail ?? "N/A"}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-zinc-900">{item.businessName}</p>
                  <p className="text-xs text-zinc-500">{item.legalEntityType}</p>
                  {item.websiteUrl && (
                    <Link href={item.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                      Website
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusClass(item.status)}>
                    {item.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-600">
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="min-w-56">
                  {item.status === "pending" ? (
                    <Textarea
                      value={notesById[item.id] ?? item.reviewNotes ?? ""}
                      onChange={(event) => setNotesById((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      placeholder="Optional admin note"
                      className="min-h-20 text-xs"
                      disabled={isBusy}
                    />
                  ) : (
                    <p className="text-xs text-zinc-600">{item.reviewNotes ?? "-"}</p>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {item.status === "pending" ? (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Link href={`/admin/business-accounts/${item.id}`}>View</Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        disabled={isBusy}
                        onClick={() => void review(item, "rejected")}
                      >
                        <X className="h-4 w-4" /> Reject
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={isBusy}
                        onClick={() => void review(item, "approved")}
                      >
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Link href={`/admin/business-accounts/${item.id}`}>View</Link>
                      </Button>
                      <span className="text-xs text-zinc-500">Reviewed</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
