"use client";

import { useState } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";

import { apiClient } from "@/lib/client/api";
import type { Category } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CategoryCreateFormProps {
  categories: Category[];
}

function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function CategoryCreateForm({ categories }: CategoryCreateFormProps) {
  const { token } = useAuthStore();
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    imageUrl: "",
    parentId: "",
    isHeaderCategory: false,
  });

  const headerPinnedCount = categories.filter((category) => category.isHeaderCategory).length;

  async function handleImageUpload(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setIsUploadingImage(true);
      const response = await apiClient.adminUploadCdnImage(file, token ?? undefined);
      setForm((prev) => ({ ...prev, imageUrl: response.item.url }));
      setNotice("Category image uploaded.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Category image upload failed"));
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleCreateCategory() {
    if (!form.name.trim()) {
      setNotice("Category name is required.");
      return;
    }

    if (form.isHeaderCategory && headerPinnedCount >= 8) {
      setNotice("Header category limit reached (8). Unpin one before adding another.");
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.adminCreateCategory(
        {
          name: form.name.trim(),
          slug: form.slug || undefined,
          imageUrl: form.imageUrl || null,
          isHeaderCategory: form.isHeaderCategory,
          parentId: form.parentId ? Number(form.parentId) : null,
        },
        token ?? undefined,
      );

      setForm({ name: "", slug: "", imageUrl: "", parentId: "", isHeaderCategory: false });
      setNotice("Category created successfully.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Category creation failed"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create Category</CardTitle>
        <CardDescription>Use this dedicated page to create categories and upload category images.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice && (
          <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
            {notice}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Category Name</span>
            <Input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Category name"
              disabled={isSaving}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Slug</span>
            <Input
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="Slug (optional)"
              disabled={isSaving}
            />
          </label>
          <div className="space-y-1">
            <span className="block text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Category Image</span>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
              <Upload className="h-4 w-4" />
              {isUploadingImage ? "Uploading image..." : "Upload Category Image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingImage || isSaving}
                onChange={async (event) => {
                  const input = event.currentTarget;
                  const file = input.files?.[0] ?? null;
                  input.value = "";
                  await handleImageUpload(file);
                }}
              />
            </label>
          </div>
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Parent Category ID</span>
            <Input
              value={form.parentId}
              onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
              placeholder="Parent ID (optional)"
              disabled={isSaving}
              list="category-parent-options"
            />
          </label>
          <label className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.isHeaderCategory}
              disabled={isSaving}
              onChange={(event) => setForm((prev) => ({ ...prev, isHeaderCategory: event.target.checked }))}
            />
            Add to header ({headerPinnedCount}/8 pinned)
          </label>
        </div>

        <datalist id="category-parent-options">
          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </datalist>

        {form.imageUrl && (
          <div className="overflow-hidden rounded-md border border-zinc-200">
            <div className="h-32 bg-zinc-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imageUrl} alt="Category upload preview" className="h-full w-full object-contain" />
            </div>
            <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500">CDN image ready</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCreateCategory} disabled={isSaving}>
            <ImageIcon className="h-4 w-4" /> {isSaving ? "Creating..." : "Create Category"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
