import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { badRequest } from "@/lib/server/core/errors";
import { z } from "zod";
import { checkoutAddressSchema } from "@/lib/server/schemas";
import { attachAddressToPaymentIntent } from "@/lib/server/services/order-service";

export const dynamic = "force-dynamic";

const attachAddressSchema = z.object({
  selectedProductIds: z.array(z.number().int().positive()).optional(),
  addressId: z.number().int().positive().optional(),
  newAddress: checkoutAddressSchema.optional(),
});

async function PATCHHandler(
  request: NextRequest,
  { params }: { params: Promise<{ paymentIntentId: string }> },
) {
  try {
    const session = await requireRole(request, ["user"]);
    const { paymentIntentId } = await params;
    if (!paymentIntentId) {
      throw badRequest("Invalid payment intent ID");
    }

    const body = await parseJsonBody(request, attachAddressSchema);
    await attachAddressToPaymentIntent(session.userId, paymentIntentId, {
      selectedProductIds: body.selectedProductIds,
      addressId: body.addressId,
      newAddress: body.newAddress,
    });

    return jsonResponse({ ok: true }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const PATCH = withRouteAudit(PATCHHandler);
