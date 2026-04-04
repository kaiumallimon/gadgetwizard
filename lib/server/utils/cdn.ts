import { badRequest } from "@/lib/server/core/errors";
import { getEnv } from "@/lib/server/core/env";

export function assertValidCdnUrls(urls: string[]): void {
  const env = getEnv();
  const cdn = new URL(env.CDN_BASE_URL);

  for (const imageUrl of urls) {
    let parsed: URL;
    try {
      parsed = new URL(imageUrl);
    } catch {
      throw badRequest("One or more image URLs are invalid");
    }

    if (parsed.origin !== cdn.origin) {
      throw badRequest("Image URL must belong to configured CDN base URL");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw badRequest("Invalid image URL protocol");
    }

    if (parsed.pathname.includes("..")) {
      throw badRequest("Invalid image URL path");
    }
  }
}
