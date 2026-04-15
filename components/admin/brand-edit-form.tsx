"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Upload } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { Brand } from "@/lib/client/types";
import { slugify } from "@/lib/shared/slug";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BrandEditFormProps {
  initialBrand: Brand;
}

function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function BrandEditForm({ initialBrand }: BrandEditFormProps) {
  const router = useRouter();
  const { token } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: initialBrand.name,
    imageUrl: initialBrand.imageUrl ?? "",
    description: initialBrand.description ?? "",
    sortOrder: String(initialBrand.sortOrder),
    isActive: initialBrand.isActive,
    isFeatured: initialBrand.isFeatured,
  });
  const generatedSlug = slugify(form.name);

  async function handleImageUpload(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setIsUploadingImage(true);
      const response = await apiClient.adminUploadCdnImage(file, token ?? undefined);
      setForm((prev) => ({ ...prev, imageUrl: response.item.url }));
      toast.success("Brand image uploaded.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Brand image upload failed"));
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSaveBrand() {
    if (!form.name.trim()) {
      toast.error("Brand name is required.");
      return;
    }

    const parsedSortOrder = Number(form.sortOrder);
    if (!Number.isFinite(parsedSortOrder) || !Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      toast.error("Sort order must be a positive integer.");
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.adminUpdateBrand(
        initialBrand.id,
        {
          name: form.name.trim(),
          slug: generatedSlug || undefined,
          imageUrl: form.imageUrl.trim() || null,
          description: form.description.trim() || null,
          sortOrder: parsedSortOrder,
          isActive: form.isActive,
          isFeatured: form.isFeatured,
        },
        token ?? undefined,
      );

      toast.success("Brand updated successfully.");
      router.push("/admin/brands");
      router.refresh();
    } catch (error) {
      toast.error(safeErrorMessage(error, "Unable to update brand"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Edit Brand</CardTitle>
        <CardDescription>Update brand details, logo, ordering and visibility.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Brand Name</span>
            <Input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Brand name"
              disabled={isSaving}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Slug</span>
            <Input
              value={generatedSlug}
              placeholder="Auto-generated from brand name"
              readOnly
              disabled
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Sort Order</span>
            <Input
              value={form.sortOrder}
              onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
              placeholder="Sort order"
              type="number"
              min={0}
              disabled={isSaving}
            />
          </label>
          <div className="space-y-1">
            <span className="block text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Brand Image</span>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
              <Upload className="h-4 w-4" />
              {isUploadingImage ? "Uploading image..." : "Upload Brand Image"}
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
          <label className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              disabled={isSaving}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Active brand
          </label>
          <label className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.isFeatured}
              disabled={isSaving}
              onChange={(event) => setForm((prev) => ({ ...prev, isFeatured: event.target.checked }))}
            />
            Featured brand
          </label>
          <label className="col-span-full space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Description</span>
            <Textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="min-h-24"
              placeholder="Brand description (optional)"
              disabled={isSaving}
            />
          </label>
        </div>

        {form.imageUrl && (
          <div className="overflow-hidden rounded-md border border-zinc-200">
            <div className="h-32 bg-zinc-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imageUrl} alt="Brand upload preview" className="h-full w-full object-contain" />
            </div>
            <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500">CDN image ready</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSaveBrand} disabled={isSaving}>
            <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/brands")}>Back</Button>
        </div>
      </CardContent>
    </Card>
  );
}
