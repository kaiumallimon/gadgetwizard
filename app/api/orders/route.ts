import { z } from "zod";
import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { createOrderAfterPayment, getUserOrders } from "@/lib/server/services/order-service";

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

const createOrderSchema = z.object({
  paymentIntentId: z.string().min(1),
  addressId: z.number().int().positive().optional(),
  newAddress: newAddressSchema.optional(),
}).refine((data) => data.addressId !== undefined || data.newAddress !== undefined, {
  message: "Either addressId or newAddress is required",
});

async function GETHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const orders = await getUserOrders(session.userId);
    return jsonResponse({ items: orders }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function POSTHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const body = await parseJsonBody(request, createOrderSchema);

    const order = await createOrderAfterPayment({
      userId: session.userId,
      paymentIntentId: body.paymentIntentId,
      addressInput: {
        addressId: body.addressId,
        newAddress: body.newAddress,
      },
    });

    return jsonResponse({ order }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
export const POST = withRouteAudit(POSTHandler);
