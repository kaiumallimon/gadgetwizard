import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { requireRole } from "@/lib/server/auth/guards";
import { badRequest } from "@/lib/server/core/errors";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminProductSchema } from "@/lib/server/schemas";
import { deleteProductAdmin, updateProductAdmin } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

async function getProductId(context: { params: Promise<{ id: string }> }): Promise<number> {
  const { id } = await context.params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) {
    throw badRequest("Invalid product id");
  }

  return productId;
}

async function PUTHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["admin"]);
    const productId = await getProductId(context);
    const body = await parseJsonBody(request, adminProductSchema);

    const product = await updateProductAdmin(productId, body);
    return jsonResponse({ item: product }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function DELETEHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["admin"]);
    const productId = await getProductId(context);

    await deleteProductAdmin(productId);
    return jsonResponse({ success: true }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const PUT = withRouteAudit(PUTHandler);
export const DELETE = withRouteAudit(DELETEHandler);
