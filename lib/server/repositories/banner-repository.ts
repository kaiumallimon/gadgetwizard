import { execute, queryOne, queryRows } from "@/lib/server/core/db";

export interface BannerRecord {
  id: number;
  title: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  clickUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BannerRow {
  id: number;
  title: string;
  desktop_image_url: string;
  mobile_image_url: string;
  click_url: string | null;
  sort_order: number;
  is_active: number;
  starts_at: Date | string | null;
  ends_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toNullableIso(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  return toIso(value);
}

function mapBanner(row: BannerRow): BannerRecord {
  return {
    id: row.id,
    title: row.title,
    desktopImageUrl: row.desktop_image_url,
    mobileImageUrl: row.mobile_image_url,
    clickUrl: row.click_url,
    sortOrder: row.sort_order,
    isActive: row.is_active === 1,
    startsAt: toNullableIso(row.starts_at),
    endsAt: toNullableIso(row.ends_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function listPublicBanners(): Promise<BannerRecord[]> {
  const rows = await queryRows<BannerRow>(
    `
      SELECT
        id,
        title,
        desktop_image_url,
        mobile_image_url,
        click_url,
        sort_order,
        is_active,
        starts_at,
        ends_at,
        created_at,
        updated_at
      FROM banners
      WHERE is_active = 1
        AND (starts_at IS NULL OR starts_at <= UTC_TIMESTAMP())
        AND (ends_at IS NULL OR ends_at >= UTC_TIMESTAMP())
      ORDER BY sort_order ASC, created_at DESC
    `,
  );

  return rows.map(mapBanner);
}

export async function listAdminBanners(): Promise<BannerRecord[]> {
  const rows = await queryRows<BannerRow>(
    `
      SELECT
        id,
        title,
        desktop_image_url,
        mobile_image_url,
        click_url,
        sort_order,
        is_active,
        starts_at,
        ends_at,
        created_at,
        updated_at
      FROM banners
      ORDER BY sort_order ASC, created_at DESC
    `,
  );

  return rows.map(mapBanner);
}

export async function findBannerById(id: number): Promise<BannerRecord | null> {
  const row = await queryOne<BannerRow>(
    `
      SELECT
        id,
        title,
        desktop_image_url,
        mobile_image_url,
        click_url,
        sort_order,
        is_active,
        starts_at,
        ends_at,
        created_at,
        updated_at
      FROM banners
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return row ? mapBanner(row) : null;
}

export async function createBanner(input: {
  title: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  clickUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}): Promise<BannerRecord> {
  const result = await execute(
    `
      INSERT INTO banners
      (title, desktop_image_url, mobile_image_url, click_url, sort_order, is_active, starts_at, ends_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.title,
      input.desktopImageUrl,
      input.mobileImageUrl,
      input.clickUrl,
      input.sortOrder,
      input.isActive ? 1 : 0,
      input.startsAt,
      input.endsAt,
    ],
  );

  const created = await findBannerById(result.insertId);
  if (!created) {
    throw new Error("Unable to create banner");
  }

  return created;
}

export async function updateBanner(
  id: number,
  input: {
    title: string;
    desktopImageUrl: string;
    mobileImageUrl: string;
    clickUrl: string | null;
    sortOrder: number;
    isActive: boolean;
    startsAt: string | null;
    endsAt: string | null;
  },
): Promise<BannerRecord | null> {
  await execute(
    `
      UPDATE banners
      SET
        title = ?,
        desktop_image_url = ?,
        mobile_image_url = ?,
        click_url = ?,
        sort_order = ?,
        is_active = ?,
        starts_at = ?,
        ends_at = ?
      WHERE id = ?
    `,
    [
      input.title,
      input.desktopImageUrl,
      input.mobileImageUrl,
      input.clickUrl,
      input.sortOrder,
      input.isActive ? 1 : 0,
      input.startsAt,
      input.endsAt,
      id,
    ],
  );

  return findBannerById(id);
}

export async function deleteBanner(id: number): Promise<void> {
  await execute("DELETE FROM banners WHERE id = ?", [id]);
}
