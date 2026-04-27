import { z } from "zod";

function stripHtmlToText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12),
  categorySlug: z.string().trim().min(1).optional(),
  brandSlug: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
});

export const authLoginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

export const authRegisterSchema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(2).max(120),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[a-z]/, "Password must include at least one lowercase letter")
    .regex(/[0-9]/, "Password must include at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must include at least one special character"),
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
  isFeatured: z.boolean().optional(),
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
  wholesalePrice: z.number().nonnegative().nullable().optional(),
  wholesaleMinQuantity: z.number().int().min(2).nullable().optional(),
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

  if (value.wholesalePrice !== null && value.wholesalePrice !== undefined && value.wholesalePrice > originalPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Wholesale price cannot exceed original price",
      path: ["wholesalePrice"],
    });
  }

  const hasWholesalePrice = value.wholesalePrice !== null && value.wholesalePrice !== undefined;
  const hasWholesaleMinQuantity =
    value.wholesaleMinQuantity !== null && value.wholesaleMinQuantity !== undefined;

  if (hasWholesalePrice !== hasWholesaleMinQuantity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Wholesale price and minimum quantity must be provided together",
      path: hasWholesalePrice ? ["wholesaleMinQuantity"] : ["wholesalePrice"],
    });
  }
});

export const orderPurchaseModeSchema = z.enum(["regular", "business"]);

export const businessAccountApplicationSchema = z.object({
  businessName: z.string().trim().min(2).max(255),
  legalEntityType: z.string().trim().min(2).max(120),
  registrationNumber: z.string().trim().max(120).nullable().optional(),
  taxId: z.string().trim().max(120).nullable().optional(),
  yearsInOperation: z.number().int().min(0).max(200).nullable().optional(),
  websiteUrl: z.string().trim().url().max(500).nullable().optional(),
  primaryContactName: z.string().trim().min(2).max(255),
  primaryContactRole: z.string().trim().max(120).nullable().optional(),
  primaryContactEmail: z.string().trim().email().max(255),
  primaryContactPhone: z.string().trim().min(3).max(30),
  addressLine1: z.string().trim().min(3).max(500),
  addressLine2: z.string().trim().max(500).nullable().optional(),
  city: z.string().trim().min(2).max(255),
  state: z.string().trim().max(255).nullable().optional(),
  postalCode: z.string().trim().max(20).nullable().optional(),
  country: z.string().trim().min(2).max(120).default("Bangladesh"),
  monthlyPurchaseVolume: z.string().trim().max(120).nullable().optional(),
  productCategories: z.array(z.string().trim().min(1).max(120)).max(20).nullable().optional(),
  documentUrls: z.array(z.string().trim().url().max(1000)).max(20).nullable().optional(),
  additionalNotes: z.string().trim().max(5000).nullable().optional(),
});

export const adminBusinessAccountQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  search: z.string().trim().min(1).optional(),
});

export const adminBusinessAccountReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().trim().max(5000).nullable().optional(),
});

const checkoutAddressSchema = z.object({
  label: z.string().trim().max(100).optional(),
  fullName: z.string().trim().min(1).max(255),
  phone: z.string().trim().min(1).max(30),
  addressLine1: z.string().trim().min(1).max(500),
  addressLine2: z.string().trim().max(500).optional(),
  city: z.string().trim().min(1).max(255),
  state: z.string().trim().max(255).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(100).default("Bangladesh"),
  saveAddress: z.boolean().optional(),
});

export const checkoutCreatePaymentIntentSchema = z.object({
  purchaseMode: orderPurchaseModeSchema.default("regular"),
  addressId: z.number().int().positive().optional(),
  newAddress: checkoutAddressSchema.optional(),
});

export const createOrderSchema = z.object({
  paymentIntentId: z.string().trim().min(1),
  purchaseMode: orderPurchaseModeSchema.default("regular"),
  addressId: z.number().int().positive().optional(),
  newAddress: checkoutAddressSchema.optional(),
}).refine((data) => data.addressId !== undefined || data.newAddress !== undefined, {
  message: "Either addressId or newAddress is required",
});

export const adminOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum([
    "pending_payment", "paid", "processing", "shipped",
    "delivered", "cancelled", "refunded",
  ]).optional(),
  search: z.string().trim().min(1).optional(),
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

export const adminFaqSchema = z.object({
  question: z.string().trim().min(5).max(255),
  answer: z
    .string()
    .trim()
    .min(1)
    .max(20000)
    .refine((value) => stripHtmlToText(value).length >= 10, {
      message: "Answer must contain at least 10 characters of text",
    }),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
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
  quantity: z.number().int().positive(),
});

export const cartUpdateSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const cartRemoveSchema = z.object({
  productId: z.number().int().positive(),
});

export const wishlistItemSchema = z.object({
  productId: z.number().int().positive(),
});

export const adminWishlistQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  search: z.string().trim().min(1).optional(),
});

export const chatSourceTypeSchema = z.enum(["home", "dashboard", "product", "order", "account", "other"]);

export const chatConversationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createChatConversationSchema = z.object({
  sourceType: chatSourceTypeSchema.default("home"),
  sourceRef: z.string().trim().max(191).nullable().optional(),
  initialMessage: z.string().trim().min(1).max(2000).optional(),
});

export const chatMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});

export const sendChatMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const chatTypingSchema = z.object({
  isTyping: z.boolean(),
});
