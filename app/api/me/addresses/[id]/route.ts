import { z } from "zod";
import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { badRequest } from "@/lib/server/core/errors";
import { parseJsonBody } from "@/lib/server/core/validation";
import { updateUserAddress, deleteUserAddress } from "@/lib/server/services/address-service";

export const dynamic = "force-dynamic";

const updateAddressSchema = z.object({
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

async function PUTHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(request, ["user"]);
    const { id } = await params;
    const addressId = Number(id);
    if (!Number.isInteger(addressId) || addressId <= 0) {
      throw badRequest("Invalid address ID");
    }

    const body = await parseJsonBody(request, updateAddressSchema);
    const address = await updateUserAddress(session.userId, addressId, body);
    return jsonResponse({ item: address }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

async function DELETEHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(request, ["user"]);
    const { id } = await params;
    const addressId = Number(id);
    if (!Number.isInteger(addressId) || addressId <= 0) {
      throw badRequest("Invalid address ID");
    }

    await deleteUserAddress(session.userId, addressId);
    return jsonResponse({ success: true }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const PUT = withRouteAudit(PUTHandler);
export const DELETE = withRouteAudit(DELETEHandler);
