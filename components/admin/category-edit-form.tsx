"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Upload } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { Category } from "@/lib/client/types";
import { slugify } from "@/lib/shared/slug";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CategoryEditFormProps {
  initialCategory: Category;
  categories: Category[];
}

function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function CategoryEditForm({ initialCategory, categories }: CategoryEditFormProps) {
  const router = useRouter();
  const { token } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: initialCategory.name,
    slug: initialCategory.slug,
    icon: initialCategory.icon ?? "",
    imageUrl: initialCategory.imageUrl ?? "",
    sortOrder: String(initialCategory.sortOrder),
    isHeaderCategory: initialCategory.isHeaderCategory,
    isFeatured: initialCategory.isFeatured,
    isActive: initialCategory.isActive,
  });

  const generatedSlug = slugify(form.name);

  const headerPinnedCount = useMemo(
    () => categories.filter((category) => category.isHeaderCategory).length,
    [categories],
  );

  async function handleImageUpload(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setIsUploadingImage(true);
      const response = await apiClient.adminUploadCdnImage(file, token ?? undefined);
      setForm((previous) => ({ ...previous, imageUrl: response.item.url }));
      toast.success("Category image uploaded.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Category image upload failed"));
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSaveCategory() {
    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    const normalizedSlug = form.slug.trim() || generatedSlug;
    if (!normalizedSlug) {
      toast.error("Category slug is required.");
      return;
    }

    const parsedSortOrder = Number(form.sortOrder);
    if (!Number.isFinite(parsedSortOrder) || !Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      toast.error("Sort order must be a non-negative whole number.");
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.adminUpdateCategory(
        initialCategory.id,
        {
          name: form.name.trim(),
          slug: normalizedSlug,
          icon: form.icon.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
          sortOrder: parsedSortOrder,
          isHeaderCategory: form.isHeaderCategory,
          isFeatured: form.isFeatured,
          isActive: form.isActive,
        },
        token ?? undefined,
      );

      toast.success("Category updated successfully.");
      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      toast.error(safeErrorMessage(error, "Unable to update category"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Edit Category</CardTitle>
        <CardDescription>Update category details, ordering, image, and storefront visibility settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Category Name</span>
            <Input
              value={form.name}
              onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
              placeholder="Category name"
              disabled={isSaving}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Category Slug</span>
            <Input
              value={form.slug}
              onChange={(event) => setForm((previous) => ({ ...previous, slug: event.target.value }))}
              placeholder={generatedSlug || "category-slug"}
              disabled={isSaving}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Sort Order</span>
            <Input
              value={form.sortOrder}
              onChange={(event) => setForm((previous) => ({ ...previous, sortOrder: event.target.value }))}
              placeholder="Sort order"
              type="number"
              min={0}
              disabled={isSaving}
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Icon URL</span>
            <Input
              value={form.icon}
              onChange={(event) => setForm((previous) => ({ ...previous, icon: event.target.value }))}
              placeholder="https://..."
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
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Image URL</span>
            <Input
              value={form.imageUrl}
              onChange={(event) => setForm((previous) => ({ ...previous, imageUrl: event.target.value }))}
              placeholder="https://..."
              disabled={isSaving}
            />
          </label>

          <label className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.isHeaderCategory}
              disabled={isSaving}
              onChange={(event) => setForm((previous) => ({ ...previous, isHeaderCategory: event.target.checked }))}
            />
            Pin in header ({headerPinnedCount}/8)
          </label>

          <label className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.isFeatured}
              disabled={isSaving}
              onChange={(event) => setForm((previous) => ({ ...previous, isFeatured: event.target.checked }))}
            />
            Featured category
          </label>

          <label className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              disabled={isSaving}
              onChange={(event) => setForm((previous) => ({ ...previous, isActive: event.target.checked }))}
            />
            Active category
          </label>
        </div>

        {form.imageUrl.trim() && (
          <div className="overflow-hidden rounded-md border border-zinc-200">
            <div className="h-36 bg-zinc-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imageUrl} alt="Category upload preview" className="h-full w-full object-contain" />
            </div>
            <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500">CDN image ready</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSaveCategory} disabled={isSaving}>
            <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/categories")}>Back</Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => setForm((previous) => ({ ...previous, slug: generatedSlug }))}
          >
            Use Generated Slug
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
