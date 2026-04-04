import { z } from "zod";

import { badRequest } from "@/lib/server/core/errors";

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw badRequest("Content-Type must be application/json");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw badRequest("Invalid JSON body");
  }

  return schema.parse(json);
}

export function parseSearchParams<T>(url: URL, schema: z.ZodType<T>): T {
  const raw: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    raw[key] = value;
  }

  return schema.parse(raw);
}
