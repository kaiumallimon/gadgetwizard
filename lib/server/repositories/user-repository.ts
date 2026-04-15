import { execute, queryOne, queryRows } from "@/lib/server/core/db";
import type { AppUser, UserRole } from "@/lib/server/types";

interface UserRow {
  id: number;
  auth_uid: string;
  email: string;
  name: string;
  role: UserRole;
  reward_points: number;
  is_active: number;
  created_at: Date | string;
  updated_at: Date | string;
}

interface UserWithPasswordRow extends UserRow {
  password_hash: string | null;
}

interface UserCountRow {
  total: number;
}

interface ActiveAdminCountRow {
  total: number;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapUser(row: UserRow): AppUser {
  return {
    id: row.id,
    authUid: row.auth_uid,
    email: row.email,
    name: row.name,
    role: row.role,
    rewardPoints: row.reward_points,
    isActive: row.is_active === 1,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function findUserById(userId: number): Promise<AppUser | null> {
  const row = await queryOne<UserRow>(
    `
      SELECT id, auth_uid, email, name, role, reward_points, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [userId],
  );

  return row ? mapUser(row) : null;
}

export async function findUserByAuthUid(authUid: string): Promise<AppUser | null> {
  const row = await queryOne<UserRow>(
    `
      SELECT id, auth_uid, email, name, role, reward_points, is_active, created_at, updated_at
      FROM users
      WHERE auth_uid = ?
      LIMIT 1
    `,
    [authUid],
  );

  return row ? mapUser(row) : null;
}

export async function findUserByEmail(email: string): Promise<AppUser | null> {
  const row = await queryOne<UserRow>(
    `
      SELECT id, auth_uid, email, name, role, reward_points, is_active, created_at, updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [email],
  );

  return row ? mapUser(row) : null;
}

export async function findUserWithPasswordByEmail(email: string): Promise<{ user: AppUser; passwordHash: string | null } | null> {
  const row = await queryOne<UserWithPasswordRow>(
    `
      SELECT id, auth_uid, email, name, role, reward_points, is_active, created_at, updated_at, password_hash
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [email],
  );

  if (!row) {
    return null;
  }

  return {
    user: mapUser(row),
    passwordHash: row.password_hash,
  };
}

export async function createUserWithPassword(input: {
  authUid: string;
  email: string;
  name: string;
  passwordHash: string;
}): Promise<AppUser> {
  await execute(
    `
      INSERT INTO users (auth_uid, email, name, password_hash)
      VALUES (?, ?, ?, ?)
    `,
    [input.authUid, input.email, input.name, input.passwordHash],
  );

  const user = await findUserByAuthUid(input.authUid);
  if (!user) {
    throw new Error("Unable to create user");
  }

  return user;
}

export async function updateUserPasswordHash(userId: number, passwordHash: string): Promise<void> {
  await execute(
    `
      UPDATE users
      SET password_hash = ?, password_updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      LIMIT 1
    `,
    [passwordHash, userId],
  );
}

export async function listUsers(input: {
  page: number;
  pageSize: number;
  search?: string;
  role?: UserRole;
}): Promise<{ items: AppUser[]; total: number }> {
  const whereParts: string[] = [];
  const whereParams: unknown[] = [];

  if (input.search) {
    whereParts.push("(name LIKE ? OR email LIKE ?)");
    const term = `%${input.search}%`;
    whereParams.push(term, term);
  }

  if (input.role) {
    whereParts.push("role = ?");
    whereParams.push(input.role);
  }

  const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
  const offset = (input.page - 1) * input.pageSize;

  const rows = await queryRows<UserRow>(
    `
      SELECT id, auth_uid, email, name, role, reward_points, is_active, created_at, updated_at
      FROM users
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...whereParams, input.pageSize, offset],
  );

  const count = await queryOne<UserCountRow>(
    `
      SELECT COUNT(*) AS total
      FROM users
      ${whereSql}
    `,
    whereParams,
  );

  return {
    items: rows.map(mapUser),
    total: count?.total ?? 0,
  };
}

export async function createAdminUser(input: {
  authUid: string;
  email: string;
  name: string;
  passwordHash: string;
}): Promise<AppUser> {
  await execute(
    `
      INSERT INTO users (auth_uid, email, name, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, 'admin', 1)
    `,
    [input.authUid, input.email, input.name, input.passwordHash],
  );

  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new Error("Unable to create admin user");
  }

  return user;
}

export async function updateUserActiveStatus(userId: number, isActive: boolean): Promise<AppUser | null> {
  await execute(
    `
      UPDATE users
      SET is_active = ?
      WHERE id = ?
      LIMIT 1
    `,
    [isActive ? 1 : 0, userId],
  );

  return findUserById(userId);
}

export async function removeUserById(userId: number): Promise<boolean> {
  const result = await execute(
    `
      DELETE FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [userId],
  );

  return result.affectedRows > 0;
}

export async function countActiveAdmins(): Promise<number> {
  const row = await queryOne<ActiveAdminCountRow>(
    `
      SELECT COUNT(*) AS total
      FROM users
      WHERE role = 'admin' AND is_active = 1
    `,
  );

  return row?.total ?? 0;
}
