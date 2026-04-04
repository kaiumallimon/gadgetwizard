import {
  countHeaderCategories,
  createCategory,
  deleteCategory,
  findCategoryById,
  listCategories,
  updateCategory,
  type CategoryRecord,
} from "@/lib/server/repositories/category-repository";
import { badRequest, notFound } from "@/lib/server/core/errors";
import { slugify } from "@/lib/server/utils/slug";
import { assertValidCdnUrls } from "@/lib/server/utils/cdn";

const MAX_HEADER_CATEGORIES = 8;

export interface CategoryTreeNode extends CategoryRecord {
  children: CategoryTreeNode[];
}

function buildTree(categories: CategoryRecord[]): CategoryTreeNode[] {
  const map = new Map<number, CategoryTreeNode>();

  for (const category of categories) {
    map.set(category.id, {
      ...category,
      children: [],
    });
  }

  const roots: CategoryTreeNode[] = [];
  for (const category of map.values()) {
    if (category.parentId === null) {
      roots.push(category);
      continue;
    }

    const parent = map.get(category.parentId);
    if (!parent) {
      roots.push(category);
      continue;
    }

    parent.children.push(category);
  }

  return roots;
}

export async function getPublicCategoryTree(): Promise<CategoryTreeNode[]> {
  const categories = await listCategories(true);
  return buildTree(categories);
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
  parentId?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<CategoryRecord> {
  const normalizedSlug = slugify(input.slug ?? input.name);
  if (!normalizedSlug) {
    throw badRequest("Category slug cannot be empty");
  }

  if (input.parentId) {
    const parent = await findCategoryById(input.parentId);
    if (!parent) {
      throw badRequest("Parent category not found");
    }
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
    parentId: input.parentId ?? null,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
    isHeaderCategory: shouldBeHeaderCategory,
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
    parentId?: number | null;
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

  const nextParent = input.parentId ?? null;
  if (nextParent === id) {
    throw badRequest("Category cannot be parent of itself");
  }

  if (nextParent) {
    const parent = await findCategoryById(nextParent);
    if (!parent) {
      throw badRequest("Parent category not found");
    }
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
    parentId: nextParent,
    sortOrder: input.sortOrder ?? existing.sortOrder,
    isActive: input.isActive ?? existing.isActive,
    isHeaderCategory: shouldBeHeaderCategory,
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

  await deleteCategory(id);
}
