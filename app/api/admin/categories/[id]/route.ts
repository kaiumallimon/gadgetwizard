import type { NextRequest } from "next/server";

import { requireRole } from "@/lib/server/auth/guards";
import { badRequest } from "@/lib/server/core/errors";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminCategorySchema } from "@/lib/server/schemas";
import { deleteCategoryAdmin, updateCategoryAdmin } from "@/lib/server/services/category-service";

export const dynamic = "force-dynamic";

async function getCategoryId(context: { params: Promise<{ id: string }> }): Promise<number> {
  const { id } = await context.params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw badRequest("Invalid category id");
  }

  return categoryId;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["admin"]);
    const categoryId = await getCategoryId(context);
    const body = await parseJsonBody(request, adminCategorySchema);

    const category = await updateCategoryAdmin(categoryId, body);
    return jsonResponse({ item: category }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["admin"]);
    const categoryId = await getCategoryId(context);

    await deleteCategoryAdmin(categoryId);
    return jsonResponse({ success: true }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}
