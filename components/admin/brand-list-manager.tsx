"use client";

import { useMemo, useState } from "react";
import { Edit3, Trash2, Upload } from "lucide-react";

import { apiClient } from "@/lib/client/api";
import type { Brand } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BrandListManagerProps {
  initialBrands: Brand[];
}

type BrandDraft = {
  name: string;
  slug: string;
  imageUrl: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
  isFeatured: boolean;
};

function toDraft(brand: Brand): BrandDraft {
  return {
    name: brand.name,
    slug: brand.slug,
    imageUrl: brand.imageUrl ?? "",
    description: brand.description ?? "",
    sortOrder: String(brand.sortOrder),
    isActive: brand.isActive,
    isFeatured: brand.isFeatured,
  };
}

function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function BrandListManager({ initialBrands }: BrandListManagerProps) {
  const { token } = useAuthStore();
  const [items, setItems] = useState(initialBrands);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, BrandDraft>>(() =>
    Object.fromEntries(initialBrands.map((brand) => [brand.id, toDraft(brand)])),
  );

  const sortedItems = useMemo(
    () => [...items].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)),
    [items],
  );

  function updateDraft(id: number, patch: Partial<BrandDraft>) {
    setDrafts((previous) => {
      const base = previous[id] ?? toDraft(items.find((item) => item.id === id) ?? {
        id,
        name: "",
        slug: "",
        imageUrl: null,
        description: null,
        sortOrder: 0,
        isActive: true,
        isFeatured: false,
        createdAt: "",
        updatedAt: "",
      });

      return {
        ...previous,
        [id]: {
          ...base,
          ...patch,
        },
      };
    });
  }

  async function uploadBrandImage(brandId: number, file: File | null) {
    if (!file) {
      return;
    }

    try {
      setUploadingId(brandId);
      const response = await apiClient.adminUploadCdnImage(file, token ?? undefined);
      updateDraft(brandId, { imageUrl: response.item.url });
      setNotice("Brand image uploaded.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Brand image upload failed"));
    } finally {
      setUploadingId(null);
    }
  }

  async function saveBrand(brand: Brand) {
    const draft = drafts[brand.id] ?? toDraft(brand);
    if (!draft.name.trim()) {
      setNotice("Brand name is required.");
      return;
    }

    const parsedSortOrder = Number(draft.sortOrder);
    if (!Number.isFinite(parsedSortOrder) || !Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      setNotice("Sort order must be a positive integer.");
      return;
    }

    try {
      setSavingId(brand.id);
      const response = await apiClient.adminUpdateBrand(
        brand.id,
        {
          name: draft.name.trim(),
          slug: draft.slug.trim() || undefined,
          imageUrl: draft.imageUrl.trim() || null,
          description: draft.description.trim() || null,
          sortOrder: parsedSortOrder,
          isActive: draft.isActive,
          isFeatured: draft.isFeatured,
        },
        token ?? undefined,
      );

      setItems((previous) => previous.map((entry) => (entry.id === brand.id ? response.item : entry)));
      setDrafts((previous) => ({
        ...previous,
        [brand.id]: toDraft(response.item),
      }));
      setNotice("Brand updated.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Unable to update brand"));
    } finally {
      setSavingId(null);
    }
  }

  async function deleteBrand(brand: Brand) {
    const confirmed = window.confirm(`Delete ${brand.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.adminDeleteBrand(brand.id, token ?? undefined);
      setItems((previous) => previous.filter((entry) => entry.id !== brand.id));
      setDrafts((previous) => {
        const next = { ...previous };
        delete next[brand.id];
        return next;
      });
      setNotice("Brand deleted.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Unable to delete brand"));
    }
  }

  return (
    <div className="space-y-4">
      {notice && <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">{notice}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {sortedItems.map((brand) => {
          const draft = drafts[brand.id] ?? toDraft(brand);
          const isSaving = savingId === brand.id;
          const isUploading = uploadingId === brand.id;

          return (
            <Card key={brand.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1 text-base">{brand.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant={brand.isActive ? "default" : "outline"}>{brand.isActive ? "Active" : "Inactive"}</Badge>
                    {brand.isFeatured && <Badge variant="secondary">Featured</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {draft.imageUrl && (
                  <div className="overflow-hidden rounded-md border border-zinc-200">
                    <div className="h-28 bg-zinc-50 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={draft.imageUrl} alt={brand.name} className="h-full w-full object-contain" />
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <Input
                    value={draft.name}
                    onChange={(event) => updateDraft(brand.id, { name: event.target.value })}
                    placeholder="Brand name"
                  />
                  <Input
                    value={draft.slug}
                    onChange={(event) => updateDraft(brand.id, { slug: event.target.value })}
                    placeholder="Slug"
                  />
                  <Input
                    value={draft.imageUrl}
                    onChange={(event) => updateDraft(brand.id, { imageUrl: event.target.value })}
                    placeholder="Image URL"
                  />
                  <Textarea
                    value={draft.description}
                    onChange={(event) => updateDraft(brand.id, { description: event.target.value })}
                    className="min-h-22.5"
                    placeholder="Description"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={draft.sortOrder}
                    onChange={(event) => updateDraft(brand.id, { sortOrder: event.target.value })}
                    placeholder="Sort order"
                  />

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(event) => updateDraft(brand.id, { isActive: event.target.checked })}
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.isFeatured}
                      onChange={(event) => updateDraft(brand.id, { isFeatured: event.target.checked })}
                    />
                    Featured
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                    <Upload className="h-3.5 w-3.5" />
                    {isUploading ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading || isSaving}
                      onChange={async (event) => {
                        const input = event.currentTarget;
                        const file = input.files?.[0] ?? null;
                        input.value = "";
                        await uploadBrandImage(brand.id, file);
                      }}
                    />
                  </label>
                  <Button type="button" variant="outline" onClick={() => saveBrand(brand)} disabled={isSaving}>
                    <Edit3 className="h-3.5 w-3.5" /> {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => deleteBrand(brand)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {items.length === 0 && <p className="text-sm text-zinc-500">No brands found.</p>}
    </div>
  );
}
