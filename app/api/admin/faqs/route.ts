import type { NextRequest } from "next/server";

import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminFaqSchema } from "@/lib/server/schemas";
import { createFaqAdmin, getAdminFaqs } from "@/lib/server/services/faq-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const faqs = await getAdminFaqs();

    return jsonResponse({ items: faqs }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const body = await parseJsonBody(request, adminFaqSchema);

    const faq = await createFaqAdmin(body);
    return jsonResponse({ item: faq }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}
