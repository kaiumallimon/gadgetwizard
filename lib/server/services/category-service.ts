import {
  countProductsByCategoryId,
  countHeaderCategories,
  createCategory,
  deleteCategory,
  findCategoryById,
  listCategories,
  updateCategory,
  type CategoryRecord,
} from "@/lib/server/repositories/category-repository";
import { badRequest, conflict, notFound } from "@/lib/server/core/errors";
import { slugify } from "@/lib/server/utils/slug";
import { assertValidCdnUrls } from "@/lib/server/utils/cdn";

const MAX_HEADER_CATEGORIES = 8;

type MySqlError = {
  code?: string;
  errno?: number;
};

function isForeignKeyConstraintError(error: unknown): boolean {
  const dbError = error as MySqlError;
  return dbError?.code === "ER_ROW_IS_REFERENCED_2" || dbError?.errno === 1451;
}

export interface CategoryTreeNode extends CategoryRecord {
  children: CategoryTreeNode[];
}

function withEmptyChildren(categories: CategoryRecord[]): CategoryTreeNode[] {
  return categories.map((category) => ({
    ...category,
    children: [],
  }));
}

export async function getPublicCategoryTree(): Promise<CategoryTreeNode[]> {
  const categories = await listCategories(true);
  return withEmptyChildren(categories);
}

export async function getAdminCategories(): Promise<CategoryRecord[]> {
  return listCategories(false);
}

export async function createCategoryAdmin(input: {
  name: string;
  slug?: string;
  icon?: string | null;
  imageUrl?: string | null;
  isHeaderCategory?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<CategoryRecord> {
  const normalizedSlug = slugify(input.slug ?? input.name);
  if (!normalizedSlug) {
    throw badRequest("Category slug cannot be empty");
  }

  if (input.imageUrl) {
    assertValidCdnUrls([input.imageUrl]);
  }

  const shouldBeHeaderCategory = input.isHeaderCategory ?? false;
  if (shouldBeHeaderCategory) {
    const selectedCount = await countHeaderCategories();
    if (selectedCount >= MAX_HEADER_CATEGORIES) {
      throw badRequest(`At most ${MAX_HEADER_CATEGORIES} header categories can be selected`);
    }
  }

  return createCategory({
    name: input.name.trim(),
    slug: normalizedSlug,
    icon: input.icon ?? null,
    imageUrl: input.imageUrl ?? null,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
    isHeaderCategory: shouldBeHeaderCategory,
    isFeatured: input.isFeatured ?? false,
  });
}

export async function updateCategoryAdmin(
  id: number,
  input: {
    name: string;
    slug?: string;
    icon?: string | null;
    imageUrl?: string | null;
    isHeaderCategory?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
    isActive?: boolean;
  },
): Promise<CategoryRecord> {
  const existing = await findCategoryById(id);
  if (!existing) {
    throw notFound("Category not found");
  }

  const normalizedSlug = slugify(input.slug ?? input.name);
  if (!normalizedSlug) {
    throw badRequest("Category slug cannot be empty");
  }

  if (input.imageUrl) {
    assertValidCdnUrls([input.imageUrl]);
  }

  const shouldBeHeaderCategory = input.isHeaderCategory ?? existing.isHeaderCategory;
  if (shouldBeHeaderCategory && !existing.isHeaderCategory) {
    const selectedCount = await countHeaderCategories(id);
    if (selectedCount >= MAX_HEADER_CATEGORIES) {
      throw badRequest(`At most ${MAX_HEADER_CATEGORIES} header categories can be selected`);
    }
  }

  const updated = await updateCategory(id, {
    name: input.name.trim(),
    slug: normalizedSlug,
    icon: input.icon ?? null,
    imageUrl: input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl,
    sortOrder: input.sortOrder ?? existing.sortOrder,
    isActive: input.isActive ?? existing.isActive,
    isHeaderCategory: shouldBeHeaderCategory,
    isFeatured: input.isFeatured ?? existing.isFeatured,
  });

  if (!updated) {
    throw notFound("Category not found");
  }

  return updated;
}

export async function deleteCategoryAdmin(id: number): Promise<void> {
  const existing = await findCategoryById(id);
  if (!existing) {
    throw notFound("Category not found");
  }

  const linkedProductCount = await countProductsByCategoryId(id);
  if (linkedProductCount > 0) {
    throw conflict(
      "Cannot delete this category because products are assigned to it. Reassign those products first.",
    );
  }

  try {
    await deleteCategory(id);
  } catch (error) {
    // Defensive fallback for race conditions where product links are created after the pre-check.
    if (isForeignKeyConstraintError(error)) {
      throw conflict(
        "Cannot delete this category because products are assigned to it. Reassign those products first.",
      );
    }

    throw error;
  }
}
