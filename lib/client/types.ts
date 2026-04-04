export type UserRole = "user" | "admin";

export interface AuthSession {
  userId: number;
  firebaseUid: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AppUser {
  id: number;
  firebaseUid: string;
  email: string;
  name: string;
  role: UserRole;
  rewardPoints: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  imageUrl: string | null;
  isHeaderCategory: boolean;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discountedPrice: number | null;
  stock: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
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
  mobileImageUrl: string;
  clickUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
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
