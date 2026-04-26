import {
  countCartItemsByProductId,
  createProduct,
  deleteProduct,
  findProductById,
  findProductBySlug,
  getProductFilterFacets,
  listProducts,
  type ProductAvailabilityFilter,
  type ProductSortOption,
  updateProduct,
} from "@/lib/server/repositories/product-repository";
import { findCategoryById } from "@/lib/server/repositories/category-repository";
import { findBrandById } from "@/lib/server/repositories/brand-repository";
import { badRequest, conflict, notFound } from "@/lib/server/core/errors";
import { assertValidCdnUrls } from "@/lib/server/utils/cdn";
import { slugify } from "@/lib/server/utils/slug";

type MySqlError = {
  code?: string;
  errno?: number;
};

function isForeignKeyConstraintError(error: unknown): boolean {
  const dbError = error as MySqlError;
  return dbError?.code === "ER_ROW_IS_REFERENCED_2" || dbError?.errno === 1451;
}

interface ProductAdminInput {
  name: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string | null;
  price?: number;
  originalPrice?: number;
  discountedPrice?: number | null;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number | null;
  stock: number;
  categoryId: number;
  brandId?: number | null;
  sku?: string | null;
  modelNumber?: string | null;
  color?: string | null;
  warrantyMonths?: number | null;
  returnWindowDays?: number | null;
  weightGrams?: number | null;
  tags?: string[] | null;
  highlightPoints?: string[] | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isTopRated?: boolean;
  isTrending?: boolean;
  isLimitedStock?: boolean;
  isFreeDelivery?: boolean;
  isCashOnDelivery?: boolean;
  isEmiAvailable?: boolean;
  isOfficialWarranty?: boolean;
  isExchangeAvailable?: boolean;
  isPreorder?: boolean;
  images: string[];
  specifications?: Record<string, unknown> | null;
  isActive?: boolean;
}

function sanitizeStringList(values?: string[] | null): string[] {
  if (!values || values.length === 0) {
    return [];
  }

  return values.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}

function normalizeProductInput(input: ProductAdminInput): {
  originalPrice: number;
  discountedPrice: number | null;
  wholesalePrice: number | null;
  wholesaleMinQuantity: number | null;
} {
  const originalPrice = input.originalPrice ?? input.price;
  if (originalPrice === undefined) {
    throw badRequest("Original price is required");
  }

  if (input.discountedPrice !== null && input.discountedPrice !== undefined && input.discountedPrice > originalPrice) {
    throw badRequest("Discounted price cannot exceed original price");
  }

  if (
    input.wholesalePrice !== undefined &&
    input.wholesalePrice !== null &&
    input.wholesalePrice > originalPrice
  ) {
    throw badRequest("Wholesale price cannot exceed original price");
  }

  const hasWholesalePrice = input.wholesalePrice !== undefined && input.wholesalePrice !== null;
  const hasWholesaleMinQuantity =
    input.wholesaleMinQuantity !== undefined && input.wholesaleMinQuantity !== null;

  if (hasWholesalePrice !== hasWholesaleMinQuantity) {
    throw badRequest("Wholesale price and minimum quantity must be provided together");
  }

  if (hasWholesaleMinQuantity && Number(input.wholesaleMinQuantity) < 2) {
    throw badRequest("Wholesale minimum quantity must be at least 2");
  }

  return {
    originalPrice,
    discountedPrice: input.discountedPrice ?? null,
    wholesalePrice: input.wholesalePrice ?? null,
    wholesaleMinQuantity: input.wholesaleMinQuantity ?? null,
  };
}

export async function getPublicProducts(input: {
  page: number;
  pageSize: number;
  categorySlug?: string;
  brandSlug?: string;
  brandSlugs?: string[];
  colors?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: ProductAvailabilityFilter;
  sort?: ProductSortOption[];
  discountedOnly?: boolean;
  newArrivalsOnly?: boolean;
  bestSellersOnly?: boolean;
}) {
  return listProducts({
    page: input.page,
    pageSize: input.pageSize,
    categorySlug: input.categorySlug,
    brandSlug: input.brandSlug,
    brandSlugs: input.brandSlugs,
    colors: input.colors,
    search: input.search,
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
    availability: input.availability,
    sort: input.sort,
    discountedOnly: input.discountedOnly,
    newArrivalsOnly: input.newArrivalsOnly,
    bestSellersOnly: input.bestSellersOnly,
    activeOnly: true,
  });
}

