import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

import { getEnv } from "@/lib/server/core/env";

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const env = getEnv();
  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: env.DB_POOL_LIMIT,
    namedPlaceholders: false,
    charset: "utf8mb4",
  });

  return pool;
}

export async function queryRows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const conn = getPool();
  const [rows] = await conn.query<RowDataPacket[]>(sql, params);
  return rows as T[];
}

export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await queryRows<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const conn = getPool();
  const [result] = await conn.execute<ResultSetHeader>(sql, params);
  return result;
}
