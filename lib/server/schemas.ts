import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12),
  categorySlug: z.string().trim().min(1).optional(),
  brandSlug: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
});

export const authExchangeSchema = z.object({
  idToken: z.string().min(1),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email().max(255),
});

export const passwordResetVerifySchema = z.object({
  token: z.string().trim().min(1),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().trim().min(1),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[a-z]/, "Password must include at least one lowercase letter")
    .regex(/[0-9]/, "Password must include at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must include at least one special character"),
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

export const adminBrandSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug: z.string().trim().min(2).max(170).optional(),
  imageUrl: z.string().trim().url().max(500).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const adminProductSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(220).optional(),
  shortDescription: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(50000).nullable().optional(),
  price: z.number().nonnegative().optional(),
  originalPrice: z.number().nonnegative().optional(),
  discountedPrice: z.number().nonnegative().nullable().optional(),
  loyalCustomerPrice: z.number().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative(),
  categoryId: z.number().int().positive(),
  brandId: z.number().int().positive().nullable().optional(),
  sku: z.string().trim().max(120).nullable().optional(),
  modelNumber: z.string().trim().max(120).nullable().optional(),
  color: z.string().trim().max(80).nullable().optional(),
  warrantyMonths: z.number().int().min(0).max(240).nullable().optional(),
  returnWindowDays: z.number().int().min(0).max(365).nullable().optional(),
  weightGrams: z.number().int().min(0).max(100000).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(32).nullable().optional(),
  highlightPoints: z.array(z.string().trim().min(1).max(120)).max(12).nullable().optional(),
  metaTitle: z.string().trim().max(255).nullable().optional(),
  metaDescription: z.string().trim().max(500).nullable().optional(),
  ratingAvg: z.number().min(0).max(5).optional(),
  ratingCount: z.number().int().nonnegative().optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isTopRated: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  isLimitedStock: z.boolean().optional(),
  isFreeDelivery: z.boolean().optional(),
  isCashOnDelivery: z.boolean().optional(),
  isEmiAvailable: z.boolean().optional(),
  isOfficialWarranty: z.boolean().optional(),
  isExchangeAvailable: z.boolean().optional(),
  isPreorder: z.boolean().optional(),
  images: z.array(z.string().url()).min(1).max(12),
  specifications: z.record(z.string(), z.unknown()).nullable().optional(),
  isActive: z.boolean().optional(),
}).superRefine((value, ctx) => {
  const originalPrice = value.originalPrice ?? value.price;
  if (originalPrice === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Original price is required",
      path: ["originalPrice"],
    });
    return;
  }

  if (value.discountedPrice !== null && value.discountedPrice !== undefined && value.discountedPrice > originalPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Discounted price cannot exceed original price",
      path: ["discountedPrice"],
    });
  }

  if (value.loyalCustomerPrice !== null && value.loyalCustomerPrice !== undefined && value.loyalCustomerPrice > originalPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Loyal customer price cannot exceed original price",
      path: ["loyalCustomerPrice"],
    });
  }
});

export const adminBannerSchema = z.object({
  title: z.string().trim().min(2).max(150),
  desktopImageUrl: z.string().trim().url().max(500),
  clickUrl: z.string().trim().url().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export const adminCreateUserSchema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(2).max(120),
});

export const adminUserStatusSchema = z.object({
  isActive: z.boolean(),
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