export async function getPublicProductFilterFacets(input: {
  categorySlug?: string;
  search?: string;
  discountedOnly?: boolean;
  newArrivalsOnly?: boolean;
  bestSellersOnly?: boolean;
}) {
  return getProductFilterFacets({
    categorySlug: input.categorySlug,
    search: input.search,
    discountedOnly: input.discountedOnly,
    newArrivalsOnly: input.newArrivalsOnly,
    bestSellersOnly: input.bestSellersOnly,
    activeOnly: true,
  });
}

export async function getAdminProducts(input: {
  page: number;
  pageSize: number;
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
}) {
  return listProducts({
    page: input.page,
    pageSize: input.pageSize,
    categorySlug: input.categorySlug,
    brandSlug: input.brandSlug,
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
  shortDescription?: string | null;
  description?: string | null;
  price?: number;
  originalPrice?: number;
  discountedPrice?: number | null;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number | null;
  stock: number;
  categoryId: number;
  brandId?: number | null;
  sku?: string | null;
  modelNumber?: string | null;
  color?: string | null;
  warrantyMonths?: number | null;
  returnWindowDays?: number | null;
  weightGrams?: number | null;
  tags?: string[] | null;
  highlightPoints?: string[] | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isTopRated?: boolean;
  isTrending?: boolean;
  isLimitedStock?: boolean;
  isFreeDelivery?: boolean;
  isCashOnDelivery?: boolean;
  isEmiAvailable?: boolean;
  isOfficialWarranty?: boolean;
  isExchangeAvailable?: boolean;
  isPreorder?: boolean;
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

  if (input.brandId !== null && input.brandId !== undefined) {
    const brand = await findBrandById(input.brandId);
    if (!brand) {
      throw badRequest("Brand not found");
    }
  }

  assertValidCdnUrls(input.images);

  const pricing = normalizeProductInput(input);

  return createProduct({
    name: input.name.trim(),
    slug: normalizedSlug,
    shortDescription: input.shortDescription ?? null,
    description: input.description ?? null,
    originalPrice: pricing.originalPrice,
    discountedPrice: pricing.discountedPrice,
    wholesalePrice: pricing.wholesalePrice,
    wholesaleMinQuantity: pricing.wholesaleMinQuantity,
    stock: input.stock,
    categoryId: input.categoryId,
    brandId: input.brandId ?? null,
    sku: input.sku ?? null,
    modelNumber: input.modelNumber ?? null,
    color: input.color ?? null,
    warrantyMonths: input.warrantyMonths ?? null,
    returnWindowDays: input.returnWindowDays ?? null,
    weightGrams: input.weightGrams ?? null,
    tags: sanitizeStringList(input.tags),
    highlightPoints: sanitizeStringList(input.highlightPoints),
    metaTitle: input.metaTitle ?? null,
    metaDescription: input.metaDescription ?? null,
    ratingAvg: input.ratingAvg ?? 0,
    ratingCount: input.ratingCount ?? 0,
    isFeatured: input.isFeatured ?? false,
    isNewArrival: input.isNewArrival ?? false,
    isBestSeller: input.isBestSeller ?? false,
    isTopRated: input.isTopRated ?? false,
    isTrending: input.isTrending ?? false,
    isLimitedStock: input.isLimitedStock ?? false,
    isFreeDelivery: input.isFreeDelivery ?? false,
    isCashOnDelivery: input.isCashOnDelivery ?? false,
    isEmiAvailable: input.isEmiAvailable ?? false,
    isOfficialWarranty: input.isOfficialWarranty ?? false,
    isExchangeAvailable: input.isExchangeAvailable ?? false,
    isPreorder: input.isPreorder ?? false,
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
    shortDescription?: string | null;
    description?: string | null;
    price?: number;
    originalPrice?: number;
    discountedPrice?: number | null;
    wholesalePrice?: number | null;
    wholesaleMinQuantity?: number | null;
    stock: number;
    categoryId: number;
    brandId?: number | null;
    sku?: string | null;
    modelNumber?: string | null;
    color?: string | null;
    warrantyMonths?: number | null;
    returnWindowDays?: number | null;
    weightGrams?: number | null;
    tags?: string[] | null;
    highlightPoints?: string[] | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    ratingAvg?: number;
    ratingCount?: number;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    isTopRated?: boolean;
    isTrending?: boolean;
    isLimitedStock?: boolean;
    isFreeDelivery?: boolean;
    isCashOnDelivery?: boolean;
    isEmiAvailable?: boolean;
    isOfficialWarranty?: boolean;
    isExchangeAvailable?: boolean;
    isPreorder?: boolean;
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

  if (input.brandId !== null && input.brandId !== undefined) {
    const brand = await findBrandById(input.brandId);
    if (!brand) {
      throw badRequest("Brand not found");
    }
  }

  assertValidCdnUrls(input.images);
  const pricing = normalizeProductInput(input);

  const updated = await updateProduct(id, {
    name: input.name.trim(),
    slug: normalizedSlug,
    shortDescription: input.shortDescription !== undefined ? input.shortDescription : existing.shortDescription,
    description: input.description !== undefined ? input.description : existing.description,
    originalPrice: pricing.originalPrice,
    discountedPrice: pricing.discountedPrice,
    wholesalePrice: pricing.wholesalePrice,
    wholesaleMinQuantity: pricing.wholesaleMinQuantity,
    stock: input.stock,
    categoryId: input.categoryId,
    brandId: input.brandId !== undefined ? input.brandId : existing.brandId,
    sku: input.sku !== undefined ? input.sku : existing.sku,
    modelNumber: input.modelNumber !== undefined ? input.modelNumber : existing.modelNumber,
    color: input.color !== undefined ? input.color : existing.color,
    warrantyMonths: input.warrantyMonths !== undefined ? input.warrantyMonths : existing.warrantyMonths,
    returnWindowDays: input.returnWindowDays !== undefined ? input.returnWindowDays : existing.returnWindowDays,
    weightGrams: input.weightGrams !== undefined ? input.weightGrams : existing.weightGrams,
    tags: sanitizeStringList(input.tags ?? existing.tags),
    highlightPoints: sanitizeStringList(input.highlightPoints ?? existing.highlightPoints),
    metaTitle: input.metaTitle !== undefined ? input.metaTitle : existing.metaTitle,
    metaDescription: input.metaDescription !== undefined ? input.metaDescription : existing.metaDescription,
    ratingAvg: input.ratingAvg ?? existing.ratingAvg,
    ratingCount: input.ratingCount ?? existing.ratingCount,
    isFeatured: input.isFeatured ?? existing.isFeatured,
    isNewArrival: input.isNewArrival ?? existing.isNewArrival,
    isBestSeller: input.isBestSeller ?? existing.isBestSeller,
    isTopRated: input.isTopRated ?? existing.isTopRated,
    isTrending: input.isTrending ?? existing.isTrending,
    isLimitedStock: input.isLimitedStock ?? existing.isLimitedStock,
    isFreeDelivery: input.isFreeDelivery ?? existing.isFreeDelivery,
    isCashOnDelivery: input.isCashOnDelivery ?? existing.isCashOnDelivery,
    isEmiAvailable: input.isEmiAvailable ?? existing.isEmiAvailable,
    isOfficialWarranty: input.isOfficialWarranty ?? existing.isOfficialWarranty,
    isExchangeAvailable: input.isExchangeAvailable ?? existing.isExchangeAvailable,
    isPreorder: input.isPreorder ?? existing.isPreorder,
    images: input.images,
    specifications: input.specifications !== undefined ? input.specifications : existing.specifications,
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

  const linkedCartItemCount = await countCartItemsByProductId(id);
  if (linkedCartItemCount > 0) {
    throw conflict(
      "Cannot delete this product because it is currently present in one or more carts. Remove it from carts first.",
    );
  }

  try {
    await deleteProduct(id);
  } catch (error) {
    // Defensive fallback for race conditions where a cart item is created after the pre-check.
    if (isForeignKeyConstraintError(error)) {
      throw conflict(
        "Cannot delete this product because it is currently present in one or more carts. Remove it from carts first.",
      );
    }

    throw error;
  }
}
