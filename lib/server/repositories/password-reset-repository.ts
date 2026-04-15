import { execute, queryOne } from "@/lib/server/core/db";

interface PasswordResetTokenRow {
  id: number;
  user_id: number;
  email: string;
  jti_hash: string;
  expires_at: Date | string;
  used_at: Date | string | null;
  created_at: Date | string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export interface PasswordResetTokenRecord {
  id: number;
  userId: number;
  email: string;
  jtiHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

function mapPasswordResetToken(row: PasswordResetTokenRow): PasswordResetTokenRecord {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    jtiHash: row.jti_hash,
    expiresAt: toIso(row.expires_at),
    usedAt: row.used_at ? toIso(row.used_at) : null,
    createdAt: toIso(row.created_at),
  };
}

export async function createPasswordResetTokenRecord(input: {
  userId: number;
  email: string;
  jtiHash: string;
  expiresAt: Date;
}): Promise<void> {
  await execute(
    `
      INSERT INTO password_reset_tokens (user_id, email, jti_hash, expires_at)
      VALUES (?, ?, ?, ?)
    `,
    [input.userId, input.email, input.jtiHash, input.expiresAt],
  );
}

export async function invalidatePasswordResetTokensForUser(userId: number): Promise<void> {
  await execute(
    `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE user_id = ? AND used_at IS NULL
    `,
    [userId],
  );
}

export async function findValidPasswordResetTokenByHash(jtiHash: string): Promise<PasswordResetTokenRecord | null> {
  const row = await queryOne<PasswordResetTokenRow>(
    `
      SELECT id, user_id, email, jti_hash, expires_at, used_at, created_at
      FROM password_reset_tokens
      WHERE jti_hash = ?
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `,
    [jtiHash],
  );

  return row ? mapPasswordResetToken(row) : null;
}

export async function markPasswordResetTokenUsed(tokenId: number): Promise<void> {
  await execute(
    `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE id = ? AND used_at IS NULL
      LIMIT 1
    `,
    [tokenId],
  );
}
