import type {
  ApiErrorPayload,
  AppUser,
  AuthSession,
  Banner,
  BusinessAccount,
  Brand,
  Cart,
  Category,
  CdnFileAsset,
  CdnStats,
  Faq,
  Order,
  Product,
  ProductReview,
  Wishlist,
  AdminWishlistEntry,
  UserAddress,
} from "@/lib/client/types";

class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type FetchInit = RequestInit & {
  token?: string;
};

async function apiFetch<T>(path: string, init: FetchInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Accept", "application/json");

  if (init.body && !(init.body instanceof FormData) && !headers.get("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (init.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }

  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = null;
    }

    throw new ApiError(
      response.status,
      payload?.error?.code ?? "REQUEST_FAILED",
      payload?.error?.message ?? "API request failed",
      payload?.error?.details,
    );
  }

  return (await response.json()) as T;
}

export const apiClient = {
  async registerUser(payload: { email: string; name: string; password: string }) {
    return apiFetch<{ user: AppUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async requestPasswordReset(email: string) {
    return apiFetch<{ success: boolean; message: string }>("/api/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async verifyPasswordResetToken(token: string) {
    return apiFetch<{ valid: boolean; email: string; expiresAt: string }>("/api/auth/password-reset/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  async confirmPasswordReset(token: string, newPassword: string) {
    return apiFetch<{ success: boolean }>("/api/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },

  async logout() {
    return apiFetch<{ success: boolean }>("/api/auth/logout", { method: "POST" });
  },

  async getMe(token?: string) {
    return apiFetch<{ session: AuthSession; user: AppUser }>("/api/me", { token });
  },

  async getBanners() {
    return apiFetch<{ items: Banner[] }>("/api/banners");
  },

  async getCategories() {
    return apiFetch<{ items: Category[] }>("/api/categories");
  },

  async getBrands() {
    return apiFetch<{ items: Brand[] }>("/api/brands");
  },

  async getFaqs() {
    return apiFetch<{ items: Faq[] }>("/api/faqs");
  },

  async getProducts(params: { page?: number; pageSize?: number; categorySlug?: string; brandSlug?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.categorySlug) query.set("categorySlug", params.categorySlug);
    if (params.brandSlug) query.set("brandSlug", params.brandSlug);
    if (params.search) query.set("search", params.search);

    return apiFetch<{ items: Product[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/api/products?${query.toString()}`,
    );
  },

  async getProductBySlug(slug: string) {
    return apiFetch<{ item: Product }>(`/api/products/${slug}`);
  },

  async getCart(token?: string) {
    return apiFetch<{ cart: Cart }>("/api/cart", { token });
  },

  async addToCart(payload: { productId: number; quantity: number }, token?: string) {
    return apiFetch<{ cart: Cart }>("/api/cart/add", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  async updateCart(payload: { productId: number; quantity: number }, token?: string) {
    return apiFetch<{ cart: Cart }>("/api/cart/update", {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    });
  },

  async removeFromCart(productId: number, token?: string) {
    return apiFetch<{ cart: Cart }>("/api/cart/remove", {
      method: "DELETE",
      token,
      body: JSON.stringify({ productId }),
    });
  },

  async getWishlist(token?: string) {
    return apiFetch<{ wishlist: Wishlist }>("/api/wishlist", { token });
  },

  async addToWishlist(productId: number, token?: string) {
    return apiFetch<{ wishlist: Wishlist }>("/api/wishlist", {
      method: "POST",
      token,
      body: JSON.stringify({ productId }),
    });
  },

  async removeFromWishlist(productId: number, token?: string) {
    return apiFetch<{ wishlist: Wishlist }>("/api/wishlist/remove", {
      method: "DELETE",
      token,
      body: JSON.stringify({ productId }),
    });
  },

  async adminGetWishlist(params: { page?: number; pageSize?: number; search?: string }, token?: string) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.search) query.set("search", params.search);

    return apiFetch<{ items: AdminWishlistEntry[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/api/admin/wishlist?${query.toString()}`,
      { token },
    );
  },

  async adminGetAnalytics(token?: string) {
    return apiFetch<{ analytics: unknown }>("/api/admin/analytics", { token });
  },

  async adminGetUsers(token?: string) {
    return apiFetch<{ items: AppUser[]; total: number }>("/api/admin/users", { token });
  },

  async adminGetRegularUsers(token?: string) {
    return apiFetch<{ items: AppUser[]; total: number }>("/api/admin/customers", { token });
  },

  async adminCreateAdminUser(payload: { email: string; name: string }, token?: string) {
    return apiFetch<{ item: AppUser }>("/api/admin/users", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminUpdateAdminUserStatus(id: number, payload: { isActive: boolean }, token?: string) {
    return apiFetch<{ item: AppUser }>(`/api/admin/users/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminDeleteAdminUser(id: number, token?: string) {
    return apiFetch<{ success: boolean }>(`/api/admin/users/${id}`, {
      method: "DELETE",
      token,
    });
  },

  async adminUpdateRegularUserStatus(id: number, payload: { isActive: boolean }, token?: string) {
    return apiFetch<{ item: AppUser }>(`/api/admin/customers/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminGetCategories(token?: string) {
    return apiFetch<{ items: Category[] }>("/api/admin/categories", { token });
  },

  async adminGetBrands(token?: string) {
    return apiFetch<{ items: Brand[] }>("/api/admin/brands", { token });
  },

  async adminCreateBrand(payload: {
    name: string;
    slug?: string;
    imageUrl?: string | null;
    description?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    isFeatured?: boolean;
  }, token?: string) {
    return apiFetch<{ item: Brand }>("/api/admin/brands", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminUpdateBrand(
    id: number,
    payload: {
      name: string;
      slug?: string;
      imageUrl?: string | null;
      description?: string | null;
      sortOrder?: number;
      isActive?: boolean;
      isFeatured?: boolean;
    },
    token?: string,
  ) {
    return apiFetch<{ item: Brand }>(`/api/admin/brands/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminDeleteBrand(id: number, token?: string) {
    return apiFetch<{ success: boolean }>(`/api/admin/brands/${id}`, {
      method: "DELETE",
      token,
    });
  },

  async adminCreateCategory(payload: {
    name: string;
    slug?: string;
    icon?: string | null;
    imageUrl?: string | null;
    isHeaderCategory?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
    isActive?: boolean;
  }, token?: string) {
    return apiFetch<{ item: Category }>("/api/admin/categories", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminUpdateCategory(
    id: number,
    payload: {
      name: string;
      slug?: string;
      icon?: string | null;
      imageUrl?: string | null;
      isHeaderCategory?: boolean;
      isFeatured?: boolean;
      sortOrder?: number;
      isActive?: boolean;
    },
    token?: string,
  ) {
    return apiFetch<{ item: Category }>(`/api/admin/categories/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminDeleteCategory(id: number, token?: string) {
    return apiFetch<{ success: boolean }>(`/api/admin/categories/${id}`, {
      method: "DELETE",
      token,
    });
  },

  async adminGetFaqs(token?: string) {
    return apiFetch<{ items: Faq[] }>("/api/admin/faqs", { token });
  },

  async adminCreateFaq(payload: {
    question: string;
    answer: string;
    sortOrder?: number;
    isActive?: boolean;
  }, token?: string) {
    return apiFetch<{ item: Faq }>("/api/admin/faqs", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminUpdateFaq(
    id: number,
    payload: {
      question: string;
      answer: string;
      sortOrder?: number;
      isActive?: boolean;
    },
    token?: string,
  ) {
    return apiFetch<{ item: Faq }>(`/api/admin/faqs/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminDeleteFaq(id: number, token?: string) {
    return apiFetch<{ success: boolean }>(`/api/admin/faqs/${id}`, {
      method: "DELETE",
      token,
    });
  },

  async adminGetProducts(
    params: { page?: number; pageSize?: number; categorySlug?: string; brandSlug?: string; search?: string },
    token?: string,
  ) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.categorySlug) query.set("categorySlug", params.categorySlug);
    if (params.brandSlug) query.set("brandSlug", params.brandSlug);
    if (params.search) query.set("search", params.search);

    return apiFetch<{ items: Product[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/api/admin/products?${query.toString()}`,
      { token },
    );
  },

  async adminCreateProduct(payload: {
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
  }, token?: string) {
    return apiFetch<{ item: Product }>("/api/admin/products", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminUpdateProduct(
    id: number,
    payload: {
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
    token?: string,
  ) {
    return apiFetch<{ item: Product }>(`/api/admin/products/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminDeleteProduct(id: number, token?: string) {
    return apiFetch<{ success: boolean }>(`/api/admin/products/${id}`, {
      method: "DELETE",
      token,
    });
  },

  async adminGetBanners(token?: string) {
    return apiFetch<{ items: Banner[] }>("/api/admin/banners", { token });
  },

  async adminCreateBanner(payload: {
    title: string;
    desktopImageUrl: string;
    clickUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
  }, token?: string) {
    return apiFetch<{ item: Banner }>("/api/admin/banners", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminUpdateBanner(
    id: number,
    payload: {
      title: string;
      desktopImageUrl: string;
      clickUrl?: string | null;
      sortOrder?: number;
      isActive?: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
    },
    token?: string,
  ) {
    return apiFetch<{ item: Banner }>(`/api/admin/banners/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminDeleteBanner(id: number, token?: string) {
    return apiFetch<{ success: boolean }>(`/api/admin/banners/${id}`, {
      method: "DELETE",
      token,
    });
  },

  async adminUploadCdnImage(file: File, token?: string) {
    const formData = new FormData();
    formData.set("file", file);

    return apiFetch<{ item: CdnFileAsset }>("/api/admin/cdn/upload", {
      method: "POST",
      token,
      body: formData,
    });
  },

  async adminGetCdnStats(token?: string) {
    return apiFetch<{ stats: CdnStats }>("/api/admin/cdn/stats", { token });
  },

  // Checkout
  async createPaymentIntent(payload: {
    purchaseMode?: "regular" | "business";
    addressId?: number;
    newAddress?: {
      label?: string;
      fullName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state?: string;
      postalCode?: string;
      country: string;
      saveAddress?: boolean;
    };
  } = {}, token?: string) {
    return apiFetch<{ clientSecret: string; paymentIntentId: string; amount: number }>(
      "/api/checkout",
      { method: "POST", token, body: JSON.stringify(payload) },
    );
  },

  // Orders (user)
  async createOrder(payload: {
    paymentIntentId: string;
    purchaseMode?: "regular" | "business";
    addressId?: number;
    newAddress?: {
      label?: string;
      fullName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state?: string;
      postalCode?: string;
      country: string;
      saveAddress?: boolean;
    };
  }, token?: string) {
    return apiFetch<{ order: Order }>("/api/orders", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  async getOrders(token?: string) {
    return apiFetch<{ items: Order[] }>("/api/orders", { token });
  },

  async getOrder(id: number, token?: string) {
    return apiFetch<{ item: Order }>(`/api/orders/${id}`, { token });
  },

  // Addresses (user)
  async getAddresses(token?: string) {
    return apiFetch<{ items: UserAddress[] }>("/api/me/addresses", { token });
  },

  async createAddress(payload: {
    label?: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
  }, token?: string) {
    return apiFetch<{ item: UserAddress }>("/api/me/addresses", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  async updateAddress(id: number, payload: {
    label?: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
  }, token?: string) {
    return apiFetch<{ item: UserAddress }>(`/api/me/addresses/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    });
  },

  async deleteAddress(id: number, token?: string) {
    return apiFetch<{ success: boolean }>(`/api/me/addresses/${id}`, {
      method: "DELETE",
      token,
    });
  },

  // Reviews (user)
  async getProductReviews(slug: string) {
    return apiFetch<{ items: ProductReview[] }>(`/api/products/${slug}/reviews`);
  },

  async submitReview(slug: string, payload: {
    orderId: number;
    rating: number;
    comment: string;
    images?: string[];
  }, token?: string) {
    return apiFetch<{ item: ProductReview }>(`/api/products/${slug}/reviews`, {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  async uploadReviewImage(file: File, token?: string) {
    const formData = new FormData();
    formData.set("file", file);

    return apiFetch<{ item: CdnFileAsset }>("/api/me/reviews/upload", {
      method: "POST",
      token,
      body: formData,
    });
  },

  async submitOrderReview(
    orderId: number,
    payload: {
      productId: number;
      rating: number;
      comment: string;
      images?: string[];
    },
    token?: string,
  ) {
    return apiFetch<{ item: ProductReview }>(`/api/orders/${orderId}/reviews`, {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  // Admin orders
  async adminGetOrders(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }, token?: string) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.status) query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    return apiFetch<{ items: Order[]; total: number; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/api/admin/orders?${query.toString()}`,
      { token },
    );
  },

  async adminGetOrder(id: number, token?: string) {
    return apiFetch<{ item: Order }>(`/api/admin/orders/${id}`, { token });
  },

  async adminUpdateOrderStatus(id: number, payload: { status: string; notes?: string }, token?: string) {
    return apiFetch<{ item: Order }>(`/api/admin/orders/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    });
  },

  async getMyBusinessAccount(token?: string) {
    return apiFetch<{ item: BusinessAccount | null }>("/api/me/business-account", { token });
  },

  async submitBusinessAccountApplication(payload: {
    businessName: string;
    legalEntityType: string;
    registrationNumber?: string | null;
    taxId?: string | null;
    yearsInOperation?: number | null;
    websiteUrl?: string | null;
    primaryContactName: string;
    primaryContactRole?: string | null;
    primaryContactEmail: string;
    primaryContactPhone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state?: string | null;
    postalCode?: string | null;
    country: string;
    monthlyPurchaseVolume?: string | null;
    productCategories?: string[] | null;
    documentUrls?: string[] | null;
    additionalNotes?: string | null;
  }, token?: string) {
    return apiFetch<{ item: BusinessAccount }>("/api/me/business-account", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminGetBusinessAccounts(params: {
    page?: number;
    pageSize?: number;
    status?: "pending" | "approved" | "rejected";
    search?: string;
  }, token?: string) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.status) query.set("status", params.status);
    if (params.search) query.set("search", params.search);

    return apiFetch<{ items: BusinessAccount[]; total: number; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/api/admin/business-accounts?${query.toString()}`,
      { token },
    );
  },

  async adminGetBusinessAccount(id: number, token?: string) {
    return apiFetch<{ item: BusinessAccount }>(`/api/admin/business-accounts/${id}`, { token });
  },

  async adminReviewBusinessAccount(
    id: number,
    payload: { status: "approved" | "rejected"; reviewNotes?: string | null },
    token?: string,
  ) {
    return apiFetch<{ item: BusinessAccount }>(`/api/admin/business-accounts/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    });
  },

  // Admin reviews
  async adminGetReviews(params: { page?: number; pageSize?: number; status?: string }, token?: string) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.status) query.set("status", params.status);
    return apiFetch<{ items: ProductReview[]; total: number }>(
      `/api/admin/reviews?${query.toString()}`,
      { token },
    );
  },

  async adminUpdateReviewStatus(id: number, payload: { status: "approved" | "rejected"; adminNote?: string }, token?: string) {
    return apiFetch<{ item: ProductReview }>(`/api/admin/reviews/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    });
  },

  async adminDeleteReview(id: number, token?: string) {
    return apiFetch<{ success: boolean }>(`/api/admin/reviews/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export { ApiError };
