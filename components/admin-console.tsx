"use client";

import { useMemo, useState } from "react";
import { Activity, BarChart3, Boxes, Image as ImageIcon, Megaphone, Pin, PinOff, ShieldCheck, Trash2 } from "lucide-react";

import { apiClient } from "@/lib/client/api";
import type { Banner, Category, Product } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    imageUrl: "",
    isHeaderCategory: false,
    parentId: "",
  });

  const [productForm, setProductForm] = useState({
    name: "",
    slug: "",
    price: "",
    discountedPrice: "",
    stock: "",
    categoryId: "",
    imageUrl: "",
    description: "",
  });

  const [bannerForm, setBannerForm] = useState({
    title: "",
    desktopImageUrl: "",
    mobileImageUrl: "",
    clickUrl: "",
    sortOrder: "0",
  });

  const rootCategories = useMemo(() => categories.filter((category) => category.parentId === null), [categories]);
  const headerCategoryCount = useMemo(
    () => categories.filter((category) => category.isHeaderCategory).length,
    [categories],
  );
  const activeTab = lockedTab ?? tab;

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

  async function handleCreateCategory() {
    if (!categoryForm.name.trim()) {
      setNotice("Category name is required.");
      return;
    }

    try {
      await apiClient.adminCreateCategory(
        {
          name: categoryForm.name.trim(),
          slug: categoryForm.slug || undefined,
          imageUrl: categoryForm.imageUrl || null,
          isHeaderCategory: categoryForm.isHeaderCategory,
          parentId: categoryForm.parentId ? Number(categoryForm.parentId) : null,
        },
        token ?? undefined,
      );

      setCategoryForm({ name: "", slug: "", imageUrl: "", isHeaderCategory: false, parentId: "" });
      await refreshCategories();
      setNotice("Category created.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Category create failed"));
    }
  }

  async function handleQuickEditCategory(category: Category) {
    const name = window.prompt("Category name", category.name);
    if (!name) return;

    const slug = window.prompt("Category slug", category.slug);
    if (!slug) return;

    const imageUrl = window.prompt("Category image URL", category.imageUrl ?? "") ?? "";

    try {
      await apiClient.adminUpdateCategory(
        category.id,
        {
          name,
          slug,
          icon: category.icon,
          imageUrl: imageUrl || null,
          isHeaderCategory: category.isHeaderCategory,
          parentId: category.parentId,
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
          parentId: category.parentId,
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
          parentId: category.parentId,
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

  async function handleCreateProduct() {
    if (!productForm.name.trim() || !productForm.categoryId || !productForm.price || !productForm.stock || !productForm.imageUrl) {
      setNotice("Product name, category, price, stock, and image URL are required.");
      return;
    }

    try {
      await apiClient.adminCreateProduct(
        {
          name: productForm.name.trim(),
          slug: productForm.slug || undefined,
          description: productForm.description || null,
          price: Number(productForm.price),
          discountedPrice: productForm.discountedPrice ? Number(productForm.discountedPrice) : null,
          stock: Number(productForm.stock),
          categoryId: Number(productForm.categoryId),
          images: [productForm.imageUrl],
          specifications: null,
          isActive: true,
        },
        token ?? undefined,
      );

      setProductForm({
        name: "",
        slug: "",
        price: "",
        discountedPrice: "",
        stock: "",
        categoryId: "",
        imageUrl: "",
        description: "",
      });
      await refreshProducts();
      setNotice("Product created.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Product create failed"));
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
    if (!bannerForm.title.trim() || !bannerForm.desktopImageUrl || !bannerForm.mobileImageUrl) {
      setNotice("Banner title, desktop image, and mobile image are required.");
      return;
    }

    try {
      await apiClient.adminCreateBanner(
        {
          title: bannerForm.title.trim(),
          desktopImageUrl: bannerForm.desktopImageUrl,
          mobileImageUrl: bannerForm.mobileImageUrl,
          clickUrl: bannerForm.clickUrl || null,
          sortOrder: Number(bannerForm.sortOrder || 0),
          isActive: true,
        },
        token ?? undefined,
      );
      setBannerForm({ title: "", desktopImageUrl: "", mobileImageUrl: "", clickUrl: "", sortOrder: "0" });
      await refreshBanners();
      setNotice("Banner created.");
    } catch (error) {
      setNotice(safeErrorMessage(error, "Banner create failed"));
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
          mobileImageUrl: banner.mobileImageUrl,
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
          mobileImageUrl: banner.mobileImageUrl,
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
      {notice && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-orange-700">{notice}</p>
          </CardContent>
        </Card>
      )}

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
              <CardTitle className="flex items-center gap-2 text-lg">
                <Boxes className="h-4 w-4" /> Create Category
              </CardTitle>
              <CardDescription>Manage hierarchy, image URLs, and header navigation visibility.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <Input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Category name"
              />
              <Input
                value={categoryForm.slug}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, slug: event.target.value }))}
                placeholder="Slug (optional)"
              />
              <Input
                value={categoryForm.imageUrl}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                placeholder="Category image URL"
              />
              <Input
                value={categoryForm.parentId}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, parentId: event.target.value }))}
                placeholder="Parent ID (optional)"
              />
              <label className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={categoryForm.isHeaderCategory}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, isHeaderCategory: event.target.checked }))}
                />
                Add to header
              </label>
              <Button onClick={handleCreateCategory}>Create Category</Button>
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
                    {category.parentId !== null && <Badge variant="outline">Parent: {category.parentId}</Badge>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleHeaderCategory(category)}>
                      {category.isHeaderCategory ? "Unpin" : "Pin"}
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-4 w-4" /> Create Product
              </CardTitle>
              <CardDescription>All products require one category and one CDN image URL.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Product name" />
              <Input value={productForm.categoryId} onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))} placeholder="Category ID" />
              <Input value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="Price" />
              <Input value={productForm.stock} onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))} placeholder="Stock" />
              <Input value={productForm.slug} onChange={(event) => setProductForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="Slug" />
              <Input value={productForm.discountedPrice} onChange={(event) => setProductForm((prev) => ({ ...prev, discountedPrice: event.target.value }))} placeholder="Discounted price" />
              <Input value={productForm.imageUrl} onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrl: event.target.value }))} placeholder="CDN image URL" className="xl:col-span-2" />
              <Textarea value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Description" className="xl:col-span-3" />
              <Button onClick={handleCreateProduct}>Create Product</Button>
            </CardContent>
          </Card>

          {rootCategories.length === 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4 text-sm text-amber-700">
                Create at least one root category before adding products.
              </CardContent>
            </Card>
          )}

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
                    Price: ৳ {product.price.toLocaleString()} | Stock: {product.stock}
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="h-4 w-4" /> Create Banner
              </CardTitle>
              <CardDescription>Use both desktop and mobile images for responsive campaign delivery.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input value={bannerForm.title} onChange={(event) => setBannerForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Banner title" />
              <Input value={bannerForm.desktopImageUrl} onChange={(event) => setBannerForm((prev) => ({ ...prev, desktopImageUrl: event.target.value }))} placeholder="Desktop image URL" />
              <Input value={bannerForm.mobileImageUrl} onChange={(event) => setBannerForm((prev) => ({ ...prev, mobileImageUrl: event.target.value }))} placeholder="Mobile image URL" />
              <Input value={bannerForm.clickUrl} onChange={(event) => setBannerForm((prev) => ({ ...prev, clickUrl: event.target.value }))} placeholder="Click URL" />
              <Input value={bannerForm.sortOrder} onChange={(event) => setBannerForm((prev) => ({ ...prev, sortOrder: event.target.value }))} placeholder="Sort order" />
              <Button onClick={handleCreateBanner} className="md:col-span-2 xl:col-span-3">
                <ImageIcon className="h-4 w-4" /> Create Banner
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {banners.map((banner) => (
              <Card key={banner.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{banner.title}</CardTitle>
                    <Badge variant={banner.isActive ? "default" : "outline"}>
                      {banner.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>#{banner.id} | Sort: {banner.sortOrder}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-zinc-600">
                    <p className="truncate">Desktop: {banner.desktopImageUrl}</p>
                    <p className="truncate">Mobile: {banner.mobileImageUrl}</p>
                  </div>
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
