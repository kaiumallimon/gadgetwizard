import { handleRouteError, jsonResponse } from "@/lib/server/core/http";
import { getPublicFaqs } from "@/lib/server/services/faq-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const faqs = await getPublicFaqs();
    return jsonResponse({ items: faqs });
  } catch (error) {
    return handleRouteError(error);
  }
}
