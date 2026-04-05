"use client";

import { useState } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";

import { apiClient } from "@/lib/client/api";
import type { Brand } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BrandCreateFormProps {
  brands: Brand[];
}

function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function BrandCreateForm({ brands }: BrandCreateFormProps) {
  const { token } = useAuthStore();
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    imageUrl: "",
    description: "",
    sortOrder: String(brands.length),
    isActive: true,
    isFeatured: false,
  });

  async function handleImageUpload(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setIsUploadingImage(true);
      const response = await apiClient.adminUploadCdnImage(file, token ?? undefined);
      setForm((prev) => ({ ...prev, imageUrl: response.item.url }));
      setNotice("Brand image uploaded.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Brand image upload failed"));
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleCreateBrand() {
    if (!form.name.trim()) {
      setNotice("Brand name is required.");
      return;
    }

    const parsedSortOrder = Number(form.sortOrder);
    if (!Number.isFinite(parsedSortOrder) || !Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      setNotice("Sort order must be a positive integer.");
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.adminCreateBrand(
        {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          imageUrl: form.imageUrl.trim() || null,
          description: form.description.trim() || null,
          sortOrder: parsedSortOrder,
          isActive: form.isActive,
          isFeatured: form.isFeatured,
        },
        token ?? undefined,
      );

      setForm({
        name: "",
        slug: "",
        imageUrl: "",
        description: "",
        sortOrder: String(brands.length + 1),
        isActive: true,
        isFeatured: false,
      });
      setNotice("Brand created successfully.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Brand creation failed"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create Brand</CardTitle>
        <CardDescription>Add brand identity with logo/image and visibility flags.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice && (
          <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
            {notice}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Brand name"
            disabled={isSaving}
          />
          <Input
            value={form.slug}
            onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
            placeholder="Slug (optional)"
            disabled={isSaving}
          />
          <Input
            value={form.sortOrder}
            onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
            placeholder="Sort order"
            type="number"
            min={0}
            disabled={isSaving}
          />
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
          <Textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="col-span-full min-h-24"
            placeholder="Brand description (optional)"
            disabled={isSaving}
          />
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
          <Button onClick={handleCreateBrand} disabled={isSaving}>
            <ImageIcon className="h-4 w-4" /> {isSaving ? "Creating..." : "Create Brand"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
