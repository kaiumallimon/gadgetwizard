"use client";

import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { Brand, Category, Product } from "@/lib/client/types";
import { slugify } from "@/lib/shared/slug";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Textarea } from "@/components/ui/textarea";

interface ProductFormProps {
  mode: "create" | "edit";
  categories: Category[];
  brands: Brand[];
  initialProduct?: Product;
}

type SpecRow = { key: string; value: string };
type SpecGroup = { title: string; rows: SpecRow[] };

const PRODUCT_FIELD_LIMITS = {
  name: 200,
  shortDescription: 500,
  modelNumber: 120,
  color: 80,
  metaTitle: 255,
  metaDescription: 500,
} as const;

const TAG_LIMITS = {
  maxTags: 32,
  maxTagLength: 40,
} as const;

const HIGHLIGHT_LIMITS = {
  maxLines: 12,
  maxLineLength: 120,
} as const;

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

function clampText(value: string, limit: number): string {
  return value.length > limit ? value.slice(0, limit) : value;
}

function clampTagsInput(value: string): string {
  const tags = value
    .split(",")
    .slice(0, TAG_LIMITS.maxTags)
    .map((entry) => entry.trim().slice(0, TAG_LIMITS.maxTagLength));

  return tags.join(", ");
}

function clampHighlightPointsInput(value: string): string {
  const lines = value
    .split("\n")
    .slice(0, HIGHLIGHT_LIMITS.maxLines)
    .map((entry) => entry.slice(0, HIGHLIGHT_LIMITS.maxLineLength));

  return lines.join("\n");
}

function getLimitLabelClass(currentLength: number, limit: number): string {
  if (currentLength >= limit) {
    return "font-semibold text-red-600 motion-safe:animate-pulse";
  }

  if (currentLength >= Math.floor(limit * 0.85)) {
    return "font-semibold text-orange-600";
  }

  return "font-medium text-zinc-700";
}

function Field({
  label,
  children,
  className,
  labelClassName,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`.trim()}>
      <span className={`text-xs transition-colors ${labelClassName ?? "font-medium"}`}>{label}</span>
      {children}
    </label>
  );
}

function createSkuToken(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${timestamp}${random}`;
}

function generateSkuFromName(name: string, token?: string): string {
  const normalized = slugify(name).toUpperCase();
  const compact = normalized.replace(/-+/g, "-").slice(0, 40);
  const base = compact ? `GWIZ-${compact}` : "GWIZ";

  if (!token) {
    return base;
  }

  return `${base}-${token}`;
}

function getValidationDetailsMessage(details: unknown): string | null {
  if (!details || typeof details !== "object" || !("fieldErrors" in details)) {
    return null;
  }

  const fieldErrors = (details as { fieldErrors?: Record<string, string[] | undefined> }).fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return null;
  }

  const firstFieldWithError = Object.entries(fieldErrors).find(([, messages]) =>
    Array.isArray(messages) && messages.length > 0,
  );

  if (!firstFieldWithError) {
    return null;
  }

  const [field, messages] = firstFieldWithError;
  const message = messages?.[0];
  if (!message) {
    return null;
  }

  return `${field}: ${message}`;
}

