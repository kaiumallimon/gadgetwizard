import { execute, queryOne, queryRows } from "@/lib/server/core/db";

export interface NewsletterSubscriberRecord {
  id: number;
  email: string;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NewsletterSubscriberRow {
  id: number;
  email: string;
  is_active: number;
  subscribed_at: Date | string;
  unsubscribed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface TotalRow {
  total: number;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toOptionalIso(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  return toIso(value);
}

function mapSubscriber(row: NewsletterSubscriberRow): NewsletterSubscriberRecord {
  return {
    id: row.id,
    email: row.email,
    isActive: row.is_active === 1,
    subscribedAt: toIso(row.subscribed_at),
    unsubscribedAt: toOptionalIso(row.unsubscribed_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function findNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriberRecord | null> {
  const row = await queryOne<NewsletterSubscriberRow>(
    `
      SELECT id, email, is_active, subscribed_at, unsubscribed_at, created_at, updated_at
      FROM newsletter_subscribers
      WHERE email = ?
      LIMIT 1
    `,
    [email],
  );

  return row ? mapSubscriber(row) : null;
}

export async function upsertNewsletterSubscriber(email: string): Promise<NewsletterSubscriberRecord> {
  await execute(
    `
      INSERT INTO newsletter_subscribers (email, is_active, subscribed_at)
      VALUES (?, 1, NOW())
      ON DUPLICATE KEY UPDATE
        is_active = 1,
        subscribed_at = NOW(),
        unsubscribed_at = NULL,
        updated_at = NOW()
    `,
    [email],
  );

  const subscriber = await findNewsletterSubscriberByEmail(email);
  if (!subscriber) {
    throw new Error("Unable to subscribe email");
  }

  return subscriber;
}

export async function listActiveNewsletterSubscribers(): Promise<NewsletterSubscriberRecord[]> {
  const rows = await queryRows<NewsletterSubscriberRow>(
    `
      SELECT id, email, is_active, subscribed_at, unsubscribed_at, created_at, updated_at
      FROM newsletter_subscribers
      WHERE is_active = 1
      ORDER BY subscribed_at DESC, id DESC
    `,
  );

  return rows.map(mapSubscriber);
}

export async function countActiveNewsletterSubscribers(): Promise<number> {
  const row = await queryOne<TotalRow>(
    `
      SELECT COUNT(*) AS total
      FROM newsletter_subscribers
      WHERE is_active = 1
    `,
  );

  return row?.total ?? 0;
}
