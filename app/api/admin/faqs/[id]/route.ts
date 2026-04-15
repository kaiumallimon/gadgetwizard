import type { NextRequest } from "next/server";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

import { requireRole } from "@/lib/server/auth/guards";
import { badRequest } from "@/lib/server/core/errors";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminFaqSchema } from "@/lib/server/schemas";
import { deleteFaqAdmin, updateFaqAdmin } from "@/lib/server/services/faq-service";

export const dynamic = "force-dynamic";

async function getFaqId(context: { params: Promise<{ id: string }> }): Promise<number> {
  const { id } = await context.params;
  const faqId = Number(id);
  if (!Number.isInteger(faqId) || faqId <= 0) {
    throw badRequest("Invalid FAQ id");
  }

  return faqId;
}

async function PUTHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["admin"]);
    const faqId = await getFaqId(context);
    const body = await parseJsonBody(request, adminFaqSchema);

    const faq = await updateFaqAdmin(faqId, body);
    return jsonResponse({ item: faq }, 200, noStoreHeaders());
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
    const faqId = await getFaqId(context);

    await deleteFaqAdmin(faqId);
    return jsonResponse({ success: true }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const PUT = withRouteAudit(PUTHandler);
export const DELETE = withRouteAudit(DELETEHandler);
