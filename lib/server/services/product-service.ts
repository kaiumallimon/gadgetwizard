import {
  createProduct,
  deleteProduct,
  findProductById,
  findProductBySlug,
  listProducts,
  updateProduct,
} from "@/lib/server/repositories/product-repository";
import { findCategoryById } from "@/lib/server/repositories/category-repository";
import { badRequest, notFound } from "@/lib/server/core/errors";
import { assertValidCdnUrls } from "@/lib/server/utils/cdn";
import { slugify } from "@/lib/server/utils/slug";

export async function getPublicProducts(input: {
  page: number;
  pageSize: number;
  categorySlug?: string;
  search?: string;
}) {
  return listProducts({
    page: input.page,
    pageSize: input.pageSize,
    categorySlug: input.categorySlug,
    search: input.search,
    activeOnly: true,
  });
}

export async function getAdminProducts(input: {
  page: number;
  pageSize: number;
  categorySlug?: string;
  search?: string;
}) {
  return listProducts({
    page: input.page,
    pageSize: input.pageSize,
    categorySlug: input.categorySlug,
    search: input.search,
    activeOnly: false,
  });
}

export async function getAdminProductById(id: number) {
  const product = await findProductById(id, false);
  if (!product) {
    throw notFound("Product not found");
  }

  return product;
}

export async function getPublicProductBySlug(slug: string) {
  const product = await findProductBySlug(slug, true);
  if (!product) {
    throw notFound("Product not found");
  }

  return product;
}

export async function createProductAdmin(input: {
  name: string;
  slug?: string;
  description?: string | null;
  price: number;
  discountedPrice?: number | null;
  stock: number;
  categoryId: number;
  images: string[];
  specifications?: Record<string, unknown> | null;
  isActive?: boolean;
}) {
  const category = await findCategoryById(input.categoryId);
  if (!category) {
    throw badRequest("Category not found");
  }

  const normalizedSlug = slugify(input.slug ?? input.name);
  if (!normalizedSlug) {
    throw badRequest("Product slug cannot be empty");
  }

  assertValidCdnUrls(input.images);

  if (input.discountedPrice !== null && input.discountedPrice !== undefined && input.discountedPrice > input.price) {
    throw badRequest("Discounted price cannot exceed base price");
  }

  return createProduct({
    name: input.name.trim(),
    slug: normalizedSlug,
    description: input.description ?? null,
    price: input.price,
    discountedPrice: input.discountedPrice ?? null,
    stock: input.stock,
    categoryId: input.categoryId,
    images: input.images,
    specifications: input.specifications ?? null,
    isActive: input.isActive ?? true,
  });
}

export async function updateProductAdmin(
  id: number,
  input: {
    name: string;
    slug?: string;
    description?: string | null;
    price: number;
    discountedPrice?: number | null;
    stock: number;
    categoryId: number;
    images: string[];
    specifications?: Record<string, unknown> | null;
    isActive?: boolean;
  },
) {
  const existing = await findProductById(id, false);
  if (!existing) {
    throw notFound("Product not found");
  }

  const category = await findCategoryById(input.categoryId);
  if (!category) {
    throw badRequest("Category not found");
  }

  const normalizedSlug = slugify(input.slug ?? input.name);
  if (!normalizedSlug) {
    throw badRequest("Product slug cannot be empty");
  }

  assertValidCdnUrls(input.images);

  if (input.discountedPrice !== null && input.discountedPrice !== undefined && input.discountedPrice > input.price) {
    throw badRequest("Discounted price cannot exceed base price");
  }

  const updated = await updateProduct(id, {
    name: input.name.trim(),
    slug: normalizedSlug,
    description: input.description ?? null,
    price: input.price,
    discountedPrice: input.discountedPrice ?? null,
    stock: input.stock,
    categoryId: input.categoryId,
    images: input.images,
    specifications: input.specifications ?? null,
    isActive: input.isActive ?? existing.isActive,
  });

  if (!updated) {
    throw notFound("Product not found");
  }

  return updated;
}

export async function deleteProductAdmin(id: number): Promise<void> {
  const existing = await findProductById(id, false);
  if (!existing) {
    throw notFound("Product not found");
  }

  await deleteProduct(id);
}
