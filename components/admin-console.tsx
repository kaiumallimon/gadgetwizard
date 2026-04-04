"use client";

import { useMemo, useState } from "react";

import { apiClient } from "@/lib/client/api";
import type { Banner, Category, Product } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

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
}

type TabId = "analytics" | "categories" | "products" | "banners";

export function AdminConsole({
  initialAnalytics,
  initialCategories,
  initialProducts,
  initialBanners,
}: AdminConsoleProps) {
  const { token } = useAuthStore();
  const [tab, setTab] = useState<TabId>("analytics");
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [banners, setBanners] = useState(initialBanners);
  const [notice, setNotice] = useState<string>("");

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    imageUrl: "",
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

  const rootCategories = useMemo(
    () => categories.filter((category) => category.parentId === null),
    [categories],
  );

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
    try {
      await apiClient.adminCreateCategory(
        {
          name: categoryForm.name,
          slug: categoryForm.slug || undefined,
          imageUrl: categoryForm.imageUrl || null,
          parentId: categoryForm.parentId ? Number(categoryForm.parentId) : null,
        },
        token ?? undefined,
      );
      setCategoryForm({ name: "", slug: "", imageUrl: "", parentId: "" });
      await refreshCategories();
      setNotice("Category created.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Category create failed");
    }
  }

  async function handleUpdateCategory(category: Category) {
    const name = window.prompt("Category name", category.name);
    if (!name) return;

    try {
      await apiClient.adminUpdateCategory(
        category.id,
        {
          name,
          slug: category.slug,
          icon: category.icon,
          imageUrl: category.imageUrl,
          parentId: category.parentId,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        },
        token ?? undefined,
      );
      await refreshCategories();
      setNotice("Category updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Category update failed");
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
      setNotice(error instanceof Error ? error.message : "Category delete failed");
    }
  }

  async function handleCreateProduct() {
    try {
      await apiClient.adminCreateProduct(
        {
          name: productForm.name,
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
      setNotice(error instanceof Error ? error.message : "Product create failed");
    }
  }

  async function handleUpdateProduct(product: Product) {
    const name = window.prompt("Product name", product.name);
    if (!name) return;

    try {
      await apiClient.adminUpdateProduct(
        product.id,
        {
          name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          discountedPrice: product.discountedPrice,
          stock: product.stock,
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
      setNotice(error instanceof Error ? error.message : "Product update failed");
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
      setNotice(error instanceof Error ? error.message : "Product delete failed");
    }
  }

  async function handleCreateBanner() {
    try {
      await apiClient.adminCreateBanner(
        {
          title: bannerForm.title,
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
      setNotice(error instanceof Error ? error.message : "Banner create failed");
    }
  }

  async function handleUpdateBanner(banner: Banner) {
    const title = window.prompt("Banner title", banner.title);
    if (!title) return;

    try {
      await apiClient.adminUpdateBanner(
        banner.id,
        {
          title,
          desktopImageUrl: banner.desktopImageUrl,
          mobileImageUrl: banner.mobileImageUrl,
          clickUrl: banner.clickUrl,
          sortOrder: banner.sortOrder,
          isActive: banner.isActive,
          startsAt: banner.startsAt,
          endsAt: banner.endsAt,
        },
        token ?? undefined,
      );
      await refreshBanners();
      setNotice("Banner updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Banner update failed");
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
      setNotice(error instanceof Error ? error.message : "Banner delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["analytics", "categories", "products", "banners"] as TabId[]).map((tabId) => (
          <button
            key={tabId}
            type="button"
            onClick={() => setTab(tabId)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tabId === tab
                ? "bg-(--accent) text-black"
                : "border border-white/20 text-white"
            }`}
          >
            {tabId}
          </button>
        ))}
      </div>

      {notice && <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-(--muted)">{notice}</p>}

      {tab === "analytics" && (
        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-(--muted)">Total Users</p>
            <p className="text-2xl font-semibold text-white">{initialAnalytics.totalUsers}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-(--muted)">Total Products</p>
            <p className="text-2xl font-semibold text-white">{initialAnalytics.totalProducts}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:col-span-2">
            <p className="mb-2 text-sm text-(--muted)">Cart Activity</p>
            <div className="flex flex-wrap gap-2">
              {initialAnalytics.cartActivity.map((item) => (
                <span key={item.action} className="rounded-full border border-white/20 px-3 py-1 text-sm">
                  {item.action}: {item.total}
                </span>
              ))}
            </div>
          </article>
        </section>
      )}

      {tab === "categories" && (
        <section className="space-y-4">
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-5">
            <input
              value={categoryForm.name}
              onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Category name"
              className="rounded-xl border border-white/20 bg-black/20 px-3 py-2"
            />
            <input
              value={categoryForm.slug}
              onChange={(event) => setCategoryForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="Slug (optional)"
              className="rounded-xl border border-white/20 bg-black/20 px-3 py-2"
            />
            <input
              value={categoryForm.imageUrl}
              onChange={(event) => setCategoryForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              placeholder="Category image URL (optional)"
              className="rounded-xl border border-white/20 bg-black/20 px-3 py-2"
            />
            <input
              value={categoryForm.parentId}
              onChange={(event) => setCategoryForm((prev) => ({ ...prev, parentId: event.target.value }))}
              placeholder="Parent ID (optional)"
              className="rounded-xl border border-white/20 bg-black/20 px-3 py-2"
            />
            <button type="button" onClick={handleCreateCategory} className="rounded-xl bg-(--accent) px-3 py-2 font-medium text-black">
              Create
            </button>
          </div>

          <div className="space-y-2">
            {categories.map((category) => (
              <article key={category.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{category.name}</p>
                  <p className="text-xs text-(--muted)">ID: {category.id} | Slug: {category.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleUpdateCategory(category)} className="rounded-lg border border-white/20 px-3 py-1 text-sm">Edit</button>
                  <button type="button" onClick={() => handleDeleteCategory(category.id)} className="rounded-lg border border-red-300/30 px-3 py-1 text-sm text-red-200">Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "products" && (
        <section className="space-y-4">
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-4">
            <input value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Product name" className="rounded-xl border border-white/20 bg-black/20 px-3 py-2" />
            <input value={productForm.categoryId} onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))} placeholder="Category ID" className="rounded-xl border border-white/20 bg-black/20 px-3 py-2" />
            <input value={productForm.price} onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="Price" className="rounded-xl border border-white/20 bg-black/20 px-3 py-2" />
            <input value={productForm.stock} onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))} placeholder="Stock" className="rounded-xl border border-white/20 bg-black/20 px-3 py-2" />
            <input value={productForm.slug} onChange={(event) => setProductForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="Slug" className="rounded-xl border border-white/20 bg-black/20 px-3 py-2" />
            <input value={productForm.discountedPrice} onChange={(event) => setProductForm((prev) => ({ ...prev, discountedPrice: event.target.value }))} placeholder="Discounted price" className="rounded-xl border border-white/20 bg-black/20 px-3 py-2" />
            <input value={productForm.imageUrl} onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrl: event.target.value }))} placeholder="CDN image URL" className="rounded-xl border border-white/20 bg-black/20 px-3 py-2 sm:col-span-2" />
            <textarea value={productForm.description} onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Description" className="rounded-xl border border-white/20 bg-black/20 px-3 py-2 sm:col-span-3" />
            <button type="button" onClick={handleCreateProduct} className="rounded-xl bg-(--accent) px-3 py-2 font-medium text-black">Create</button>
          </div>

          <div className="space-y-2">
            {products.map((product) => (
              <article key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{product.name}</p>
                  <p className="text-xs text-(--muted)">ID: {product.id} | ৳ {product.price}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleUpdateProduct(product)} className="rounded-lg border border-white/20 px-3 py-1 text-sm">Edit</button>
                  <button type="button" onClick={() => handleDeleteProduct(product.id)} className="rounded-lg border border-red-300/30 px-3 py-1 text-sm text-red-200">Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "banners" && (
        <section className="space-y-4">
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-4">
            <input value={bannerForm.title} onChange={(event) => setBannerForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Banner title" className="rounded-xl border border-white/20 bg-black/20 px-3 py-2" />
            <input value={bannerForm.desktopImageUrl} onChange={(event) => setBannerForm((prev) => ({ ...prev, desktopImageUrl: event.target.value }))} placeholder="Desktop image URL" className="rounded-xl border border-white/20 bg-black/20 px-3 py-2" />
            <input value={bannerForm.mobileImageUrl} onChange={(event) => setBannerForm((prev) => ({ ...prev, mobileImageUrl: event.target.value }))} placeholder="Mobile image URL" className="rounded-xl border border-white/20 bg-black/20 px-3 py-2" />
            <input value={bannerForm.clickUrl} onChange={(event) => setBannerForm((prev) => ({ ...prev, clickUrl: event.target.value }))} placeholder="Click URL" className="rounded-xl border border-white/20 bg-black/20 px-3 py-2" />
            <input value={bannerForm.sortOrder} onChange={(event) => setBannerForm((prev) => ({ ...prev, sortOrder: event.target.value }))} placeholder="Sort order" className="rounded-xl border border-white/20 bg-black/20 px-3 py-2" />
            <button type="button" onClick={handleCreateBanner} className="rounded-xl bg-(--accent) px-3 py-2 font-medium text-black sm:col-span-3">Create Banner</button>
          </div>

          <div className="space-y-2">
            {banners.map((banner) => (
              <article key={banner.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{banner.title}</p>
                  <p className="text-xs text-(--muted)">ID: {banner.id} | Sort: {banner.sortOrder}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleUpdateBanner(banner)} className="rounded-lg border border-white/20 px-3 py-1 text-sm">Edit</button>
                  <button type="button" onClick={() => handleDeleteBanner(banner.id)} className="rounded-lg border border-red-300/30 px-3 py-1 text-sm text-red-200">Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "products" && rootCategories.length === 0 && (
        <p className="text-sm text-amber-300">Create at least one root category before adding products.</p>
      )}
    </div>
  );
}
