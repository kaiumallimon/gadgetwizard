"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, X } from "lucide-react";

import { apiClient } from "@/lib/client/api";
import type { Category, Product } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface ProductFormProps {
  mode: "create" | "edit";
  categories: Category[];
  initialProduct?: Product;
}

type SpecRow = { key: string; value: string };
type SpecGroup = { title: string; rows: SpecRow[] };

function normalizeSpecValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function toSpecRows(specifications: Record<string, unknown> | null | undefined): SpecRow[] {
  if (!specifications) {
    return [{ key: "", value: "" }];
  }

  const rows = Object.entries(specifications).map(([key, value]) => ({
    key,
    value: normalizeSpecValue(value),
  }));

  return rows.length > 0 ? rows : [{ key: "", value: "" }];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toSpecGroups(specifications: Record<string, unknown> | null | undefined): SpecGroup[] {
  if (!specifications) {
    return [{ title: "General", rows: [{ key: "", value: "" }] }];
  }

  const entries = Object.entries(specifications);
  if (entries.length === 0) {
    return [{ title: "General", rows: [{ key: "", value: "" }] }];
  }

  const allNestedObjects = entries.every(([, value]) => isPlainObject(value));
  if (allNestedObjects) {
    const groups = entries.map(([title, value]) => {
      const rows = toSpecRows(value as Record<string, unknown>);
      return {
        title,
        rows,
      };
    });

    return groups.length > 0 ? groups : [{ title: "General", rows: [{ key: "", value: "" }] }];
  }

  return [
    {
      title: "General",
      rows: toSpecRows(specifications),
    },
  ];
}

function toSpecificationObject(groups: SpecGroup[]): Record<string, Record<string, string>> | null {
  const output: Record<string, Record<string, string>> = {};

  for (const group of groups) {
    const title = group.title.trim();
    if (!title) {
      continue;
    }

    const rows: Record<string, string> = {};
    for (const row of group.rows) {
      const key = row.key.trim();
      if (!key) {
        continue;
      }
      rows[key] = row.value.trim();
    }

    if (Object.keys(rows).length > 0) {
      output[title] = rows;
    }
  }

  return Object.keys(output).length > 0 ? output : null;
}

export function ProductForm({ mode, categories, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const { token } = useAuthStore();

  const [name, setName] = useState(initialProduct?.name ?? "");
  const [slug, setSlug] = useState(initialProduct?.slug ?? "");
  const [price, setPrice] = useState(initialProduct ? String(initialProduct.price) : "");
  const [discountedPrice, setDiscountedPrice] = useState(
    initialProduct?.discountedPrice !== null && initialProduct?.discountedPrice !== undefined
      ? String(initialProduct.discountedPrice)
      : "",
  );
  const [stock, setStock] = useState(initialProduct ? String(initialProduct.stock) : "");
  const [categoryId, setCategoryId] = useState(
    initialProduct?.categoryId ? String(initialProduct.categoryId) : String(categories[0]?.id ?? ""),
  );
  const [images, setImages] = useState<string[]>(initialProduct?.images ?? []);
  const [description, setDescription] = useState(initialProduct?.description ?? "<p></p>");
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>(toSpecGroups(initialProduct?.specifications));
  const [isActive, setIsActive] = useState(initialProduct?.isActive ?? true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const rootCategories = useMemo(
    () => categories.filter((category) => category.parentId === null || category.parentId === undefined),
    [categories],
  );

  function updateSpecGroup(index: number, patch: Partial<SpecGroup>) {
    setSpecGroups((previous) =>
      previous.map((group, groupIndex) => (groupIndex === index ? { ...group, ...patch } : group)),
    );
  }

  function updateSpecRow(groupIndex: number, rowIndex: number, patch: Partial<SpecRow>) {
    setSpecGroups((previous) =>
      previous.map((group, currentGroupIndex) => {
        if (currentGroupIndex !== groupIndex) {
          return group;
        }

        return {
          ...group,
          rows: group.rows.map((row, currentRowIndex) =>
            currentRowIndex === rowIndex ? { ...row, ...patch } : row,
          ),
        };
      }),
    );
  }

  function addSpecGroup() {
    setSpecGroups((previous) => [
      ...previous,
      {
        title: `Section ${previous.length + 1}`,
        rows: [{ key: "", value: "" }],
      },
    ]);
  }

  function removeSpecGroup(index: number) {
    setSpecGroups((previous) => {
      const filtered = previous.filter((_, groupIndex) => groupIndex !== index);
      return filtered.length > 0 ? filtered : [{ title: "General", rows: [{ key: "", value: "" }] }];
    });
  }

  function addSpecRow(groupIndex: number) {
    setSpecGroups((previous) =>
      previous.map((group, currentGroupIndex) =>
        currentGroupIndex === groupIndex
          ? {
              ...group,
              rows: [...group.rows, { key: "", value: "" }],
            }
          : group,
      ),
    );
  }

  function removeSpecRow(groupIndex: number, rowIndex: number) {
    setSpecGroups((previous) =>
      previous.map((group, currentGroupIndex) => {
        if (currentGroupIndex !== groupIndex) {
          return group;
        }

        const filteredRows = group.rows.filter((_, currentRowIndex) => currentRowIndex !== rowIndex);
        return {
          ...group,
          rows: filteredRows.length > 0 ? filteredRows : [{ key: "", value: "" }],
        };
      }),
    );
  }

  async function handleImageUpload(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setUploadingImage(true);
      setNotice(null);

      const response = await apiClient.adminUploadCdnImage(file, token ?? undefined);
      setImages((previous) => {
        if (previous.includes(response.item.url)) {
          return previous;
        }
        return [...previous, response.item.url];
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(index: number) {
    setImages((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedDiscountedPrice = discountedPrice.trim() ? Number(discountedPrice) : null;
    const parsedCategoryId = Number(categoryId);

    if (!name.trim() || !Number.isFinite(parsedPrice) || !Number.isFinite(parsedStock) || !parsedCategoryId || images.length === 0) {
      setNotice("Name, price, stock, category, and at least one uploaded image are required.");
      return;
    }

    try {
      setBusy(true);

      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description,
        price: parsedPrice,
        discountedPrice: parsedDiscountedPrice,
        stock: parsedStock,
        categoryId: parsedCategoryId,
        images,
        specifications: toSpecificationObject(specGroups),
        isActive,
      };

      if (mode === "create") {
        await apiClient.adminCreateProduct(payload, token ?? undefined);
      } else if (initialProduct) {
        await apiClient.adminUpdateProduct(initialProduct.id, payload, token ?? undefined);
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save product");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {notice && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{notice}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Create Product" : "Update Product"}</CardTitle>
          <CardDescription>Use rich content for descriptions and structured key/value specifications.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Product name" />
          <Input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="Slug (optional)" />
          <Input type="number" min={0} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Price" />
          <Input
            type="number"
            min={0}
            step="0.01"
            value={discountedPrice}
            onChange={(event) => setDiscountedPrice(event.target.value)}
            placeholder="Discounted price (optional)"
          />
          <Input type="number" min={0} value={stock} onChange={(event) => setStock(event.target.value)} placeholder="Stock" />
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
          >
            {rootCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <label className="col-span-full flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            Active product
          </label>

          <div className="col-span-full space-y-3 rounded-md border border-zinc-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-zinc-900">Product Images (CDN Upload)</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                <Upload className="h-3.5 w-3.5" />
                {uploadingImage ? "Uploading..." : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={async (event) => {
                    const file = event.target.files?.[0] ?? null;
                    await handleImageUpload(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            {images.length === 0 && <p className="text-xs text-zinc-500">No product images uploaded yet.</p>}

            {images.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {images.map((imageUrl, index) => (
                  <article key={`${imageUrl}-${index}`} className="overflow-hidden rounded-md border border-zinc-200">
                    <div className="relative h-32 w-full bg-zinc-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt={`Product image ${index + 1}`} className="h-full w-full object-contain" />
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-zinc-200 p-2">
                      <p className="line-clamp-1 text-xs text-zinc-500">Image {index + 1}</p>
                      <Button type="button" variant="destructive" size="icon" onClick={() => removeImage(index)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rich Description</CardTitle>
          <CardDescription>Blog-like description area with headings, lists, links, and formatting controls.</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor value={description} onChange={setDescription} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
          <CardDescription>Add technical details as key/value entries, for example Processor {"->"} Apple M3.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {specRows.map((row, index) => (
            <div key={`${index}-${row.key}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <Input
                value={row.key}
                onChange={(event) => updateSpecRow(index, { key: event.target.value })}
                placeholder="Key"
              />
              <Input
                value={row.value}
                onChange={(event) => updateSpecRow(index, { value: event.target.value })}
                placeholder="Value"
              />
              <Button type="button" variant="destructive" size="icon" onClick={() => removeSpecRow(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addSpecRow}>
            <Plus className="h-4 w-4" /> Add Specification Entry
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving..." : mode === "create" ? "Create Product" : "Update Product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
