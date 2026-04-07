"use client";

import Link from "next/link";
import { Menu, SlidersHorizontal } from "lucide-react";
import { useRef, useState, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface CategoryBrandFacet {
  slug: string;
  name: string;
  total: number;
}

interface CategoryColorFacet {
  value: string;
  label: string;
  total: number;
}

interface SortOption {
  value: string;
  label: string;
}

interface CategoryFiltersProps {
  slug: string;
  search?: string;
  priceMin: number;
  priceMax: number;
  selectedMinPrice: number;
  selectedMaxPrice: number;
  brands: CategoryBrandFacet[];
  selectedBrandSlugs: string[];
  colors: CategoryColorFacet[];
  selectedColors: string[];
  availabilitySelections: Array<"in" | "out">;
  sortOptions: SortOption[];
  sortPrimary: string;
  sortSecondary?: string;
  pageSize: number;
  pageSizeOptions: readonly number[];
}

const FIELD_CLASSNAME =
  "flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)";

export function CategoryFilters({
  slug,
  search,
  priceMin,
  priceMax,
  selectedMinPrice,
  selectedMaxPrice,
  brands,
  selectedBrandSlugs,
  colors,
  selectedColors,
  availabilitySelections,
  sortOptions,
  sortPrimary,
  sortSecondary,
  pageSize,
  pageSizeOptions,
}: CategoryFiltersProps) {
  const desktopFormRef = useRef<HTMLFormElement>(null);
  const mobileFormRef = useRef<HTMLFormElement>(null);
  const [minPriceValue, setMinPriceValue] = useState(selectedMinPrice);
  const [maxPriceValue, setMaxPriceValue] = useState(selectedMaxPrice);
  const hasPriceRange = priceMax >= priceMin;

  function submitForm(formRef: RefObject<HTMLFormElement | null>) {
    formRef.current?.requestSubmit();
  }

  function normalizePrice(rawValue: string, fallback: number) {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    const rounded = Math.floor(parsed);
    return Math.min(priceMax, Math.max(priceMin, rounded));
  }

  function renderFilterForm(options: {
    formRef: RefObject<HTMLFormElement | null>;
    idPrefix: string;
  }) {
    const { formRef, idPrefix } = options;
    const submitCurrentForm = () => submitForm(formRef);

    return (
      <form ref={formRef} method="GET" action={`/category/${slug}`} className="space-y-6">
        <input type="hidden" name="page" value="1" />

        <div className="space-y-2">
          <label htmlFor={`${idPrefix}-search`} className="text-sm font-medium text-zinc-800">Search</label>
          <Input
            id={`${idPrefix}-search`}
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search in this category"
            onBlur={submitCurrentForm}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submitCurrentForm();
              }
            }}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-800">Price Range</p>
          {hasPriceRange ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor={`${idPrefix}-minPrice`} className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                    Min (AUD)
                  </label>
                  <Input
                    id={`${idPrefix}-minPrice`}
                    type="number"
                    name="minPrice"
                    min={priceMin}
                    max={priceMax}
                    value={minPriceValue}
                    onChange={(event) => {
                      const nextMin = normalizePrice(event.target.value, minPriceValue);
                      if (nextMin > maxPriceValue) {
                        setMaxPriceValue(nextMin);
                      }

                      setMinPriceValue(nextMin);
                    }}
                    onBlur={submitCurrentForm}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        submitCurrentForm();
                      }
                    }}
                    className="text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={`${idPrefix}-maxPrice`} className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                    Max (AUD)
                  </label>
                  <Input
                    id={`${idPrefix}-maxPrice`}
                    type="number"
                    name="maxPrice"
                    min={priceMin}
                    max={priceMax}
                    value={maxPriceValue}
                    onChange={(event) => {
                      const nextMax = normalizePrice(event.target.value, maxPriceValue);
                      setMaxPriceValue(nextMax);
                      if (nextMax < minPriceValue) {
                        setMinPriceValue(nextMax);
                      }
                    }}
                    onBlur={submitCurrentForm}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        submitCurrentForm();
                      }
                    }}
                    className="text-right"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                Set a range between AUD {priceMin.toLocaleString()} and AUD {priceMax.toLocaleString()}.
              </p>
            </>
          ) : (
            <p className="text-xs text-zinc-500">No price range available for this category yet.</p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-800">Brands</p>
          {brands.length > 0 ? (
            <div className="grid max-h-52 gap-2 overflow-y-auto pr-1">
              {brands.map((brand) => (
                <label key={brand.slug} className="block rounded-md border border-zinc-200 px-2 py-1.5 text-sm text-zinc-700">
                  <span className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="brand"
                      value={brand.slug}
                      defaultChecked={selectedBrandSlugs.includes(brand.slug)}
                      onChange={submitCurrentForm}
                      className="h-4 w-4 rounded border-zinc-300 accent-(--accent)"
                    />
                    {brand.name}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No brands found in this category.</p>
          )}
        </div>

        {colors.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-800">Colors</p>
            <div className="grid max-h-52 gap-2 overflow-y-auto pr-1">
              {colors.map((color) => (
                <label key={color.value} className="block rounded-md border border-zinc-200 px-2 py-1.5 text-sm text-zinc-700">
                  <span className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="color"
                      value={color.value}
                      defaultChecked={selectedColors.includes(color.value)}
                      onChange={submitCurrentForm}
                      className="h-4 w-4 rounded border-zinc-300 accent-(--accent)"
                    />
                    {color.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-800">Availability</p>
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="availability"
                value="in"
                defaultChecked={availabilitySelections.includes("in")}
                onChange={submitCurrentForm}
                className="h-4 w-4 rounded border-zinc-300 accent-(--accent)"
              />
              In stock
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="availability"
                value="out"
                defaultChecked={availabilitySelections.includes("out")}
                onChange={submitCurrentForm}
                className="h-4 w-4 rounded border-zinc-300 accent-(--accent)"
              />
              Out of stock
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor={`${idPrefix}-sortPrimary`} className="text-sm font-medium text-zinc-800">Primary sort</label>
          <select
            id={`${idPrefix}-sortPrimary`}
            name="sortPrimary"
            defaultValue={sortPrimary}
            onChange={submitCurrentForm}
            className={FIELD_CLASSNAME}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor={`${idPrefix}-sortSecondary`} className="text-sm font-medium text-zinc-800">Secondary sort</label>
          <select
            id={`${idPrefix}-sortSecondary`}
            name="sortSecondary"
            defaultValue={sortSecondary ?? ""}
            onChange={submitCurrentForm}
            className={FIELD_CLASSNAME}
          >
            <option value="">None</option>
            {sortOptions.filter((option) => option.value !== sortPrimary).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor={`${idPrefix}-pageSize`} className="text-sm font-medium text-zinc-800">Products per page</label>
          <select
            id={`${idPrefix}-pageSize`}
            name="pageSize"
            defaultValue={String(pageSize)}
            onChange={submitCurrentForm}
            className={FIELD_CLASSNAME}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={String(size)}>{size} per page</option>
            ))}
          </select>
        </div>

        <div>
          <Link href={`/category/${slug}`} className="text-sm font-medium text-(--accent) hover:underline">
            Clear all filters
          </Link>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-zinc-200 bg-white/90 font-medium text-zinc-800 shadow-sm"
            >
              <Menu className="h-4 w-4" /> Filters
            </Button>
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="gw-soft-border-dark max-h-[88vh] rounded-t-3xl border bg-white/95 p-0 backdrop-blur-2xl"
          >
            <SheetHeader className="gw-soft-border-dark border-b bg-white/90 px-5 py-4 text-left">
              <SheetTitle className="inline-flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4" /> Filter Products
              </SheetTitle>
              <SheetDescription className="text-xs">
                Refine your category results instantly.
              </SheetDescription>
            </SheetHeader>

            <div className="max-h-[calc(88vh-88px)] overflow-y-auto px-5 py-4">
              {renderFilterForm({ formRef: mobileFormRef, idPrefix: "mobile" })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="hidden h-fit lg:block">
        <CardHeader>
          <CardTitle>Filter Products</CardTitle>
          <CardDescription>Everything applies automatically when you select a filter.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderFilterForm({ formRef: desktopFormRef, idPrefix: "desktop" })}
        </CardContent>
      </Card>
    </div>
  );
}
