import { execute, queryOne } from "@/lib/server/core/db";
import type { AppUser, UserRole } from "@/lib/server/types";

interface UserRow {
  id: number;
  firebase_uid: string;
  email: string;
  name: string;
  role: UserRole;
  reward_points: number;
  is_active: number;
  created_at: Date | string;
  updated_at: Date | string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapUser(row: UserRow): AppUser {
  return {
    id: row.id,
    firebaseUid: row.firebase_uid,
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
      SELECT id, firebase_uid, email, name, role, reward_points, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [userId],
  );

  return row ? mapUser(row) : null;
}

export async function findUserByFirebaseUid(firebaseUid: string): Promise<AppUser | null> {
  const row = await queryOne<UserRow>(
    `
      SELECT id, firebase_uid, email, name, role, reward_points, is_active, created_at, updated_at
      FROM users
      WHERE firebase_uid = ?
      LIMIT 1
    `,
    [firebaseUid],
  );

  return row ? mapUser(row) : null;
}

export async function upsertUserFromFirebase(input: {
  firebaseUid: string;
  email: string;
  name: string;
}): Promise<AppUser> {
  await execute(
    `
      INSERT INTO users (firebase_uid, email, name)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        name = VALUES(name),
        is_active = 1
    `,
    [input.firebaseUid, input.email, input.name],
  );

  const user = await findUserByFirebaseUid(input.firebaseUid);
  if (!user) {
    throw new Error("Unable to upsert user");
  }

  return user;
}
