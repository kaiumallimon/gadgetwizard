import { execute, queryOne, queryRows } from "@/lib/server/core/db";

export interface FaqRecord {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FaqRow {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
  is_active: number;
  created_at: Date | string;
  updated_at: Date | string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapFaq(row: FaqRow): FaqRecord {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sort_order,
    isActive: row.is_active === 1,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function listPublicFaqs(): Promise<FaqRecord[]> {
  const rows = await queryRows<FaqRow>(
    `
      SELECT id, question, answer, sort_order, is_active, created_at, updated_at
      FROM faqs
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC
    `,
  );

  return rows.map(mapFaq);
}

export async function listAdminFaqs(): Promise<FaqRecord[]> {
  const rows = await queryRows<FaqRow>(
    `
      SELECT id, question, answer, sort_order, is_active, created_at, updated_at
      FROM faqs
      ORDER BY sort_order ASC, id ASC
    `,
  );

  return rows.map(mapFaq);
}

export async function findFaqById(id: number): Promise<FaqRecord | null> {
  const row = await queryOne<FaqRow>(
    `
      SELECT id, question, answer, sort_order, is_active, created_at, updated_at
      FROM faqs
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return row ? mapFaq(row) : null;
}

export async function createFaq(input: {
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<FaqRecord> {
  const result = await execute(
    `
      INSERT INTO faqs (question, answer, sort_order, is_active)
      VALUES (?, ?, ?, ?)
    `,
    [
      input.question,
      input.answer,
      input.sortOrder,
      input.isActive ? 1 : 0,
    ],
  );

  const created = await findFaqById(result.insertId);
  if (!created) {
    throw new Error("Unable to create FAQ");
  }

  return created;
}

export async function updateFaq(
  id: number,
  input: {
    question: string;
    answer: string;
    sortOrder: number;
    isActive: boolean;
  },
): Promise<FaqRecord | null> {
  await execute(
    `
      UPDATE faqs
      SET question = ?, answer = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `,
    [
      input.question,
      input.answer,
      input.sortOrder,
      input.isActive ? 1 : 0,
      id,
    ],
  );

  return findFaqById(id);
}

export async function deleteFaq(id: number): Promise<void> {
  await execute("DELETE FROM faqs WHERE id = ?", [id]);
}
