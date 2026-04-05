"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { Brand } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BrandListManagerProps {
  initialBrands: Brand[];
}

function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function BrandListManager({ initialBrands }: BrandListManagerProps) {
  const { token } = useAuthStore();
  const [items, setItems] = useState(initialBrands);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const sortedItems = useMemo(
    () => [...items].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)),
    [items],
  );

  async function deleteBrand(brand: Brand) {
    const confirmed = window.confirm(`Delete ${brand.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(brand.id);
      await apiClient.adminDeleteBrand(brand.id, token ?? undefined);
      setItems((previous) => previous.filter((entry) => entry.id !== brand.id));
      toast.success("Brand deleted.");
    } catch (error) {
      toast.error(safeErrorMessage(error, "Unable to delete brand"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {sortedItems.map((brand) => {
          return (
            <Card key={brand.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1 text-base">{brand.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant={brand.isActive ? "default" : "outline"}>{brand.isActive ? "Active" : "Inactive"}</Badge>
                    {brand.isFeatured && <Badge variant="secondary">Featured</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {brand.imageUrl && (
                  <div className="overflow-hidden rounded-md border border-zinc-200">
                    <div className="h-28 bg-zinc-50 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={brand.imageUrl} alt={brand.name} className="h-full w-full object-contain" />
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-sm text-zinc-700">
                  <p><span className="font-medium text-zinc-900">Slug:</span> {brand.slug}</p>
                  <p><span className="font-medium text-zinc-900">Sort Order:</span> {brand.sortOrder}</p>
                  <p><span className="font-medium text-zinc-900">Status:</span> {brand.isActive ? "Active" : "Inactive"}</p>
                  <p><span className="font-medium text-zinc-900">Featured:</span> {brand.isFeatured ? "Yes" : "No"}</p>
                  <p className="line-clamp-3">
                    <span className="font-medium text-zinc-900">Description:</span> {brand.description ?? "No description"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild type="button" variant="outline">
                    <Link href={`/admin/brands/${brand.id}`}>
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => deleteBrand(brand)} disabled={deletingId === brand.id}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {items.length === 0 && <p className="text-sm text-zinc-500">No brands found.</p>}
    </div>
  );
}
