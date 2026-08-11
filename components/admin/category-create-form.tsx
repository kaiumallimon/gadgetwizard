"use client";

import { useState } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { Category } from "@/lib/client/types";
import { slugify } from "@/lib/shared/slug";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CategoryCreateFormProps {
  categories: Category[];
}

const fieldLabelClass = "text-xs font-medium uppercase tracking-[0.12em] leading-4 text-zinc-500";
const fieldWrapClass = "grid grid-rows-[auto_2.5rem] gap-1";

function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function CategoryCreateForm({ categories }: CategoryCreateFormProps) {
  const { token } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: "",
    imageUrl: "",
    isHeaderCategory: false,
    isFeatured: false,
  });

  const headerPinnedCount = categories.filter((category) => category.isHeaderCategory).length;
  const featuredCount = categories.filter((category) => category.isFeatured).length;
  const generatedSlug = slugify(form.name);

  async function handleImageUpload(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setIsUploadingImage(true);
      const response = await apiClient.adminUploadCdnImage(file, token ?? undefined);
      setForm((prev) => ({ ...prev, imageUrl: response.item.url }));
      toast.success("Category image uploaded.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Category image upload failed"));
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleCreateCategory() {
    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    if (form.isHeaderCategory && headerPinnedCount >= 8) {
      toast.error("Header category limit reached (8). Unpin one before adding another.");
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.adminCreateCategory(
        {
          name: form.name.trim(),
          slug: generatedSlug || undefined,
          imageUrl: form.imageUrl || null,
          isHeaderCategory: form.isHeaderCategory,
          isFeatured: form.isFeatured,
        },
        token ?? undefined,
      );

      setForm({ name: "", imageUrl: "", isHeaderCategory: false, isFeatured: false });
      toast.success("Category created successfully.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Category creation failed"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create Category</CardTitle>
        <CardDescription>Use this page to create categories, upload images, and control header/storefront visibility.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className={fieldWrapClass}>
            <span className={fieldLabelClass}>Category Name</span>
            <Input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Category name"
              disabled={isSaving}
              minLength={2}
              maxLength={120}
            />
          </label>
          <label className={fieldWrapClass}>
            <span className={fieldLabelClass}>Slug</span>
            <Input
              value={generatedSlug}
              placeholder="Auto-generated from category name"
              readOnly
              disabled
            />
          </label>
          <div className={fieldWrapClass}>
            <span className={fieldLabelClass}>Category Image</span>
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm text-zinc-700 hover:bg-zinc-50">
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
          <label className={fieldWrapClass}>
            <span className={fieldLabelClass}>Header Visibility</span>
            <span className="flex h-10 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0"
                checked={form.isHeaderCategory}
                disabled={isSaving}
                onChange={(event) => setForm((prev) => ({ ...prev, isHeaderCategory: event.target.checked }))}
              />
              <span className="truncate">Add to header ({headerPinnedCount}/8 pinned)</span>
            </span>
          </label>
          <label className={fieldWrapClass}>
            <span className={fieldLabelClass}>Storefront Feature</span>
            <span className="flex h-10 items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0"
                checked={form.isFeatured}
                disabled={isSaving}
                onChange={(event) => setForm((prev) => ({ ...prev, isFeatured: event.target.checked }))}
              />
              <span className="truncate">Show in Featured Categories ({featuredCount} selected)</span>
            </span>
          </label>
        </div>

        {form.imageUrl && (
          <div className="overflow-hidden rounded-md border border-zinc-200">
            <div className="h-32 bg-zinc-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imageUrl} alt="Category upload preview" className="h-full w-full object-contain" />
            </div>
            <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500">CDN image ready</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-2">
          <Button onClick={handleCreateCategory} disabled={isSaving}>
            <ImageIcon className="h-4 w-4" /> {isSaving ? "Creating..." : "Create Category"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
