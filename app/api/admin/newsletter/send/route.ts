import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { adminNewsletterSendSchema } from "@/lib/server/schemas";
import { sendNewsletterCampaignAdmin } from "@/lib/server/services/newsletter-service";

export const dynamic = "force-dynamic";

async function POSTHandler(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const body = await parseJsonBody(request, adminNewsletterSendSchema);

    const result = await sendNewsletterCampaignAdmin({
      subject: body.subject,
      preheader: body.preheader,
      bodyHtml: body.bodyHtml,
    });

    return jsonResponse({ success: true, summary: result }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POST = withRouteAudit(POSTHandler);
