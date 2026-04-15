import {
  createBrand,
  deleteBrand,
  findBrandById,
  findBrandBySlug,
  listBrands,
  updateBrand,
  type BrandRecord,
} from "@/lib/server/repositories/brand-repository";
import { badRequest, notFound } from "@/lib/server/core/errors";
import { slugify } from "@/lib/server/utils/slug";
import { assertValidCdnUrls } from "@/lib/server/utils/cdn";

export async function getPublicBrands(): Promise<BrandRecord[]> {
  return listBrands(true);
}

export async function getPublicBrandBySlug(slug: string): Promise<BrandRecord> {
  const brand = await findBrandBySlug(slug);
  if (!brand || !brand.isActive) {
    throw notFound("Brand not found");
  }

  return brand;
}

export async function getAdminBrands(): Promise<BrandRecord[]> {
  return listBrands(false);
}

export async function getAdminBrandById(id: number): Promise<BrandRecord> {
  const brand = await findBrandById(id);
  if (!brand) {
    throw notFound("Brand not found");
  }

  return brand;
}

export async function createBrandAdmin(input: {
  name: string;
  slug?: string;
  imageUrl?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}): Promise<BrandRecord> {
  const normalizedSlug = slugify(input.slug ?? input.name);
  if (!normalizedSlug) {
    throw badRequest("Brand slug cannot be empty");
  }

  if (input.imageUrl) {
    assertValidCdnUrls([input.imageUrl]);
  }

  return createBrand({
    name: input.name.trim(),
    slug: normalizedSlug,
    imageUrl: input.imageUrl ?? null,
    description: input.description ?? null,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
    isFeatured: input.isFeatured ?? false,
  });
}

export async function updateBrandAdmin(
  id: number,
  input: {
    name: string;
    slug?: string;
    imageUrl?: string | null;
    description?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    isFeatured?: boolean;
  },
): Promise<BrandRecord> {
  const existing = await findBrandById(id);
  if (!existing) {
    throw notFound("Brand not found");
  }

  const normalizedSlug = slugify(input.slug ?? input.name);
  if (!normalizedSlug) {
    throw badRequest("Brand slug cannot be empty");
  }

  if (input.imageUrl) {
    assertValidCdnUrls([input.imageUrl]);
  }

  const updated = await updateBrand(id, {
    name: input.name.trim(),
    slug: normalizedSlug,
    imageUrl: input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl,
    description: input.description !== undefined ? input.description : existing.description,
    sortOrder: input.sortOrder ?? existing.sortOrder,
    isActive: input.isActive ?? existing.isActive,
    isFeatured: input.isFeatured ?? existing.isFeatured,
  });

  if (!updated) {
    throw notFound("Brand not found");
  }

  return updated;
}

export async function deleteBrandAdmin(id: number): Promise<void> {
  const existing = await findBrandById(id);
  if (!existing) {
    throw notFound("Brand not found");
  }

  await deleteBrand(id);
}
