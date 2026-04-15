import { execute, queryOne, queryRows } from "@/lib/server/core/db";

export interface ProductRecord {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  originalPrice: number;
  discountedPrice: number | null;
  loyalCustomerPrice: number;
  stock: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  brandId: number | null;
  brandName: string | null;
  brandSlug: string | null;
  brandImageUrl: string | null;
  sku: string | null;
  modelNumber: string | null;
  color: string | null;
  warrantyMonths: number | null;
  returnWindowDays: number | null;
  weightGrams: number | null;
  tags: string[];
  highlightPoints: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  ratingAvg: number;
  ratingCount: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTopRated: boolean;
  isTrending: boolean;
  isLimitedStock: boolean;
  isFreeDelivery: boolean;
  isCashOnDelivery: boolean;
  isEmiAvailable: boolean;
  isOfficialWarranty: boolean;
  isExchangeAvailable: boolean;
  isPreorder: boolean;
  images: string[];
  specifications: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductRow {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: string | number;
  original_price: string | number;
  discounted_price: string | number | null;
  loyal_customer_price: string | number;
  stock: number;
  category_id: number;
  category_name: string;
  category_slug: string;
  brand_id: number | null;
  brand_name: string | null;
  brand_slug: string | null;
  brand_image_url: string | null;
  sku: string | null;
  model_number: string | null;
  color: string | null;
  warranty_months: number | null;
  return_window_days: number | null;
  weight_grams: number | null;
  tags: string | null;
  highlight_points: string | null;
  meta_title: string | null;
  meta_description: string | null;
  rating_avg: string | number;
  rating_count: number;
  is_featured: number;
  is_new_arrival: number;
  is_best_seller: number;
  is_top_rated: number;
  is_trending: number;
  is_limited_stock: number;
  is_free_delivery: number;
  is_cash_on_delivery: number;
  is_emi_available: number;
  is_official_warranty: number;
  is_exchange_available: number;
  is_preorder: number;
  images: string;
  specifications: string | null;
  is_active: number;
  created_at: Date | string;
  updated_at: Date | string;
}

interface ProductCountRow {
  total: number;
}

interface ProductFacetSummaryRow {
  min_price: string | number | null;
  max_price: string | number | null;
  in_stock_total: number;
  out_stock_total: number;
}

interface ProductFacetBrandRow {
  brand_slug: string;
  brand_name: string;
  total: number;
}

interface ProductFacetColorRow {
  color: string | null;
}

export type ProductAvailabilityFilter = "all" | "in" | "out";

export type ProductSortOption =
  | "newest"
  | "oldest"
  | "price_low"
  | "price_high"
  | "rating_high"
  | "rating_low"
  | "name_az"
  | "name_za"
  | "stock_high"
  | "stock_low";

const PRODUCT_SORT_SQL: Record<ProductSortOption, string> = {
  newest: "p.created_at DESC",
  oldest: "p.created_at ASC",
  price_low: "COALESCE(p.discounted_price, p.original_price) ASC",
  price_high: "COALESCE(p.discounted_price, p.original_price) DESC",
  rating_high: "p.rating_avg DESC, p.rating_count DESC",
  rating_low: "p.rating_avg ASC, p.rating_count ASC",
  name_az: "p.name ASC",
  name_za: "p.name DESC",
  stock_high: "p.stock DESC",
  stock_low: "p.stock ASC",
};

const NORMALIZED_COLOR_SQL =
  "REPLACE(REPLACE(REPLACE(LOWER(COALESCE(p.color, '')), ', ', ','), ' ,', ','), ',,', ',')";

function normalizeColorToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeColorLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeSortOptions(sort?: ProductSortOption[]): ProductSortOption[] {
  if (!sort || sort.length === 0) {
    return ["newest"];
  }

  const unique: ProductSortOption[] = [];
  for (const candidate of sort) {
    if (!(candidate in PRODUCT_SORT_SQL)) {
      continue;
    }

    if (unique.includes(candidate)) {
      continue;
    }

    unique.push(candidate);
  }

  return unique.length > 0 ? unique : ["newest"];
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseJson<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  return JSON.parse(value) as T;
}

function mapProduct(row: ProductRow): ProductRecord {
  const originalPrice = Number(row.original_price ?? row.price);
  const discountedPrice = row.discounted_price === null ? null : Number(row.discounted_price);
  const loyalCustomerPrice = Number(row.loyal_customer_price ?? discountedPrice ?? originalPrice);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description,
    description: row.description,
    price: originalPrice,
    originalPrice,
    discountedPrice,
    loyalCustomerPrice,
    stock: row.stock,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    brandId: row.brand_id,
    brandName: row.brand_name,
    brandSlug: row.brand_slug,
    brandImageUrl: row.brand_image_url,
    sku: row.sku,
    modelNumber: row.model_number,
    color: row.color,
    warrantyMonths: row.warranty_months,
    returnWindowDays: row.return_window_days,
    weightGrams: row.weight_grams,
    tags: parseJson<string[]>(row.tags) ?? [],
    highlightPoints: parseJson<string[]>(row.highlight_points) ?? [],
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    ratingAvg: Number(row.rating_avg),
    ratingCount: row.rating_count,
    isFeatured: row.is_featured === 1,
    isNewArrival: row.is_new_arrival === 1,
    isBestSeller: row.is_best_seller === 1,
    isTopRated: row.is_top_rated === 1,
    isTrending: row.is_trending === 1,
    isLimitedStock: row.is_limited_stock === 1,
    isFreeDelivery: row.is_free_delivery === 1,
    isCashOnDelivery: row.is_cash_on_delivery === 1,
    isEmiAvailable: row.is_emi_available === 1,
    isOfficialWarranty: row.is_official_warranty === 1,
    isExchangeAvailable: row.is_exchange_available === 1,
    isPreorder: row.is_preorder === 1,
    images: parseJson<string[]>(row.images) ?? [],
    specifications: parseJson<Record<string, unknown>>(row.specifications),
    isActive: row.is_active === 1,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function buildProductWhereClause(input: {
  activeOnly: boolean;
  categorySlug?: string;
  brandSlug?: string;
  brandSlugs?: string[];
  colors?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: ProductAvailabilityFilter;
}) {
  const whereParts: string[] = [];
  const whereParams: unknown[] = [];

  if (input.activeOnly) {
    whereParts.push("p.is_active = 1");
  }

  if (input.categorySlug) {
    whereParts.push("c.slug = ?");
    whereParams.push(input.categorySlug);
  }

  const normalizedBrandSlugs = (input.brandSlugs ?? []).filter((slug) => slug.trim().length > 0);
  if (normalizedBrandSlugs.length > 0) {
    const placeholders = normalizedBrandSlugs.map(() => "?").join(", ");
    whereParts.push(`b.slug IN (${placeholders})`);
    whereParams.push(...normalizedBrandSlugs);
  } else if (input.brandSlug) {
    whereParts.push("b.slug = ?");
    whereParams.push(input.brandSlug);
  }

  if (input.search) {
    whereParts.push("(p.name LIKE ? OR p.short_description LIKE ? OR p.description LIKE ?)");
    whereParams.push(`%${input.search}%`, `%${input.search}%`, `%${input.search}%`);
  }

  const normalizedColors = Array.from(
    new Set((input.colors ?? []).map(normalizeColorToken).filter((value) => value.length > 0)),
  );
  if (normalizedColors.length > 0) {
    const colorConditions = normalizedColors
      .map(() => `FIND_IN_SET(?, ${NORMALIZED_COLOR_SQL}) > 0`)
      .join(" OR ");
    whereParts.push(`(${colorConditions})`);
    whereParams.push(...normalizedColors);
  }

  if (input.minPrice !== undefined) {
    whereParts.push("COALESCE(p.discounted_price, p.original_price) >= ?");
    whereParams.push(input.minPrice);
  }

  if (input.maxPrice !== undefined) {
    whereParts.push("COALESCE(p.discounted_price, p.original_price) <= ?");
    whereParams.push(input.maxPrice);
  }

  if (input.availability === "in") {
    whereParts.push("p.stock > 0");
  } else if (input.availability === "out") {
    whereParts.push("p.stock = 0");
  }

  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

  return {
    whereClause,
    whereParams,
  };
}

export async function listProducts(input: {
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
  activeOnly: boolean;
}): Promise<{ items: ProductRecord[]; total: number }> {
  const { whereClause, whereParams } = buildProductWhereClause(input);
  const sortOptions = normalizeSortOptions(input.sort);
  const orderBy = sortOptions.map((item) => PRODUCT_SORT_SQL[item]).join(", ");
  const offset = (input.page - 1) * input.pageSize;

  const rows = await queryRows<ProductRow>(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.short_description,
        p.description,
        p.price,
        p.original_price,
        p.discounted_price,
        p.loyal_customer_price,
        p.stock,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.brand_id,
        b.name AS brand_name,
        b.slug AS brand_slug,
        b.image_url AS brand_image_url,
        p.sku,
        p.model_number,
        p.color,
        p.warranty_months,
        p.return_window_days,
        p.weight_grams,
        p.tags,
        p.highlight_points,
        p.meta_title,
        p.meta_description,
        p.rating_avg,
        p.rating_count,
        p.is_featured,
        p.is_new_arrival,
        p.is_best_seller,
        p.is_top_rated,
        p.is_trending,
        p.is_limited_stock,
        p.is_free_delivery,
        p.is_cash_on_delivery,
        p.is_emi_available,
        p.is_official_warranty,
        p.is_exchange_available,
        p.is_preorder,
        p.images,
        p.specifications,
        p.is_active,
        p.created_at,
        p.updated_at
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      ${whereClause}
      ORDER BY ${orderBy}, p.id DESC
      LIMIT ? OFFSET ?
    `,
    [...whereParams, input.pageSize, offset],
  );

  const countRow = await queryOne<ProductCountRow>(
    `
      SELECT COUNT(*) AS total
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      ${whereClause}
    `,
    whereParams,
  );

  return {
    items: rows.map(mapProduct),
    total: countRow?.total ?? 0,
  };
}

export async function getProductFilterFacets(input: {
  categorySlug?: string;
  search?: string;
  activeOnly: boolean;
}): Promise<{
  price: { min: number | null; max: number | null };
  availability: { inStock: number; outOfStock: number };
  brands: Array<{ slug: string; name: string; total: number }>;
  colors: Array<{ value: string; label: string; total: number }>;
}> {
  const { whereClause, whereParams } = buildProductWhereClause({
    activeOnly: input.activeOnly,
    categorySlug: input.categorySlug,
    search: input.search,
    availability: "all",
  });

  const summaryRow = await queryOne<ProductFacetSummaryRow>(
    `
      SELECT
        MIN(COALESCE(p.discounted_price, p.original_price)) AS min_price,
        MAX(COALESCE(p.discounted_price, p.original_price)) AS max_price,
        SUM(CASE WHEN p.stock > 0 THEN 1 ELSE 0 END) AS in_stock_total,
        SUM(CASE WHEN p.stock = 0 THEN 1 ELSE 0 END) AS out_stock_total
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      ${whereClause}
    `,
    whereParams,
  );

  const brandWhereClause = whereClause ? `${whereClause} AND b.id IS NOT NULL` : "WHERE b.id IS NOT NULL";
  const brandRows = await queryRows<ProductFacetBrandRow>(
    `
      SELECT
        b.slug AS brand_slug,
        b.name AS brand_name,
        COUNT(*) AS total
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      ${brandWhereClause}
      GROUP BY b.id, b.slug, b.name
      ORDER BY b.name ASC
    `,
    whereParams,
  );

  const colorWhereClause = whereClause
    ? `${whereClause} AND p.color IS NOT NULL AND p.color <> ''`
    : "WHERE p.color IS NOT NULL AND p.color <> ''";

  const colorRows = await queryRows<ProductFacetColorRow>(
    `
      SELECT p.color
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      ${colorWhereClause}
    `,
    whereParams,
  );

  const colorMap = new Map<string, { value: string; label: string; total: number }>();
  for (const row of colorRows) {
    if (!row.color) {
      continue;
    }

    const uniquePerProduct = new Set<string>();
    const tokens = row.color.split(",").map(normalizeColorLabel).filter((value) => value.length > 0);
    for (const token of tokens) {
      const value = normalizeColorToken(token);
      if (!value || uniquePerProduct.has(value)) {
        continue;
      }

      uniquePerProduct.add(value);
      const existing = colorMap.get(value);
      if (existing) {
        existing.total += 1;
      } else {
        colorMap.set(value, {
          value,
          label: token,
          total: 1,
        });
      }
    }
  }

  const colors = Array.from(colorMap.values()).sort((a, b) => a.label.localeCompare(b.label));

  return {
    price: {
      min: summaryRow?.min_price === null || summaryRow?.min_price === undefined ? null : Number(summaryRow.min_price),
      max: summaryRow?.max_price === null || summaryRow?.max_price === undefined ? null : Number(summaryRow.max_price),
    },
    availability: {
      inStock: Number(summaryRow?.in_stock_total ?? 0),
      outOfStock: Number(summaryRow?.out_stock_total ?? 0),
    },
    brands: brandRows.map((row) => ({
      slug: row.brand_slug,
      name: row.brand_name,
      total: Number(row.total),
    })),
    colors,
  };
}

export async function findProductBySlug(slug: string, activeOnly = true): Promise<ProductRecord | null> {
  const activeCondition = activeOnly ? "AND p.is_active = 1" : "";
  const row = await queryOne<ProductRow>(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.short_description,
        p.description,
        p.price,
        p.original_price,
        p.discounted_price,
        p.loyal_customer_price,
        p.stock,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.brand_id,
        b.name AS brand_name,
        b.slug AS brand_slug,
        b.image_url AS brand_image_url,
        p.sku,
        p.model_number,
        p.color,
        p.warranty_months,
        p.return_window_days,
        p.weight_grams,
        p.tags,
        p.highlight_points,
        p.meta_title,
        p.meta_description,
        p.rating_avg,
        p.rating_count,
        p.is_featured,
        p.is_new_arrival,
        p.is_best_seller,
        p.is_top_rated,
        p.is_trending,
        p.is_limited_stock,
        p.is_free_delivery,
        p.is_cash_on_delivery,
        p.is_emi_available,
        p.is_official_warranty,
        p.is_exchange_available,
        p.is_preorder,
        p.images,
        p.specifications,
        p.is_active,
        p.created_at,
        p.updated_at
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE p.slug = ?
      ${activeCondition}
      LIMIT 1
    `,
    [slug],
  );

  return row ? mapProduct(row) : null;
}

export async function findProductById(id: number, activeOnly = false): Promise<ProductRecord | null> {
  const activeCondition = activeOnly ? "AND p.is_active = 1" : "";
  const row = await queryOne<ProductRow>(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.short_description,
        p.description,
        p.price,
        p.original_price,
        p.discounted_price,
        p.loyal_customer_price,
        p.stock,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.brand_id,
        b.name AS brand_name,
        b.slug AS brand_slug,
        b.image_url AS brand_image_url,
        p.sku,
        p.model_number,
        p.color,
        p.warranty_months,
        p.return_window_days,
        p.weight_grams,
        p.tags,
        p.highlight_points,
        p.meta_title,
        p.meta_description,
        p.rating_avg,
        p.rating_count,
        p.is_featured,
        p.is_new_arrival,
        p.is_best_seller,
        p.is_top_rated,
        p.is_trending,
        p.is_limited_stock,
        p.is_free_delivery,
        p.is_cash_on_delivery,
        p.is_emi_available,
        p.is_official_warranty,
        p.is_exchange_available,
        p.is_preorder,
        p.images,
        p.specifications,
        p.is_active,
        p.created_at,
        p.updated_at
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE p.id = ?
      ${activeCondition}
      LIMIT 1
    `,
    [id],
  );

  return row ? mapProduct(row) : null;
}

export async function createProduct(input: {
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  originalPrice: number;
  discountedPrice: number | null;
  loyalCustomerPrice: number;
  stock: number;
  categoryId: number;
  brandId: number | null;
  sku: string | null;
  modelNumber: string | null;
  color: string | null;
  warrantyMonths: number | null;
  returnWindowDays: number | null;
  weightGrams: number | null;
  tags: string[];
  highlightPoints: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  ratingAvg: number;
  ratingCount: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTopRated: boolean;
  isTrending: boolean;
  isLimitedStock: boolean;
  isFreeDelivery: boolean;
  isCashOnDelivery: boolean;
  isEmiAvailable: boolean;
  isOfficialWarranty: boolean;
  isExchangeAvailable: boolean;
  isPreorder: boolean;
  images: string[];
  specifications: Record<string, unknown> | null;
  isActive: boolean;
}): Promise<ProductRecord> {
  const result = await execute(
    `
      INSERT INTO products
      (
        name,
        slug,
        short_description,
        description,
        price,
        original_price,
        discounted_price,
        loyal_customer_price,
        stock,
        category_id,
        brand_id,
        sku,
        model_number,
        color,
        warranty_months,
        return_window_days,
        weight_grams,
        tags,
        highlight_points,
        meta_title,
        meta_description,
        rating_avg,
        rating_count,
        is_featured,
        is_new_arrival,
        is_best_seller,
        is_top_rated,
        is_trending,
        is_limited_stock,
        is_free_delivery,
        is_cash_on_delivery,
        is_emi_available,
        is_official_warranty,
        is_exchange_available,
        is_preorder,
        images,
        specifications,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.name,
      input.slug,
      input.shortDescription,
      input.description,
      input.originalPrice,
      input.originalPrice,
      input.discountedPrice,
      input.loyalCustomerPrice,
      input.stock,
      input.categoryId,
      input.brandId,
      input.sku,
      input.modelNumber,
      input.color,
      input.warrantyMonths,
      input.returnWindowDays,
      input.weightGrams,
      JSON.stringify(input.tags),
      JSON.stringify(input.highlightPoints),
      input.metaTitle,
      input.metaDescription,
      input.ratingAvg,
      input.ratingCount,
      input.isFeatured ? 1 : 0,
      input.isNewArrival ? 1 : 0,
      input.isBestSeller ? 1 : 0,
      input.isTopRated ? 1 : 0,
      input.isTrending ? 1 : 0,
      input.isLimitedStock ? 1 : 0,
      input.isFreeDelivery ? 1 : 0,
      input.isCashOnDelivery ? 1 : 0,
      input.isEmiAvailable ? 1 : 0,
      input.isOfficialWarranty ? 1 : 0,
      input.isExchangeAvailable ? 1 : 0,
      input.isPreorder ? 1 : 0,
      JSON.stringify(input.images),
      input.specifications ? JSON.stringify(input.specifications) : null,
      input.isActive ? 1 : 0,
    ],
  );

  const product = await findProductById(result.insertId);
  if (!product) {
    throw new Error("Unable to create product");
  }

  return product;
}

export async function updateProduct(
  id: number,
  input: {
    name: string;
    slug: string;
    shortDescription: string | null;
    description: string | null;
    originalPrice: number;
    discountedPrice: number | null;
    loyalCustomerPrice: number;
    stock: number;
    categoryId: number;
    brandId: number | null;
    sku: string | null;
    modelNumber: string | null;
    color: string | null;
    warrantyMonths: number | null;
    returnWindowDays: number | null;
    weightGrams: number | null;
    tags: string[];
    highlightPoints: string[];
    metaTitle: string | null;
    metaDescription: string | null;
    ratingAvg: number;
    ratingCount: number;
    isFeatured: boolean;
    isNewArrival: boolean;
    isBestSeller: boolean;
    isTopRated: boolean;
    isTrending: boolean;
    isLimitedStock: boolean;
    isFreeDelivery: boolean;
    isCashOnDelivery: boolean;
    isEmiAvailable: boolean;
    isOfficialWarranty: boolean;
    isExchangeAvailable: boolean;
    isPreorder: boolean;
    images: string[];
    specifications: Record<string, unknown> | null;
    isActive: boolean;
  },
): Promise<ProductRecord | null> {
  await execute(
    `
      UPDATE products
      SET
        name = ?,
        slug = ?,
        short_description = ?,
        description = ?,
        price = ?,
        original_price = ?,
        discounted_price = ?,
        loyal_customer_price = ?,
        stock = ?,
        category_id = ?,
        brand_id = ?,
        sku = ?,
        model_number = ?,
        color = ?,
        warranty_months = ?,
        return_window_days = ?,
        weight_grams = ?,
        tags = ?,
        highlight_points = ?,
        meta_title = ?,
        meta_description = ?,
        rating_avg = ?,
        rating_count = ?,
        is_featured = ?,
        is_new_arrival = ?,
        is_best_seller = ?,
        is_top_rated = ?,
        is_trending = ?,
        is_limited_stock = ?,
        is_free_delivery = ?,
        is_cash_on_delivery = ?,
        is_emi_available = ?,
        is_official_warranty = ?,
        is_exchange_available = ?,
        is_preorder = ?,
        images = ?,
        specifications = ?,
        is_active = ?
      WHERE id = ?
    `,
    [
      input.name,
      input.slug,
      input.shortDescription,
      input.description,
      input.originalPrice,
      input.originalPrice,
      input.discountedPrice,
      input.loyalCustomerPrice,
      input.stock,
      input.categoryId,
      input.brandId,
      input.sku,
      input.modelNumber,
      input.color,
      input.warrantyMonths,
      input.returnWindowDays,
      input.weightGrams,
      JSON.stringify(input.tags),
      JSON.stringify(input.highlightPoints),
      input.metaTitle,
      input.metaDescription,
      input.ratingAvg,
      input.ratingCount,
      input.isFeatured ? 1 : 0,
      input.isNewArrival ? 1 : 0,
      input.isBestSeller ? 1 : 0,
      input.isTopRated ? 1 : 0,
      input.isTrending ? 1 : 0,
      input.isLimitedStock ? 1 : 0,
      input.isFreeDelivery ? 1 : 0,
      input.isCashOnDelivery ? 1 : 0,
      input.isEmiAvailable ? 1 : 0,
      input.isOfficialWarranty ? 1 : 0,
      input.isExchangeAvailable ? 1 : 0,
      input.isPreorder ? 1 : 0,
      JSON.stringify(input.images),
      input.specifications ? JSON.stringify(input.specifications) : null,
      input.isActive ? 1 : 0,
      id,
    ],
  );

  return findProductById(id);
}

export async function deleteProduct(id: number): Promise<void> {
  await execute("DELETE FROM products WHERE id = ?", [id]);
}

export async function countCartItemsByProductId(productId: number): Promise<number> {
  const row = await queryOne<{ total: number }>(
    "SELECT COUNT(*) AS total FROM cart_items WHERE product_id = ?",
    [productId],
  );

  return row?.total ?? 0;
}
