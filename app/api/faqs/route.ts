import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import { getPublicFaqs } from "@/lib/server/services/faq-service";
import { withRouteAudit } from "@/lib/server/middleware/route-audit";

export const dynamic = "force-dynamic";

async function GETHandler() {
  try {
    const faqs = await getPublicFaqs();
    return jsonResponse({ items: faqs });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
