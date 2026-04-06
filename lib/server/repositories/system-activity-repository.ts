import { execute, queryOne, queryRows } from "@/lib/server/core/db";

export type CrudAction = "create" | "read" | "update" | "delete";

interface CountRow {
  total: number;
}

interface ActionCountRow {
  crud_action: CrudAction;
  total: number;
}

interface SystemActivityLogRow {
  id: number;
  actor_user_id: number | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: "admin" | "user" | "guest";
  http_method: string;
  crud_action: CrudAction;
  route_path: string;
  route_pattern: string | null;
  resource_name: string;
  resource_id: string | null;
  status_code: number;
  is_success: number;
  message: string;
  metadata: string | Record<string, unknown> | null;
  created_at: Date | string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseMetadata(value: string | Record<string, unknown> | null): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }

    return null;
  }

  return value;
}

export interface SystemActivityLogItem {
  id: number;
  actorUserId: number | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: "admin" | "user" | "guest";
  httpMethod: string;
  crudAction: CrudAction;
  routePath: string;
  routePattern: string | null;
  resourceName: string;
  resourceId: string | null;
  statusCode: number;
  isSuccess: boolean;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface SystemActivitySummary {
  total: number;
  successful: number;
  failed: number;
  actionCounts: Array<{ action: CrudAction; total: number }>;
}

export async function insertSystemActivityLog(input: {
  actorUserId: number | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: "admin" | "user" | "guest";
  httpMethod: string;
  crudAction: CrudAction;
  routePath: string;
  routePattern: string | null;
  resourceName: string;
  resourceId: string | null;
  statusCode: number;
  isSuccess: boolean;
  message: string;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  await execute(
    `
      INSERT INTO system_activity_logs
        (
          actor_user_id,
          actor_name,
          actor_email,
          actor_role,
          http_method,
          crud_action,
          route_path,
          route_pattern,
          resource_name,
          resource_id,
          status_code,
          is_success,
          message,
          metadata
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.actorUserId,
      input.actorName,
      input.actorEmail,
      input.actorRole,
      input.httpMethod,
      input.crudAction,
      input.routePath,
      input.routePattern,
      input.resourceName,
      input.resourceId,
      input.statusCode,
      input.isSuccess ? 1 : 0,
      input.message,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ],
  );
}

export async function getSystemActivitySummary(): Promise<SystemActivitySummary> {
  const totalRow = await queryOne<CountRow>("SELECT COUNT(*) AS total FROM system_activity_logs");
  const successRow = await queryOne<CountRow>(
    "SELECT COUNT(*) AS total FROM system_activity_logs WHERE is_success = 1",
  );

  const actionCounts = await queryRows<ActionCountRow>(
    `
      SELECT crud_action, COUNT(*) AS total
      FROM system_activity_logs
      GROUP BY crud_action
      ORDER BY FIELD(crud_action, 'create', 'read', 'update', 'delete')
    `,
  );

  const total = totalRow?.total ?? 0;
  const successful = successRow?.total ?? 0;

  return {
    total,
    successful,
    failed: Math.max(0, total - successful),
    actionCounts: actionCounts.map((row) => ({ action: row.crud_action, total: row.total })),
  };
}

export async function getSystemActivityPage(input: {
  page: number;
  pageSize: number;
  action?: CrudAction;
}) {
  const page = Number.isFinite(input.page) ? Math.max(1, Math.floor(input.page)) : 1;
  const pageSize = Number.isFinite(input.pageSize)
    ? Math.min(100, Math.max(5, Math.floor(input.pageSize)))
    : 20;
  const offset = (page - 1) * pageSize;

  const filters: string[] = [];
  const params: unknown[] = [];

  if (input.action) {
    filters.push("crud_action = ?");
    params.push(input.action);
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  const count = await queryOne<CountRow>(
    `
      SELECT COUNT(*) AS total
      FROM system_activity_logs
      ${whereClause}
    `,
    params,
  );

  const total = count?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const rows = await queryRows<SystemActivityLogRow>(
    `
      SELECT
        id,
        actor_user_id,
        actor_name,
        actor_email,
        actor_role,
        http_method,
        crud_action,
        route_path,
        route_pattern,
        resource_name,
        resource_id,
        status_code,
        is_success,
        message,
        metadata,
        created_at
      FROM system_activity_logs
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `,
    [...params, pageSize, offset],
  );

  const items: SystemActivityLogItem[] = rows.map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    httpMethod: row.http_method,
    crudAction: row.crud_action,
    routePath: row.route_path,
    routePattern: row.route_pattern,
    resourceName: row.resource_name,
    resourceId: row.resource_id,
    statusCode: row.status_code,
    isSuccess: row.is_success === 1,
    message: row.message,
    metadata: parseMetadata(row.metadata),
    createdAt: toIso(row.created_at),
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}
