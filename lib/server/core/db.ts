import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

import { getEnv } from "@/lib/server/core/env";

type DbError = {
  code?: string;
  errno?: number;
};

declare global {
  var __gadgetwizardPool: Pool | undefined;
}

const MAX_QUERY_RETRIES = 3;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableConnectionError(error: unknown): boolean {
  const dbError = error as DbError;
  const code = dbError?.code;

  return (
    code === "ER_CON_COUNT_ERROR" ||
    code === "ER_USER_LIMIT_REACHED" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT"
  );
}

async function withDbRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_QUERY_RETRIES; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableConnectionError(error) || attempt === MAX_QUERY_RETRIES - 1) {
        throw error;
      }

      await wait(150 * (attempt + 1));
    }
  }

  throw lastError;
}

function getPool(): Pool {
  if (globalThis.__gadgetwizardPool) {
    return globalThis.__gadgetwizardPool;
  }

  const env = getEnv();
  globalThis.__gadgetwizardPool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: env.DB_POOL_LIMIT,
    queueLimit: 0,
    namedPlaceholders: false,
    charset: "utf8mb4",
  });

  return globalThis.__gadgetwizardPool;
}

export async function queryRows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return withDbRetry(async () => {
    const conn = getPool();
    const [rows] = await conn.query<RowDataPacket[]>(sql, params);
    return rows as T[];
  });
}

export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await queryRows<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  return withDbRetry(async () => {
    const conn = getPool();
    const [result] = await conn.query<ResultSetHeader>(sql, params);
    return result;
  });
}
