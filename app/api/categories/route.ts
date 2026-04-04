import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import { getPublicCategoryTree } from "@/lib/server/services/category-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getPublicCategoryTree();
    return jsonResponse({ items: categories });
  } catch (error) {
    return handleRouteError(error);
  }
}
