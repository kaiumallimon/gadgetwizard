import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { businessAccountApplicationSchema } from "@/lib/server/schemas";
import {
  getBusinessAccountForUser,
  submitBusinessAccountApplication,
} from "@/lib/server/services/business-account-service";

export const dynamic = "force-dynamic";

async function GETHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const item = await getBusinessAccountForUser(session.userId);
    return jsonResponse({ item }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function POSTHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const body = await parseJsonBody(request, businessAccountApplicationSchema);

    const item = await submitBusinessAccountApplication({
      userId: session.userId,
      businessName: body.businessName,
      legalEntityType: body.legalEntityType,
      registrationNumber: body.registrationNumber ?? null,
      taxId: body.taxId ?? null,
      yearsInOperation: body.yearsInOperation ?? null,
      websiteUrl: body.websiteUrl ?? null,
      primaryContactName: body.primaryContactName,
      primaryContactRole: body.primaryContactRole ?? null,
      primaryContactEmail: body.primaryContactEmail,
      primaryContactPhone: body.primaryContactPhone,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2 ?? null,
      city: body.city,
      state: body.state ?? null,
      postalCode: body.postalCode ?? null,
      country: body.country,
      monthlyPurchaseVolume: body.monthlyPurchaseVolume ?? null,
      productCategories: body.productCategories ?? [],
      documentUrls: body.documentUrls ?? [],
      additionalNotes: body.additionalNotes ?? null,
    });

    return jsonResponse({ item }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
export const POST = withRouteAudit(POSTHandler);
