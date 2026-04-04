import { ZodError } from "zod";

import { HttpError } from "@/lib/server/core/errors";

const DEFAULT_SECURITY_HEADERS: HeadersInit = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
};

export function jsonResponse(payload: unknown, status = 200, headers: HeadersInit = {}): Response {
  return Response.json(payload, {
    status,
    headers: {
      ...DEFAULT_SECURITY_HEADERS,
      ...headers,
    },
  });
}

export function noStoreHeaders(headers: HeadersInit = {}): HeadersInit {
  return {
    "Cache-Control": "no-store, max-age=0",
    ...headers,
  };
}

export function handleRouteError(error: unknown): Response {
  if (error instanceof HttpError) {
    return jsonResponse(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
      },
      error.statusCode,
    );
  }

  if (error instanceof ZodError) {
    return jsonResponse(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request payload",
          details: error.flatten(),
        },
      },
      422,
    );
  }

  console.error("Unhandled route error", error);
  return jsonResponse(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error",
      },
    },
    500,
  );
}
