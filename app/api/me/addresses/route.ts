import { z } from "zod";
import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { parseJsonBody } from "@/lib/server/core/validation";
import { getUserAddresses, createUserAddress } from "@/lib/server/services/address-service";

export const dynamic = "force-dynamic";

const createAddressSchema = z.object({
  label: z.string().max(100).optional(),
  fullName: z.string().min(1, "Full name is required").max(255),
  phone: z.string().min(1, "Phone is required").max(30),
  addressLine1: z.string().min(1, "Address line 1 is required").max(500),
  addressLine2: z.string().max(500).optional(),
  city: z.string().min(1, "City is required").max(255),
  state: z.string().max(255).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).default("Bangladesh"),
  isDefault: z.boolean().optional(),
});

async function GETHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const addresses = await getUserAddresses(session.userId);
    return jsonResponse({ items: addresses }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function POSTHandler(request: NextRequest) {
  try {
    const session = await requireRole(request, ["user"]);
    const body = await parseJsonBody(request, createAddressSchema);
    const address = await createUserAddress(session.userId, body);
    return jsonResponse({ item: address }, 201, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
export const POST = withRouteAudit(POSTHandler);
