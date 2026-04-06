"use client";

import { useMemo, useState } from "react";
import { Edit3, Power, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { Faq } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FaqManagerProps {
  initialFaqs: Faq[];
}

interface FaqFormState {
  question: string;
  answer: string;
  sortOrder: string;
  isActive: boolean;
}

function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function toSortedFaqs(items: Faq[]): Faq[] {
  return [...items].sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id);
}

function normalizeSortOrder(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error("Sort order must be a non-negative whole number");
  }

  return parsed;
}

function toEditForm(faq: Faq): FaqFormState {
  return {
    question: faq.question,
    answer: faq.answer,
    sortOrder: String(faq.sortOrder),
    isActive: faq.isActive,
  };
}

export function FaqManager({ initialFaqs }: FaqManagerProps) {
  const { token } = useAuthStore();
  const [items, setItems] = useState(toSortedFaqs(initialFaqs));
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<Faq | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [createForm, setCreateForm] = useState<FaqFormState>({
    question: "",
    answer: "",
    sortOrder: "0",
    isActive: true,
  });

  const [editForm, setEditForm] = useState<FaqFormState>({
    question: "",
    answer: "",
    sortOrder: "0",
    isActive: true,
  });

  const sortedItems = useMemo(() => toSortedFaqs(items), [items]);

  function updateItems(nextFaq: Faq) {
    setItems((previous) => {
      const exists = previous.some((item) => item.id === nextFaq.id);
      if (exists) {
        return toSortedFaqs(previous.map((item) => (item.id === nextFaq.id ? nextFaq : item)));
      }

      return toSortedFaqs([...previous, nextFaq]);
    });
  }

  function openEditDialog(faq: Faq) {
    setEditTarget(faq);
    setEditForm(toEditForm(faq));
  }

  async function createFaq() {
    const question = createForm.question.trim();
    const answer = createForm.answer.trim();

    if (!question || !answer) {
      toast.error("Question and answer are required.");
      return;
    }

    try {
      setIsCreating(true);
      const sortOrder = normalizeSortOrder(createForm.sortOrder);

      const response = await apiClient.adminCreateFaq(
        {
          question,
          answer,
          sortOrder,
          isActive: createForm.isActive,
        },
        token ?? undefined,
      );

      updateItems(response.item);
      setCreateForm({ question: "", answer: "", sortOrder: "0", isActive: true });
      toast.success("FAQ created.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Unable to create FAQ"));
    } finally {
      setIsCreating(false);
    }
  }

  async function saveEditFaq() {
    if (!editTarget) {
      return;
    }

    const question = editForm.question.trim();
    const answer = editForm.answer.trim();
    if (!question || !answer) {
      toast.error("Question and answer are required.");
      return;
    }

    try {
      setIsSavingEdit(true);
      const sortOrder = normalizeSortOrder(editForm.sortOrder);

      const response = await apiClient.adminUpdateFaq(
        editTarget.id,
        {
          question,
          answer,
          sortOrder,
          isActive: editForm.isActive,
        },
        token ?? undefined,
      );

      updateItems(response.item);
      setEditTarget(null);
      toast.success("FAQ updated.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Unable to update FAQ"));
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function toggleFaqStatus(faq: Faq) {
    try {
      const response = await apiClient.adminUpdateFaq(
        faq.id,
        {
          question: faq.question,
          answer: faq.answer,
          sortOrder: faq.sortOrder,
          isActive: !faq.isActive,
        },
        token ?? undefined,
      );

      updateItems(response.item);
      toast.success(response.item.isActive ? "FAQ activated." : "FAQ hidden from public page.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Unable to update FAQ status"));
    }
  }

  async function deleteFaq(faq: Faq) {
    const confirmed = window.confirm("Delete this FAQ?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(faq.id);
      await apiClient.adminDeleteFaq(faq.id, token ?? undefined);
      setItems((previous) => previous.filter((item) => item.id !== faq.id));
      toast.success("FAQ deleted.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Unable to delete FAQ"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create FAQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Question</span>
              <Input
                value={createForm.question}
                onChange={(event) => setCreateForm((previous) => ({ ...previous, question: event.target.value }))}
                placeholder="Type FAQ question"
                disabled={isCreating}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Sort Order</span>
                <Input
                  type="number"
                  min={0}
                  value={createForm.sortOrder}
                  onChange={(event) => setCreateForm((previous) => ({ ...previous, sortOrder: event.target.value }))}
                  placeholder="0"
                  disabled={isCreating}
                />
              </label>

              <label className="mt-6 flex h-10 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={createForm.isActive}
                  onChange={(event) => setCreateForm((previous) => ({ ...previous, isActive: event.target.checked }))}
                  disabled={isCreating}
                />
                Active
              </label>
            </div>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Answer</span>
            <Textarea
              value={createForm.answer}
              onChange={(event) => setCreateForm((previous) => ({ ...previous, answer: event.target.value }))}
              placeholder="Type FAQ answer"
              className="min-h-28"
              disabled={isCreating}
            />
          </label>

          <div className="flex justify-end border-t border-zinc-200 pt-3">
            <Button type="button" onClick={createFaq} disabled={isCreating}>
              <Save className="h-4 w-4" /> {isCreating ? "Creating..." : "Create FAQ"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {sortedItems.map((faq) => (
          <Card key={faq.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="line-clamp-2 text-base leading-6">{faq.question}</CardTitle>
                <div className="flex items-center gap-1">
                  <Badge variant={faq.isActive ? "default" : "outline"}>{faq.isActive ? "Active" : "Hidden"}</Badge>
                  <Badge variant="secondary">#{faq.sortOrder}</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="line-clamp-5 whitespace-pre-line text-sm text-zinc-600">{faq.answer}</p>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(faq)}>
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => toggleFaqStatus(faq)}>
                  <Power className="h-3.5 w-3.5" /> {faq.isActive ? "Hide" : "Show"}
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => deleteFaq(faq)} disabled={deletingId === faq.id}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedItems.length === 0 && <p className="text-sm text-zinc-500">No FAQs created yet.</p>}

      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>Update FAQ content, sort order, and active status.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Question</span>
              <Input
                value={editForm.question}
                onChange={(event) => setEditForm((previous) => ({ ...previous, question: event.target.value }))}
                disabled={isSavingEdit}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Answer</span>
              <Textarea
                value={editForm.answer}
                onChange={(event) => setEditForm((previous) => ({ ...previous, answer: event.target.value }))}
                className="min-h-32"
                disabled={isSavingEdit}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Sort Order</span>
                <Input
                  type="number"
                  min={0}
                  value={editForm.sortOrder}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, sortOrder: event.target.value }))}
                  disabled={isSavingEdit}
                />
              </label>

              <label className="mt-6 flex h-10 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, isActive: event.target.checked }))}
                  disabled={isSavingEdit}
                />
                Active
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)} disabled={isSavingEdit}>
              Cancel
            </Button>
            <Button type="button" onClick={saveEditFaq} disabled={isSavingEdit}>
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
