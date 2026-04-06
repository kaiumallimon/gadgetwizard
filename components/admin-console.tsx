"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Boxes, Image as ImageIcon, Megaphone, Pin, PinOff, Star, StarOff, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { Banner, Category, Product } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminConsoleProps {
  initialAnalytics: {
    totalUsers: number;
    totalProducts: number;
    cartActivity: Array<{ action: string; total: number }>;
    rewardDistribution: Array<{ tier: string; totalUsers: number; averagePoints: number }>;
  };
  initialCategories: Category[];
  initialProducts: Product[];
  initialBanners: Banner[];
  initialTab?: TabId;
  lockedTab?: TabId;
}

type TabId = "analytics" | "categories" | "products" | "banners";

function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeBannerClickUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/") && typeof window !== "undefined") {
    return new URL(trimmed, window.location.origin).toString();
  }

  throw new Error("Click URL must be a full URL or start with /");
}

function parseBannerSortOrder(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error("Sort order must be a non-negative whole number");
  }

  return parsed;
}

export function AdminConsole({
  initialAnalytics,
  initialCategories,
  initialProducts,
  initialBanners,
  initialTab = "analytics",
  lockedTab,
}: AdminConsoleProps) {
  const { token } = useAuthStore();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [banners, setBanners] = useState(initialBanners);
  const [notice, setNotice] = useState<string>("");
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);

  const [bannerForm, setBannerForm] = useState({
    title: "",
    desktopImageUrl: "",
    clickUrl: "",
    sortOrder: "0",
  });

  const headerCategoryCount = useMemo(
    () => categories.filter((category) => category.isHeaderCategory).length,
    [categories],
  );
  const featuredCategoryCount = useMemo(
    () => categories.filter((category) => category.isFeatured).length,
    [categories],
  );
  const activeTab = lockedTab ?? tab;

  useEffect(() => {
    if (!notice) {
      return;
    }

    const normalized = notice.toLowerCase();
    const isError =
      normalized.includes("failed") ||
      normalized.includes("required") ||
      normalized.includes("invalid") ||
      normalized.includes("unable") ||
      normalized.includes("limit");

    if (isError) {
      toast.error(notice);
    } else {
      toast.success(notice);
    }

    setNotice("");
  }, [notice]);

  async function refreshCategories() {
    const response = await apiClient.adminGetCategories(token ?? undefined);
    setCategories(response.items);
  }

  async function refreshProducts() {
    const response = await apiClient.adminGetProducts({ page: 1, pageSize: 50 }, token ?? undefined);
    setProducts(response.items);
  }

  async function refreshBanners() {
    const response = await apiClient.adminGetBanners(token ?? undefined);
    setBanners(response.items);
  }

  async function uploadCdnImage(file: File, target: string): Promise<string> {
    try {
      setUploadingTarget(target);
      const response = await apiClient.adminUploadCdnImage(file, token ?? undefined);
      return response.item.url;
    } finally {
      setUploadingTarget(null);
    }
  }

  async function handleQuickEditCategory(category: Category) {
    const name = window.prompt("Category name", category.name);
    if (!name) return;

    const slug = window.prompt("Category slug", category.slug);
    if (!slug) return;

    try {
      await apiClient.adminUpdateCategory(
        category.id,
        {
          name,
          slug,
          icon: category.icon,
          imageUrl: category.imageUrl,
          isHeaderCategory: category.isHeaderCategory,
          isFeatured: category.isFeatured,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        },
        token ?? undefined,
      );
      await refreshCategories();
      setNotice("Category updated.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Category update failed"));
    }
  }

  async function handleReplaceCategoryImage(category: Category, file: File | null) {
    if (!file) {
      return;
    }

    try {
      const url = await uploadCdnImage(file, `category-${category.id}`);
      await apiClient.adminUpdateCategory(
        category.id,
        {
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          imageUrl: url,
          isHeaderCategory: category.isHeaderCategory,
          isFeatured: category.isFeatured,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        },
        token ?? undefined,
      );
      await refreshCategories();
      setNotice("Category image updated.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Category image update failed"));
    }
  }

  async function handleDeleteCategory(categoryId: number) {
    if (!window.confirm("Delete this category?")) {
      return;
    }

    try {
      await apiClient.adminDeleteCategory(categoryId, token ?? undefined);
      await refreshCategories();
      setNotice("Category deleted.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Category delete failed"));
    }
  }

  async function handleToggleHeaderCategory(category: Category) {
    try {
      await apiClient.adminUpdateCategory(
        category.id,
        {
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          imageUrl: category.imageUrl,
          isHeaderCategory: !category.isHeaderCategory,
          isFeatured: category.isFeatured,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        },
        token ?? undefined,
      );
      await refreshCategories();
      setNotice(
        !category.isHeaderCategory
          ? "Category added to header navigation."
          : "Category removed from header navigation.",
      );
    } catch (error) {
      setNotice(safeErrorMessage(error, "Header category update failed"));
    }
  }

  async function handleToggleFeaturedCategory(category: Category) {
    try {
      await apiClient.adminUpdateCategory(
        category.id,
        {
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          imageUrl: category.imageUrl,
          isHeaderCategory: category.isHeaderCategory,
          isFeatured: !category.isFeatured,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        },
        token ?? undefined,
      );
      await refreshCategories();
      setNotice(
        !category.isFeatured
          ? "Category marked as featured for storefront."
          : "Category removed from featured storefront list.",
      );
    } catch (error) {
      setNotice(safeErrorMessage(error, "Featured category update failed"));
    }
  }

  async function handleToggleCategoryActive(category: Category) {
    try {
      await apiClient.adminUpdateCategory(
        category.id,
        {
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          imageUrl: category.imageUrl,
          isHeaderCategory: category.isHeaderCategory,
          sortOrder: category.sortOrder,
          isActive: !category.isActive,
        },
        token ?? undefined,
      );
      await refreshCategories();
      setNotice(!category.isActive ? "Category activated." : "Category deactivated.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Category status update failed"));
    }
  }

  async function handleQuickEditProduct(product: Product) {
    const name = window.prompt("Product name", product.name);
    if (!name) return;

    const priceInput = window.prompt("Price", String(product.price));
    if (!priceInput) return;

    const stockInput = window.prompt("Stock", String(product.stock));
    if (!stockInput) return;

    try {
      await apiClient.adminUpdateProduct(
        product.id,
        {
          name,
          slug: product.slug,
          description: product.description,
          price: Number(priceInput),
          discountedPrice: product.discountedPrice,
          stock: Number(stockInput),
          categoryId: product.categoryId,
          images: product.images,
          specifications: product.specifications,
          isActive: product.isActive,
        },
        token ?? undefined,
      );
      await refreshProducts();
      setNotice("Product updated.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Product update failed"));
    }
  }

  async function handleToggleProductActive(product: Product) {
    try {
      await apiClient.adminUpdateProduct(
        product.id,
        {
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          discountedPrice: product.discountedPrice,
          stock: product.stock,
          categoryId: product.categoryId,
          images: product.images,
          specifications: product.specifications,
          isActive: !product.isActive,
        },
        token ?? undefined,
      );
      await refreshProducts();
      setNotice(!product.isActive ? "Product activated." : "Product deactivated.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Product status update failed"));
    }
  }

  async function handleDeleteProduct(productId: number) {
    if (!window.confirm("Delete this product?")) {
      return;
    }

    try {
      await apiClient.adminDeleteProduct(productId, token ?? undefined);
      await refreshProducts();
      setNotice("Product deleted.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Product delete failed"));
    }
  }

  async function handleCreateBanner() {
    const title = bannerForm.title.trim();
    if (title.length < 2) {
      setNotice("Banner title must be at least 2 characters.");
      return;
    }

    if (!bannerForm.desktopImageUrl) {
      setNotice("Banner image is required.");
      return;
    }

    let clickUrl: string | null;
    let sortOrder: number;
    try {
      clickUrl = normalizeBannerClickUrl(bannerForm.clickUrl);
      sortOrder = parseBannerSortOrder(bannerForm.sortOrder);
    } catch (error) {
      setNotice(safeErrorMessage(error, "Banner input is invalid"));
      return;
    }

    try {
      await apiClient.adminCreateBanner(
        {
          title,
          desktopImageUrl: bannerForm.desktopImageUrl,
          clickUrl,
          sortOrder,
          isActive: true,
        },
        token ?? undefined,
      );
      setBannerForm({ title: "", desktopImageUrl: "", clickUrl: "", sortOrder: "0" });
      setIsBannerDialogOpen(false);
      await refreshBanners();
      setNotice("Banner created.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Banner create failed"));
    }
  }

  async function handleBannerImageUpload(file: File | null) {
    if (!file) {
      return;
    }

    try {
      const url = await uploadCdnImage(file, "banner-create");
      setBannerForm((prev) => ({ ...prev, desktopImageUrl: url }));
      setNotice("Banner image uploaded.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Banner image upload failed"));
    }
  }

  async function handleReplaceBannerImage(banner: Banner, file: File | null) {
    if (!file) {
      return;
    }

    try {
      const url = await uploadCdnImage(file, `banner-${banner.id}`);
      await apiClient.adminUpdateBanner(
        banner.id,
        {
          title: banner.title,
          desktopImageUrl: url,
          clickUrl: banner.clickUrl,
          sortOrder: banner.sortOrder,
          isActive: banner.isActive,
          startsAt: banner.startsAt,
          endsAt: banner.endsAt,
        },
        token ?? undefined,
      );
      await refreshBanners();
      setNotice("Banner image updated.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Banner image update failed"));
    }
  }

  async function handleQuickEditBanner(banner: Banner) {
    const title = window.prompt("Banner title", banner.title);
    if (!title) return;

    const sortOrderInput = window.prompt("Sort order", String(banner.sortOrder));
    if (!sortOrderInput) return;

    try {
      await apiClient.adminUpdateBanner(
        banner.id,
        {
          title,
          desktopImageUrl: banner.desktopImageUrl,
          clickUrl: banner.clickUrl,
          sortOrder: Number(sortOrderInput),
          isActive: banner.isActive,
          startsAt: banner.startsAt,
          endsAt: banner.endsAt,
        },
        token ?? undefined,
      );
      await refreshBanners();
      setNotice("Banner updated.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Banner update failed"));
    }
  }

  async function handleToggleBannerActive(banner: Banner) {
    try {
      await apiClient.adminUpdateBanner(
        banner.id,
        {
          title: banner.title,
          desktopImageUrl: banner.desktopImageUrl,
          clickUrl: banner.clickUrl,
          sortOrder: banner.sortOrder,
          isActive: !banner.isActive,
          startsAt: banner.startsAt,
          endsAt: banner.endsAt,
        },
        token ?? undefined,
      );
      await refreshBanners();
      setNotice(!banner.isActive ? "Banner activated." : "Banner deactivated.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Banner status update failed"));
    }
  }

  async function handleDeleteBanner(bannerId: number) {
    if (!window.confirm("Delete this banner?")) {
      return;
    }

    try {
      await apiClient.adminDeleteBanner(bannerId, token ?? undefined);
      await refreshBanners();
      setNotice("Banner deleted.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Banner delete failed"));
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => !lockedTab && setTab(value as TabId)}>
        {!lockedTab && (
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 md:inline-flex md:w-auto md:grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Users</CardDescription>
                <CardTitle className="text-2xl">{initialAnalytics.totalUsers}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-500">Registered users in platform</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Products</CardDescription>
                <CardTitle className="text-2xl">{initialAnalytics.totalProducts}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-500">Active and inactive products</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Header Categories</CardDescription>
                <CardTitle className="text-2xl">{headerCategoryCount}/8</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-500">Pinned categories in top navigation</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Live Banners</CardDescription>
                <CardTitle className="text-2xl">{banners.filter((item) => item.isActive).length}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-500">Currently active marketing banners</CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-4 w-4" /> Cart Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {initialAnalytics.cartActivity.length === 0 && (
                  <p className="text-sm text-zinc-500">No cart events captured yet.</p>
                )}
                {initialAnalytics.cartActivity.map((item) => (
                  <div key={item.action} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                    <span className="text-sm font-medium text-zinc-700">{item.action}</span>
                    <Badge variant="secondary">{item.total}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-4 w-4" /> Reward Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {initialAnalytics.rewardDistribution.length === 0 && (
                  <p className="text-sm text-zinc-500">No reward data yet.</p>
                )}
                {initialAnalytics.rewardDistribution.map((item) => (
                  <div key={item.tier} className="rounded-lg border border-zinc-200 px-3 py-2">
                    <p className="text-sm font-semibold text-zinc-900">{item.tier}</p>
                    <p className="text-xs text-zinc-500">
                      Users: {item.totalUsers} | Avg Points: {Math.round(item.averagePoints)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Boxes className="h-4 w-4" /> Category Statistics
                  </CardTitle>
                  <CardDescription>Category overview and quick action to open the separate add category page.</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/admin/categories/new">Open Add Category Page</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Total Categories</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{categories.length}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Active</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">
                  {categories.filter((category) => category.isActive).length}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Header Pinned</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{headerCategoryCount}/8</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Featured</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{featuredCategoryCount}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">With Image</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">
                  {categories.filter((category) => category.imageUrl?.trim()).length}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    <Badge variant={category.isActive ? "default" : "outline"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>#{category.id} | {category.slug}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {category.isHeaderCategory ? (
                      <Badge variant="secondary" className="gap-1">
                        <Pin className="h-3 w-3" /> Header Pinned
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <PinOff className="h-3 w-3" /> Not Pinned
                      </Badge>
                    )}
                    {category.isFeatured ? (
                      <Badge variant="secondary" className="gap-1 border-amber-200 bg-amber-50 text-amber-700">
                        <Star className="h-3 w-3" /> Featured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <StarOff className="h-3 w-3" /> Not Featured
                      </Badge>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-md border border-zinc-200">
                    <div className="h-28 bg-zinc-50 p-2">
                      {category.imageUrl?.trim() ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={category.imageUrl} alt={category.name} className="h-full w-full object-contain" />
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-400">
                          <span className="inline-flex items-center gap-2 text-xs sm:text-sm">
                            <ImageIcon className="h-4 w-4" /> No image uploaded
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleHeaderCategory(category)}>
                      {category.isHeaderCategory ? "Unpin" : "Pin"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleFeaturedCategory(category)}>
                      {category.isFeatured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleCategoryActive(category)}>
                      {category.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleQuickEditCategory(category)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50">
                      <Upload className="h-3.5 w-3.5" /> Replace Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingTarget === `category-${category.id}`}
                        onChange={async (event) => {
                          const input = event.currentTarget;
                          const file = input.files?.[0] ?? null;
                          input.value = "";
                          await handleReplaceCategoryImage(category, file);
                        }}
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Creation Moved</CardTitle>
              <CardDescription>
                Use the dedicated add product route for rich text descriptions and key/value specifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/admin/products/new">Open Add Product Page</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    <Badge variant={product.isActive ? "default" : "outline"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>
                    #{product.id} | {product.categoryName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-zinc-600">
                    Price: AUD {product.price.toLocaleString()} | Stock: {product.stock}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleProductActive(product)}>
                      {product.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleQuickEditProduct(product)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="banners" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">All Banners</h2>
              <p className="text-sm text-zinc-600">One row per banner for quick scanning and actions.</p>
            </div>
            <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <ImageIcon className="h-4 w-4" /> Create Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4" /> Create Banner
                  </DialogTitle>
                  <DialogDescription>
                    Upload one banner image. The storefront uses responsive optimization for all screens.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={bannerForm.title}
                    onChange={(event) => setBannerForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Banner title"
                  />
                  <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm text-zinc-700 hover:bg-zinc-50">
                    <Upload className="h-4 w-4" />
                    {uploadingTarget === "banner-create" ? "Uploading image..." : "Upload Banner Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingTarget === "banner-create"}
                      onChange={async (event) => {
                        const input = event.currentTarget;
                        const file = input.files?.[0] ?? null;
                        input.value = "";
                        await handleBannerImageUpload(file);
                      }}
                    />
                  </label>
                  <Input
                    value={bannerForm.clickUrl}
                    onChange={(event) => setBannerForm((prev) => ({ ...prev, clickUrl: event.target.value }))}
                    placeholder="Click URL (optional: https://... or /path)"
                  />
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={bannerForm.sortOrder}
                    onChange={(event) => setBannerForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                    placeholder="Sort order"
                  />

                  {bannerForm.desktopImageUrl && (
                    <div className="md:col-span-2">
                      <div className="overflow-hidden rounded-md border border-zinc-200">
                        <div className="h-36 bg-zinc-50 p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={bannerForm.desktopImageUrl} alt="Banner preview" className="h-full w-full object-contain" />
                        </div>
                        <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500">Responsive preview source</p>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button onClick={handleCreateBanner}>
                    <ImageIcon className="h-4 w-4" /> Create Banner
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {banners.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-zinc-500">
                  No banners found. Create one from the dialog.
                </CardContent>
              </Card>
            )}

            {banners.map((banner) => (
              <Card key={banner.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{banner.title}</CardTitle>
                      <CardDescription>#{banner.id} | Sort: {banner.sortOrder}</CardDescription>
                    </div>
                    <Badge variant={banner.isActive ? "default" : "outline"}>
                      {banner.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-[260px_1fr]">
                    <div className="overflow-hidden rounded-md border border-zinc-200">
                      <div className="h-28 bg-zinc-50 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={banner.desktopImageUrl} alt={`${banner.title} banner`} className="h-full w-full object-contain" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="truncate text-sm text-zinc-600">Image URL: {banner.desktopImageUrl}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleBannerActive(banner)}>
                          {banner.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleQuickEditBanner(banner)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteBanner(banner.id)}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50">
                          <Upload className="h-3.5 w-3.5" /> Replace Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingTarget === `banner-${banner.id}`}
                            onChange={async (event) => {
                              const input = event.currentTarget;
                              const file = input.files?.[0] ?? null;
                              input.value = "";
                              await handleReplaceBannerImage(banner, file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