export function ProductForm({ mode, categories, brands, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const { token } = useAuthStore();
  const createSkuTokenValue = useMemo(() => createSkuToken(), []);
  const currencyHint = mode === "create" ? " (AUD)" : "";

  const [name, setName] = useState(initialProduct?.name ?? "");
  const slug = useMemo(() => slugify(name), [name]);
  const generatedSku = useMemo(() => {
    if (mode === "edit") {
      return initialProduct?.sku?.trim() || generateSkuFromName(name, String(initialProduct?.id ?? "EDIT"));
    }

    return generateSkuFromName(name, createSkuTokenValue);
  }, [createSkuTokenValue, initialProduct?.id, initialProduct?.sku, mode, name]);
  const [shortDescription, setShortDescription] = useState(initialProduct?.shortDescription ?? "");
  const [price, setPrice] = useState(initialProduct ? String(initialProduct.originalPrice) : "");
  const [discountedPrice, setDiscountedPrice] = useState(
    initialProduct?.discountedPrice !== null && initialProduct?.discountedPrice !== undefined
      ? String(initialProduct.discountedPrice)
      : "",
  );
  const [loyalCustomerPrice, setLoyalCustomerPrice] = useState(
    initialProduct?.loyalCustomerPrice !== null && initialProduct?.loyalCustomerPrice !== undefined
      ? String(initialProduct.loyalCustomerPrice)
      : "",
  );
  const [stock, setStock] = useState(initialProduct ? String(initialProduct.stock) : "");
  const [categoryId, setCategoryId] = useState(
    initialProduct?.categoryId ? String(initialProduct.categoryId) : String(categories[0]?.id ?? ""),
  );
  const [brandId, setBrandId] = useState(initialProduct?.brandId ? String(initialProduct.brandId) : "");
  const [modelNumber, setModelNumber] = useState(initialProduct?.modelNumber ?? "");
  const [color, setColor] = useState(initialProduct?.color ?? "");
  const [warrantyMonths, setWarrantyMonths] = useState(
    initialProduct?.warrantyMonths !== null && initialProduct?.warrantyMonths !== undefined
      ? String(initialProduct.warrantyMonths)
      : "",
  );
  const [returnWindowDays, setReturnWindowDays] = useState(
    initialProduct?.returnWindowDays !== null && initialProduct?.returnWindowDays !== undefined
      ? String(initialProduct.returnWindowDays)
      : "",
  );
  const [weightGrams, setWeightGrams] = useState(
    initialProduct?.weightGrams !== null && initialProduct?.weightGrams !== undefined
      ? String(initialProduct.weightGrams)
      : "",
  );
  const [tagsInput, setTagsInput] = useState(initialProduct?.tags?.join(", ") ?? "");
  const [highlightPointsInput, setHighlightPointsInput] = useState(initialProduct?.highlightPoints?.join("\n") ?? "");
  const [metaTitle, setMetaTitle] = useState(initialProduct?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initialProduct?.metaDescription ?? "");
  const [ratingAvg, setRatingAvg] = useState(initialProduct ? String(initialProduct.ratingAvg) : "0");
  const [ratingCount, setRatingCount] = useState(initialProduct ? String(initialProduct.ratingCount) : "0");
  const [isFeatured, setIsFeatured] = useState(initialProduct?.isFeatured ?? false);
  const [isNewArrival, setIsNewArrival] = useState(initialProduct?.isNewArrival ?? false);
  const [isBestSeller, setIsBestSeller] = useState(initialProduct?.isBestSeller ?? false);
  const [isTopRated, setIsTopRated] = useState(initialProduct?.isTopRated ?? false);
  const [isTrending, setIsTrending] = useState(initialProduct?.isTrending ?? false);
  const [isLimitedStock, setIsLimitedStock] = useState(initialProduct?.isLimitedStock ?? false);
  const [isFreeDelivery, setIsFreeDelivery] = useState(initialProduct?.isFreeDelivery ?? false);
  const [isCashOnDelivery, setIsCashOnDelivery] = useState(initialProduct?.isCashOnDelivery ?? false);
  const [isEmiAvailable, setIsEmiAvailable] = useState(initialProduct?.isEmiAvailable ?? false);
  const [isOfficialWarranty, setIsOfficialWarranty] = useState(initialProduct?.isOfficialWarranty ?? false);
  const [isExchangeAvailable, setIsExchangeAvailable] = useState(initialProduct?.isExchangeAvailable ?? false);
  const [isPreorder, setIsPreorder] = useState(initialProduct?.isPreorder ?? false);
  const [images, setImages] = useState<string[]>(initialProduct?.images ?? []);
  const [description, setDescription] = useState(initialProduct?.description ?? "<p></p>");
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>(toSpecGroups(initialProduct?.specifications));
  const [isActive, setIsActive] = useState(initialProduct?.isActive ?? true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [busy, setBusy] = useState(false);

  const categoryOptions = useMemo(() => categories, [categories]);
  const parsedTags = tagsInput
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const maxTagLength = parsedTags.reduce((maxLength, entry) => Math.max(maxLength, entry.length), 0);
  const highlightLines = highlightPointsInput
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const maxHighlightLineLength = highlightLines.reduce((maxLength, entry) => Math.max(maxLength, entry.length), 0);

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

      const response = await apiClient.adminUploadCdnImage(file, token ?? undefined);
      setImages((previous) => {
        if (previous.includes(response.item.url)) {
          return previous;
        }
        return [...previous, response.item.url];
      });
      toast.success("Product image uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(index: number) {
    setImages((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleDescriptionImageUpload(file: File): Promise<string> {
    const response = await apiClient.adminUploadCdnImage(file, token ?? undefined);
    return response.item.url;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedDiscountedPrice = discountedPrice.trim() ? Number(discountedPrice) : null;
    const parsedLoyalCustomerPrice = loyalCustomerPrice.trim() ? Number(loyalCustomerPrice) : null;
    const parsedCategoryId = Number(categoryId);
    const parsedBrandId = brandId.trim() ? Number(brandId) : null;
    const parsedWarrantyMonths = warrantyMonths.trim() ? Number(warrantyMonths) : null;
    const parsedReturnWindowDays = returnWindowDays.trim() ? Number(returnWindowDays) : null;
    const parsedWeightGrams = weightGrams.trim() ? Number(weightGrams) : null;
    const parsedRatingAvg = Number(ratingAvg);
    const parsedRatingCount = Number(ratingCount);

    if (!name.trim() || !Number.isFinite(parsedPrice) || !Number.isFinite(parsedStock) || !parsedCategoryId || images.length === 0) {
      toast.error("Name, price, stock, category, and at least one uploaded image are required.");
      return;
    }

    if (
      name.trim().length > 200 ||
      shortDescription.trim().length > 500 ||
      modelNumber.trim().length > 120 ||
      color.trim().length > 80 ||
      metaTitle.trim().length > 255 ||
      metaDescription.trim().length > 500 ||
      generatedSku.trim().length > 120
    ) {
      toast.error("One or more text fields exceed allowed length (name, descriptions, model, color, SEO, or SKU).");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error("Original price must be a valid non-negative number.");
      return;
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      toast.error("Stock must be a non-negative whole number.");
      return;
    }

    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      toast.error("Category is invalid.");
      return;
    }

    if (parsedDiscountedPrice !== null && (!Number.isFinite(parsedDiscountedPrice) || parsedDiscountedPrice > parsedPrice)) {
      toast.error("Discounted price must be a valid number and cannot be higher than original price.");
      return;
    }

    if (parsedLoyalCustomerPrice !== null && (!Number.isFinite(parsedLoyalCustomerPrice) || parsedLoyalCustomerPrice > parsedPrice)) {
      toast.error("Loyal customer price must be a valid number and cannot be higher than original price.");
      return;
    }

    if (parsedDiscountedPrice !== null && parsedDiscountedPrice < 0) {
      toast.error("Discounted price cannot be negative.");
      return;
    }

    if (parsedLoyalCustomerPrice !== null && parsedLoyalCustomerPrice < 0) {
      toast.error("Loyal customer price cannot be negative.");
      return;
    }

    if ((parsedBrandId !== null && !Number.isInteger(parsedBrandId)) ||
      (parsedWarrantyMonths !== null && !Number.isInteger(parsedWarrantyMonths)) ||
      (parsedReturnWindowDays !== null && !Number.isInteger(parsedReturnWindowDays)) ||
      (parsedWeightGrams !== null && !Number.isInteger(parsedWeightGrams)) ||
      !Number.isFinite(parsedRatingAvg) ||
      !Number.isInteger(parsedRatingCount)) {
      toast.error("Please check numeric fields like brand, warranty, return window, weight, and ratings.");
      return;
    }

    if (
      (parsedWarrantyMonths !== null && (parsedWarrantyMonths < 0 || parsedWarrantyMonths > 240)) ||
      (parsedReturnWindowDays !== null && (parsedReturnWindowDays < 0 || parsedReturnWindowDays > 365)) ||
      (parsedWeightGrams !== null && (parsedWeightGrams < 0 || parsedWeightGrams > 100000))
    ) {
      toast.error("Warranty, return window, or weight is outside allowed range.");
      return;
    }

    if (parsedRatingAvg < 0 || parsedRatingAvg > 5 || parsedRatingCount < 0) {
      toast.error("Rating average must be between 0 and 5, and rating count must be non-negative.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    const highlightPoints = highlightPointsInput
      .split("\n")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    if (tags.length > 32 || tags.some((entry) => entry.length > 40)) {
      toast.error("Tags support up to 32 items, each up to 40 characters.");
      return;
    }

    if (highlightPoints.length > 12 || highlightPoints.some((entry) => entry.length > 120)) {
      toast.error("Highlight points support up to 12 lines, each up to 120 characters.");
      return;
    }

    try {
      setBusy(true);

      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        shortDescription: shortDescription.trim() || null,
        description,
        price: parsedPrice,
        originalPrice: parsedPrice,
        discountedPrice: parsedDiscountedPrice,
        loyalCustomerPrice: parsedLoyalCustomerPrice,
        stock: parsedStock,
        categoryId: parsedCategoryId,
        brandId: parsedBrandId,
        sku: generatedSku,
        modelNumber: modelNumber.trim() || null,
        color: color.trim() || null,
        warrantyMonths: parsedWarrantyMonths,
        returnWindowDays: parsedReturnWindowDays,
        weightGrams: parsedWeightGrams,
        tags,
        highlightPoints,
        metaTitle: metaTitle.trim() || null,
        metaDescription: metaDescription.trim() || null,
        ratingAvg: parsedRatingAvg,
        ratingCount: parsedRatingCount,
        isFeatured,
        isNewArrival,
        isBestSeller,
        isTopRated,
        isTrending,
        isLimitedStock,
        isFreeDelivery,
        isCashOnDelivery,
        isEmiAvailable,
        isOfficialWarranty,
        isExchangeAvailable,
        isPreorder,
        images,
        specifications: toSpecificationObject(specGroups),
        isActive,
      };

      if (mode === "create") {
        await apiClient.adminCreateProduct(payload, token ?? undefined);
      } else if (initialProduct) {
        await apiClient.adminUpdateProduct(initialProduct.id, payload, token ?? undefined);
      }

      toast.success(mode === "create" ? "Product created successfully." : "Product updated successfully.");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        const detailsMessage = getValidationDetailsMessage((error as { details?: unknown }).details);
        toast.error(detailsMessage ? `${error.message} (${detailsMessage})` : error.message);
      } else {
        toast.error("Unable to save product");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Create Product" : "Update Product"}</CardTitle>
          <CardDescription>Use rich content for descriptions and structured key/value specifications.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Field
            label={`Product Name (${name.length}/${PRODUCT_FIELD_LIMITS.name})`}
            labelClassName={getLimitLabelClass(name.length, PRODUCT_FIELD_LIMITS.name)}
          >
            <Input
              value={name}
              maxLength={PRODUCT_FIELD_LIMITS.name}
              onChange={(event) => setName(clampText(event.target.value, PRODUCT_FIELD_LIMITS.name))}
              placeholder="Product name"
            />
          </Field>
          <Field label="Slug">
            <Input value={slug} placeholder="Auto-generated from product name" readOnly disabled />
          </Field>
          <Field
            label={`Short Description (${shortDescription.length}/${PRODUCT_FIELD_LIMITS.shortDescription})`}
            labelClassName={getLimitLabelClass(shortDescription.length, PRODUCT_FIELD_LIMITS.shortDescription)}
          >
            <Input
              value={shortDescription}
              maxLength={PRODUCT_FIELD_LIMITS.shortDescription}
              onChange={(event) => setShortDescription(clampText(event.target.value, PRODUCT_FIELD_LIMITS.shortDescription))}
              placeholder="Short description (optional)"
            />
          </Field>
          <Field label={`Original Price${currencyHint}`}>
            <Input type="number" min={0} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder={mode === "create" ? "Original price in AUD (e.g. 199.99)" : "Original price"} />
          </Field>
          <Field label={`Discounted Price${currencyHint}`}>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={discountedPrice}
              onChange={(event) => setDiscountedPrice(event.target.value)}
              placeholder={mode === "create" ? "Discounted price in AUD (optional)" : "Discounted price (optional)"}
            />
          </Field>
          <Field label={`Loyal Customer Price${currencyHint}`}>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={loyalCustomerPrice}
              onChange={(event) => setLoyalCustomerPrice(event.target.value)}
              placeholder={mode === "create" ? "Loyal customer price in AUD (optional)" : "Loyal customer price (optional)"}
            />
          </Field>
          <Field label="Stock">
            <Input type="number" min={0} value={stock} onChange={(event) => setStock(event.target.value)} placeholder="Stock" />
          </Field>
          <Field label="Category">
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
            >
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Brand">
            <select
              value={brandId}
              onChange={(event) => setBrandId(event.target.value)}
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
            >
              <option value="">No brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="SKU">
            <Input value={generatedSku} placeholder="Auto-generated unique SKU (GWIZ)" readOnly disabled />
          </Field>
          <Field
            label={`Model Number (${modelNumber.length}/${PRODUCT_FIELD_LIMITS.modelNumber})`}
            labelClassName={getLimitLabelClass(modelNumber.length, PRODUCT_FIELD_LIMITS.modelNumber)}
          >
            <Input
              value={modelNumber}
              maxLength={PRODUCT_FIELD_LIMITS.modelNumber}
              onChange={(event) => setModelNumber(clampText(event.target.value, PRODUCT_FIELD_LIMITS.modelNumber))}
              placeholder="Model number (optional)"
            />
          </Field>
          <Field
            label={`Color (${color.length}/${PRODUCT_FIELD_LIMITS.color})`}
            labelClassName={getLimitLabelClass(color.length, PRODUCT_FIELD_LIMITS.color)}
          >
            <Input
              value={color}
              maxLength={PRODUCT_FIELD_LIMITS.color}
              onChange={(event) => setColor(clampText(event.target.value, PRODUCT_FIELD_LIMITS.color))}
              placeholder="Color (optional)"
            />
          </Field>
          <Field label="Warranty Months">
            <Input
              type="number"
              min={0}
              value={warrantyMonths}
              onChange={(event) => setWarrantyMonths(event.target.value)}
              placeholder="Warranty months"
            />
          </Field>
          <Field label="Return Window (Days)">
            <Input
              type="number"
              min={0}
              value={returnWindowDays}
              onChange={(event) => setReturnWindowDays(event.target.value)}
              placeholder="Return window (days)"
            />
          </Field>
          <Field label="Weight (Grams)">
            <Input
              type="number"
              min={0}
              value={weightGrams}
              onChange={(event) => setWeightGrams(event.target.value)}
              placeholder="Weight (grams)"
            />
          </Field>
          <Field
            label={`Tags (${parsedTags.length}/${TAG_LIMITS.maxTags}, each <= ${TAG_LIMITS.maxTagLength} chars)`}
            labelClassName={
              parsedTags.length >= TAG_LIMITS.maxTags || maxTagLength >= TAG_LIMITS.maxTagLength
                ? "font-semibold text-red-600 motion-safe:animate-pulse"
                : parsedTags.length >= Math.floor(TAG_LIMITS.maxTags * 0.75) || maxTagLength >= Math.floor(TAG_LIMITS.maxTagLength * 0.85)
                  ? "font-semibold text-orange-600"
                  : "font-medium text-zinc-700"
            }
          >
            <Input
              value={tagsInput}
              onChange={(event) => setTagsInput(clampTagsInput(event.target.value))}
              placeholder="Tags (comma separated)"
            />
          </Field>
          <Field
            label={`SEO Title (${metaTitle.length}/${PRODUCT_FIELD_LIMITS.metaTitle})`}
            labelClassName={getLimitLabelClass(metaTitle.length, PRODUCT_FIELD_LIMITS.metaTitle)}
          >
            <Input
              value={metaTitle}
              maxLength={PRODUCT_FIELD_LIMITS.metaTitle}
              onChange={(event) => setMetaTitle(clampText(event.target.value, PRODUCT_FIELD_LIMITS.metaTitle))}
              placeholder="SEO title (optional)"
            />
          </Field>
          <Field label="Rating Average">
            <Input
              type="number"
              min={0}
              max={5}
              step="0.1"
              value={ratingAvg}
              onChange={(event) => setRatingAvg(event.target.value)}
              placeholder="Rating average (0-5)"
            />
          </Field>
          <Field label="Rating Count">
            <Input
              type="number"
              min={0}
              value={ratingCount}
              onChange={(event) => setRatingCount(event.target.value)}
              placeholder="Rating count"
            />
          </Field>
          <Field
            label={`SEO Description (${metaDescription.length}/${PRODUCT_FIELD_LIMITS.metaDescription})`}
            className="col-span-full"
            labelClassName={getLimitLabelClass(metaDescription.length, PRODUCT_FIELD_LIMITS.metaDescription)}
          >
            <Textarea
              value={metaDescription}
              maxLength={PRODUCT_FIELD_LIMITS.metaDescription}
              onChange={(event) => setMetaDescription(clampText(event.target.value, PRODUCT_FIELD_LIMITS.metaDescription))}
              className="min-h-22.5"
              placeholder="SEO description (optional)"
            />
          </Field>
          <Field
            label={`Highlight Points (${highlightLines.length}/${HIGHLIGHT_LIMITS.maxLines}, each <= ${HIGHLIGHT_LIMITS.maxLineLength} chars)`}
            className="col-span-full"
            labelClassName={
              highlightLines.length >= HIGHLIGHT_LIMITS.maxLines || maxHighlightLineLength >= HIGHLIGHT_LIMITS.maxLineLength
                ? "font-semibold text-red-600 motion-safe:animate-pulse"
                : highlightLines.length >= Math.floor(HIGHLIGHT_LIMITS.maxLines * 0.75) || maxHighlightLineLength >= Math.floor(HIGHLIGHT_LIMITS.maxLineLength * 0.85)
                  ? "font-semibold text-orange-600"
                  : "font-medium text-zinc-700"
            }
          >
            <Textarea
              value={highlightPointsInput}
              onChange={(event) => setHighlightPointsInput(clampHighlightPointsInput(event.target.value))}
              className="min-h-25"
              placeholder="Highlight points (one per line)"
            />
          </Field>

          <div className="col-span-full grid gap-2 rounded-md border border-zinc-200 p-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} /> Featured</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isNewArrival} onChange={(event) => setIsNewArrival(event.target.checked)} /> New Arrival</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isBestSeller} onChange={(event) => setIsBestSeller(event.target.checked)} /> Best Seller</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isTopRated} onChange={(event) => setIsTopRated(event.target.checked)} /> Top Rated</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isTrending} onChange={(event) => setIsTrending(event.target.checked)} /> Trending</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isLimitedStock} onChange={(event) => setIsLimitedStock(event.target.checked)} /> Limited Stock</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFreeDelivery} onChange={(event) => setIsFreeDelivery(event.target.checked)} /> Free Delivery</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isCashOnDelivery} onChange={(event) => setIsCashOnDelivery(event.target.checked)} /> Cash On Delivery</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isEmiAvailable} onChange={(event) => setIsEmiAvailable(event.target.checked)} /> EMI Available</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isOfficialWarranty} onChange={(event) => setIsOfficialWarranty(event.target.checked)} /> Official Warranty</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isExchangeAvailable} onChange={(event) => setIsExchangeAvailable(event.target.checked)} /> Exchange Available</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPreorder} onChange={(event) => setIsPreorder(event.target.checked)} /> Preorder</label>
          </div>

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
                    const input = event.currentTarget;
                    const file = input.files?.[0] ?? null;
                    input.value = "";
                    await handleImageUpload(file);
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
          <RichTextEditor
            value={description}
            onChange={setDescription}
            onImageUpload={handleDescriptionImageUpload}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
          <CardDescription>
            Organize technical details into titled sections like Display and Processor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {specGroups.map((group, groupIndex) => (
            <div key={`group-${groupIndex}`} className="space-y-3 rounded-md border border-zinc-200 p-3">
              <div className="flex items-end gap-2">
                <label className="flex-1 space-y-1">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Section Title</span>
                  <Input
                    value={group.title}
                    onChange={(event) => updateSpecGroup(groupIndex, { title: event.target.value })}
                    placeholder="Section title (e.g., Display)"
                  />
                </label>
                <Button type="button" variant="destructive" size="icon" onClick={() => removeSpecGroup(groupIndex)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {group.rows.map((row, rowIndex) => (
                <div key={`row-${groupIndex}-${rowIndex}`} className="flex items-end gap-2 md:grid md:grid-cols-[1fr_1fr_auto]">
                  <label className="flex-1 space-y-1">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Key</span>
                    <Input
                      value={row.key}
                      onChange={(event) => updateSpecRow(groupIndex, rowIndex, { key: event.target.value })}
                      placeholder="Key"
                    />
                  </label>
                  <label className="flex-1 space-y-1">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Value</span>
                    <Input
                      value={row.value}
                      onChange={(event) => updateSpecRow(groupIndex, rowIndex, { value: event.target.value })}
                      placeholder="Value"
                    />
                  </label>
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeSpecRow(groupIndex, rowIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={() => addSpecRow(groupIndex)}>
                <Plus className="h-4 w-4" /> Add Entry
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addSpecGroup}>
            <Plus className="h-4 w-4" /> Add Specification Section
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
