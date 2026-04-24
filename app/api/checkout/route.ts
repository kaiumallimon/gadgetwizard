import { z } from "zod";
import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { createPaymentIntent } from "@/lib/server/services/order-service";

export const dynamic = "force-dynamic";

const newAddressSchema = z.object({
  label: z.string().max(100).optional(),
  fullName: z.string().min(1).max(255),
  phone: z.string().min(1).max(30),
  addressLine1: z.string().min(1).max(500),
  addressLine2: z.string().max(500).optional(),
  city: z.string().min(1).max(255),
  state: z.string().max(255).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).default("Bangladesh"),
  saveAddress: z.boolean().optional(),
});

const checkoutSchema = z.object({
  addressId: z.number().int().positive().optional(),
  newAddress: newAddressSchema.optional(),
}).refine((data) => data.addressId !== undefined || data.newAddress !== undefined, {
  message: "Either addressId or newAddress is required",
});

async function POSTHandler(request: NextRequest) {
  try {
    // Only users (not admins) can checkout
    const session = await requireRole(request, ["user"]);
    const body = await parseJsonBody(request, checkoutSchema);

    const result = await createPaymentIntent(session.userId, {
      addressId: body.addressId,
      newAddress: body.newAddress,
    });

    return jsonResponse(result, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POST = withRouteAudit(POSTHandler);
