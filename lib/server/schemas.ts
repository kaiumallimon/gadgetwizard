import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12),
  categorySlug: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
});

export const authExchangeSchema = z.object({
  idToken: z.string().min(1),
});

export const adminCategorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(150).optional(),
  icon: z.string().trim().url().max(255).nullable().optional(),
  imageUrl: z.string().trim().url().max(500).nullable().optional(),
  isHeaderCategory: z.boolean().optional(),
  parentId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
});

export const adminProductSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(220).optional(),
  description: z.string().trim().max(10000).nullable().optional(),
  price: z.number().nonnegative(),
  discountedPrice: z.number().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative(),
  categoryId: z.number().int().positive(),
  images: z.array(z.string().url()).min(1).max(12),
  specifications: z.record(z.string(), z.unknown()).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const adminBannerSchema = z.object({
  title: z.string().trim().min(2).max(150),
  desktopImageUrl: z.string().trim().url().max(500),
  mobileImageUrl: z.string().trim().url().max(500),
  clickUrl: z.string().trim().url().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export const cartAddSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().max(100),
});

export const cartUpdateSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().max(100),
});

export const cartRemoveSchema = z.object({
  productId: z.number().int().positive(),
});
