import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import { getPublicBrands } from "@/lib/server/services/brand-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = await getPublicBrands();
    return jsonResponse({ items: brands });
  } catch (error) {
    return handleRouteError(error);
  }
}
