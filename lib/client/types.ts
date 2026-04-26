export type UserRole = "user" | "admin";
export type BusinessAccountStatus = "pending" | "approved" | "rejected";
export type OrderPurchaseMode = "regular" | "business";

export interface AuthSession {
  userId: number;
  authUid: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AppUser {
  id: number;
  authUid: string;
  email: string;
  name: string;
  role: UserRole;
  businessAccountId: number | null;
  businessAccountStatus: BusinessAccountStatus | null;
  isBusinessApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessAccount {
  id: number;
  userId: number;
  status: BusinessAccountStatus;
  businessName: string;
  legalEntityType: string;
  registrationNumber: string | null;
  taxId: string | null;
  yearsInOperation: number | null;
  websiteUrl: string | null;
  primaryContactName: string;
  primaryContactRole: string | null;
  primaryContactEmail: string;
  primaryContactPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  monthlyPurchaseVolume: string | null;
  productCategories: string[];
  documentUrls: string[];
  additionalNotes: string | null;
  reviewNotes: string | null;
  reviewedByUserId: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
  reviewedByUserName?: string | null;
  reviewedByUserEmail?: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  isHeaderCategory: boolean;
  isFeatured: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  originalPrice: number;
  discountedPrice: number | null;
  wholesalePrice: number | null;
  wholesaleMinQuantity: number | null;
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

export interface Banner {
  id: number;
  title: string;
  desktopImageUrl: string;
  clickUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  productImages: string[];
  stock: number;
  productStockSnapshot: number;
  productWholesalePrice: number | null;
  productWholesaleMinQuantity: number | null;
  quantity: number;
  unitPrice: number;
  appliedDiscountedPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

export interface Wishlist {
  items: Product[];
  productIds: number[];
}

export interface AdminWishlistEntry {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  productId: number;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  createdAt: string;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productSku: string | null;
  productImageUrl: string | null;
  quantity: number;
  isWholesaleItem: boolean;
  unitPrice: number;
  wholesaleUnitPrice: number | null;
  totalPrice: number;
  createdAt: string;
}

export interface AddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  label: string | null;
}

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  purchaseMode: OrderPurchaseMode;
  isWholesale: boolean;
  businessAccountId: number | null;
  totalAmount: number;
  subtotal: number;
  shippingAmount: number;
  stripePaymentIntentId: string | null;
  stripePaymentStatus: string | null;
  shippingAddressSnapshot: AddressSnapshot;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  businessAccount?: BusinessAccount | null;
  // populated for admin view
  userName?: string;
  userEmail?: string;
}

export interface UserAddress {
  id: number;
  userId: number;
  label: string | null;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ProductReview {
  id: number;
  productId: number;
  userId: number;
  orderId: number;
  rating: number;
  comment: string;
  images: string[];
  status: ReviewStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  // populated joins
  userName?: string;
  userEmail?: string;
  productName?: string;
  productSlug?: string;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface CdnFileAsset {
  id: string;
  category: string;
  mimeType: string;
  originalName: string;
  extension: string;
  sizeBytes: number;
  accessCount: number;
  lastAccessedAt: string | null;
  checksumSha256: string;
  createdAt: string;
  updatedAt: string;
  urlSuffix: string;
  url: string;
}

export interface CdnStats {
  totals: {
    totalFiles: number;
    totalSizeBytes: number;
    totalAccessCount: number;
  };
  byCategory: Record<
    string,
    {
      totalFiles: number;
      totalSizeBytes: number;
      totalAccessCount: number;
    }
  >;
  topAccessedFiles: CdnFileAsset[];
  recentUploads: CdnFileAsset[];
  generatedAt: string;
}
