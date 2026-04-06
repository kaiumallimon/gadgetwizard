import { handleRouteError } from "@/lib/server/core/http";
import { readSession } from "@/lib/server/auth/session";
import {
  insertSystemActivityLog,
  type CrudAction,
} from "@/lib/server/repositories/system-activity-repository";
import type { AuthSession } from "@/lib/server/types";

const NON_RESOURCE_TAIL_SEGMENTS = new Set([
  "add",
  "remove",
  "update",
  "session",
  "logout",
  "request",
  "verify",
  "confirm",
  "upload",
  "stats",
]);

type RouteHandler<TArgs extends unknown[]> = (...args: TArgs) => Promise<Response> | Response;

export interface RouteAuditOptions {
  routePattern?: string;
  operationLabel?: string;
}

function methodToCrudAction(method: string): CrudAction {
  const normalized = method.toUpperCase();

  if (normalized === "POST") return "create";
  if (normalized === "PUT" || normalized === "PATCH") return "update";
  if (normalized === "DELETE") return "delete";
  return "read";
}

function resolveRoutePath(request: Request | null, fallback: string | undefined): string {
  if (request) {
    return new URL(request.url).pathname;
  }

  return fallback ?? "/api/unknown";
}

function resolveResourceName(routePath: string): string {
  const segments = routePath.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "unknown";
  }

  if (segments[0] === "api") {
    if (segments[1] === "admin") {
      return segments[2] ?? "admin";
    }

    return segments[1] ?? "api";
  }

  return segments[0];
}

function resolveResourceId(routePath: string, resourceName: string): string | null {
  const segments = routePath.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const tail = segments[segments.length - 1];
  if (!tail || tail === resourceName || NON_RESOURCE_TAIL_SEGMENTS.has(tail.toLowerCase())) {
    return null;
  }

  return tail;
}

async function safeReadSession(request: Request | null): Promise<AuthSession | null> {
  if (!request) {
    return null;
  }

  try {
    return await readSession(request);
  } catch {
    return null;
  }
}

function actorLabel(session: AuthSession | null): string {
  if (!session) {
    return "Guest";
  }

  return `${session.name} (${session.email})`;
}

function buildMessage(input: {
  session: AuthSession | null;
  crudAction: CrudAction;
  resourceName: string;
  routePath: string;
  isSuccess: boolean;
}): string {
  const outcome = input.isSuccess ? "succeeded" : "failed";
  return `${actorLabel(input.session)} performed ${input.crudAction.toUpperCase()} on ${input.resourceName} via ${input.routePath} and ${outcome}.`;
}

function requestFromArgs(args: unknown[]): Request | null {
  const first = args[0];
  if (first instanceof Request) {
    return first;
  }

  return null;
}

function requestMetadata(request: Request | null, elapsedMs: number, operationLabel?: string): Record<string, unknown> {
  return {
    operationLabel: operationLabel ?? null,
    elapsedMs,
    query: request ? new URL(request.url).search : null,
    ipAddress: request?.headers.get("x-forwarded-for") ?? request?.headers.get("x-real-ip") ?? null,
    userAgent: request?.headers.get("user-agent") ?? null,
  };
}

export function withRouteAudit<TArgs extends unknown[]>(
  handler: RouteHandler<TArgs>,
  options: RouteAuditOptions = {},
): RouteHandler<TArgs> {
  return async (...args: TArgs): Promise<Response> => {
    const startedAt = Date.now();
    const request = requestFromArgs(args);
    const session = await safeReadSession(request);

    let response: Response;
    try {
      response = await handler(...args);
    } catch (error) {
      response = handleRouteError(error);
    }

    const routePath = resolveRoutePath(request, options.routePattern);
    const method = request?.method?.toUpperCase() ?? "GET";
    const crudAction = methodToCrudAction(method);
    const statusCode = response.status;
    const isSuccess = statusCode >= 200 && statusCode < 400;
    const resourceName = resolveResourceName(routePath);
    const resourceId = resolveResourceId(routePath, resourceName);

    try {
      await insertSystemActivityLog({
        actorUserId: session?.userId ?? null,
        actorName: session?.name ?? null,
        actorEmail: session?.email ?? null,
        actorRole: session?.role ?? "guest",
        httpMethod: method,
        crudAction,
        routePath,
        routePattern: options.routePattern ?? routePath,
        resourceName,
        resourceId,
        statusCode,
        isSuccess,
        message: buildMessage({
          session,
          crudAction,
          resourceName,
          routePath,
          isSuccess,
        }),
        metadata: requestMetadata(request, Date.now() - startedAt, options.operationLabel),
      });
    } catch (error) {
      console.error("Failed to write system activity log", error);
    }

    return response;
  };
}
