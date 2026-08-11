import type { NextRequest } from "next/server";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { badRequest } from "@/lib/server/core/errors";
import { handleRouteError, jsonResponse, noStoreHeaders } from "@/lib/server/core/http";
import { uploadImageToCdn } from "@/lib/server/services/cdn-service";
import { rateLimit } from "@/lib/server/middleware/rate-limit";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const checkRateLimit = rateLimit({ windowMs: 60_000, max: 10 });

async function POSTHandler(request: NextRequest) {
  try {
    const limited = checkRateLimit(request);
    if (limited) return limited;

    await requireRole(request, ["user"]);

    const formData = await request.formData();
    const maybeFile = formData.get("file");

    if (!(maybeFile instanceof File)) {
      throw badRequest("File is required");
    }

    if (!ALLOWED_MIME_TYPES.includes(maybeFile.type)) {
      throw badRequest(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`);
    }

    if (maybeFile.size > MAX_FILE_SIZE_BYTES) {
      throw badRequest(`File too large. Maximum size: ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`);
    }

    const item = await uploadImageToCdn(maybeFile);
    return jsonResponse({ item }, 200, noStoreHeaders());
  } catch (error) {
    return handleRouteError(error);
  }
}

export const POST = withRouteAudit(POSTHandler);
