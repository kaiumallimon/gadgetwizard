import { execute, queryOne, queryRows } from "@/lib/server/core/db";
import type { BusinessAccount, BusinessAccountStatus } from "@/lib/client/types";

interface BusinessAccountRow {
  id: number;
  user_id: number;
  status: BusinessAccountStatus;
  business_name: string;
  legal_entity_type: string;
  registration_number: string | null;
  tax_id: string | null;
  years_in_operation: number | null;
  website_url: string | null;
  primary_contact_name: string;
  primary_contact_role: string | null;
  primary_contact_email: string;
  primary_contact_phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  monthly_purchase_volume: string | null;
  product_categories: string | null;
  document_urls: string | null;
  additional_notes: string | null;
  review_notes: string | null;
  reviewed_by_user_id: number | null;
  reviewed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  user_name: string | null;
  user_email: string | null;
  reviewed_by_user_name: string | null;
  reviewed_by_user_email: string | null;
}

interface CountRow {
  total: number;
}

interface ExistingBusinessAccountRow {
  id: number;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseJsonArray(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function mapBusinessAccount(row: BusinessAccountRow): BusinessAccount {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    businessName: row.business_name,
    legalEntityType: row.legal_entity_type,
    registrationNumber: row.registration_number,
    taxId: row.tax_id,
    yearsInOperation: row.years_in_operation,
    websiteUrl: row.website_url,
    primaryContactName: row.primary_contact_name,
    primaryContactRole: row.primary_contact_role,
    primaryContactEmail: row.primary_contact_email,
    primaryContactPhone: row.primary_contact_phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    monthlyPurchaseVolume: row.monthly_purchase_volume,
    productCategories: parseJsonArray(row.product_categories),
    documentUrls: parseJsonArray(row.document_urls),
    additionalNotes: row.additional_notes,
    reviewNotes: row.review_notes,
    reviewedByUserId: row.reviewed_by_user_id,
    reviewedAt: row.reviewed_at ? toIso(row.reviewed_at) : null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    userName: row.user_name ?? undefined,
    userEmail: row.user_email ?? undefined,
    reviewedByUserName: row.reviewed_by_user_name,
    reviewedByUserEmail: row.reviewed_by_user_email,
  };
}

function baseSelectSql() {
  return `
    SELECT
      ba.id,
      ba.user_id,
      ba.status,
      ba.business_name,
      ba.legal_entity_type,
      ba.registration_number,
      ba.tax_id,
      ba.years_in_operation,
      ba.website_url,
      ba.primary_contact_name,
      ba.primary_contact_role,
      ba.primary_contact_email,
      ba.primary_contact_phone,
      ba.address_line1,
      ba.address_line2,
      ba.city,
      ba.state,
      ba.postal_code,
      ba.country,
      ba.monthly_purchase_volume,
      ba.product_categories,
      ba.document_urls,
      ba.additional_notes,
      ba.review_notes,
      ba.reviewed_by_user_id,
      ba.reviewed_at,
      ba.created_at,
      ba.updated_at,
      u.name AS user_name,
      u.email AS user_email,
      reviewer.name AS reviewed_by_user_name,
      reviewer.email AS reviewed_by_user_email
    FROM business_accounts ba
    INNER JOIN users u ON u.id = ba.user_id
    LEFT JOIN users reviewer ON reviewer.id = ba.reviewed_by_user_id
  `;
}

export async function getBusinessAccountByUserId(userId: number): Promise<BusinessAccount | null> {
  const row = await queryOne<BusinessAccountRow>(
    `${baseSelectSql()} WHERE ba.user_id = ? LIMIT 1`,
    [userId],
  );

  return row ? mapBusinessAccount(row) : null;
}

export async function getBusinessAccountById(id: number): Promise<BusinessAccount | null> {
  const row = await queryOne<BusinessAccountRow>(
    `${baseSelectSql()} WHERE ba.id = ? LIMIT 1`,
    [id],
  );

  return row ? mapBusinessAccount(row) : null;
}

export async function getApprovedBusinessAccountByUserId(userId: number): Promise<BusinessAccount | null> {
  const row = await queryOne<BusinessAccountRow>(
    `${baseSelectSql()} WHERE ba.user_id = ? AND ba.status = 'approved' LIMIT 1`,
    [userId],
  );

  return row ? mapBusinessAccount(row) : null;
}

export async function upsertBusinessAccountForUser(input: {
  userId: number;
  businessName: string;
  legalEntityType: string;
  registrationNumber: string | null;
  taxId: string | null;
  yearsInOperation: number | null;
  websiteUrl: string | null;
  primaryContactName: string;
  primaryContactRole: string | null;
  primaryContactEmail: string;
  primaryContactPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  monthlyPurchaseVolume: string | null;
  productCategories: string[];
  documentUrls: string[];
  additionalNotes: string | null;
}): Promise<BusinessAccount> {
  const existing = await queryOne<ExistingBusinessAccountRow>(
    `SELECT id FROM business_accounts WHERE user_id = ? LIMIT 1`,
    [input.userId],
  );

  const values = [
    input.businessName,
    input.legalEntityType,
    input.registrationNumber,
    input.taxId,
    input.yearsInOperation,
    input.websiteUrl,
    input.primaryContactName,
    input.primaryContactRole,
    input.primaryContactEmail,
    input.primaryContactPhone,
    input.addressLine1,
    input.addressLine2,
    input.city,
    input.state,
    input.postalCode,
    input.country,
    input.monthlyPurchaseVolume,
    JSON.stringify(input.productCategories),
    JSON.stringify(input.documentUrls),
    input.additionalNotes,
  ];

  if (existing) {
    await execute(
      `
        UPDATE business_accounts
        SET
          status = 'pending',
          business_name = ?,
          legal_entity_type = ?,
          registration_number = ?,
          tax_id = ?,
          years_in_operation = ?,
          website_url = ?,
          primary_contact_name = ?,
          primary_contact_role = ?,
          primary_contact_email = ?,
          primary_contact_phone = ?,
          address_line1 = ?,
          address_line2 = ?,
          city = ?,
          state = ?,
          postal_code = ?,
          country = ?,
          monthly_purchase_volume = ?,
          product_categories = ?,
          document_urls = ?,
          additional_notes = ?,
          review_notes = NULL,
          reviewed_by_user_id = NULL,
          reviewed_at = NULL
        WHERE id = ?
      `,
      [...values, existing.id],
    );

    const updated = await getBusinessAccountById(existing.id);
    if (!updated) {
      throw new Error("Unable to update business account application");
    }

    return updated;
  }

  const result = await execute(
    `
      INSERT INTO business_accounts (
        user_id,
        status,
        business_name,
        legal_entity_type,
        registration_number,
        tax_id,
        years_in_operation,
        website_url,
        primary_contact_name,
        primary_contact_role,
        primary_contact_email,
        primary_contact_phone,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        monthly_purchase_volume,
        product_categories,
        document_urls,
        additional_notes
      )
      VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [input.userId, ...values],
  );

  const created = await getBusinessAccountById(result.insertId);
  if (!created) {
    throw new Error("Unable to create business account application");
  }

  return created;
}

export async function listBusinessAccounts(input: {
  page: number;
  pageSize: number;
  status?: BusinessAccountStatus;
  search?: string;
}): Promise<{ items: BusinessAccount[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (input.status) {
    conditions.push("ba.status = ?");
    params.push(input.status);
  }

  if (input.search) {
    const term = `%${input.search.trim()}%`;
    conditions.push(
      "(ba.business_name LIKE ? OR ba.primary_contact_name LIKE ? OR ba.primary_contact_email LIKE ? OR u.name LIKE ? OR u.email LIKE ?)",
    );
    params.push(term, term, term, term, term);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (input.page - 1) * input.pageSize;

  const count = await queryOne<CountRow>(
    `
      SELECT COUNT(*) AS total
      FROM business_accounts ba
      INNER JOIN users u ON u.id = ba.user_id
      ${whereSql}
    `,
    params,
  );

  const rows = await queryRows<BusinessAccountRow>(
    `
      ${baseSelectSql()}
      ${whereSql}
      ORDER BY ba.created_at DESC, ba.id DESC
      LIMIT ? OFFSET ?
    `,
    [...params, input.pageSize, offset],
  );

  return {
    items: rows.map(mapBusinessAccount),
    total: count?.total ?? 0,
  };
}

export async function updateBusinessAccountReview(input: {
  id: number;
  status: "approved" | "rejected";
  reviewNotes: string | null;
  reviewedByUserId: number;
}): Promise<BusinessAccount | null> {
  await execute(
    `
      UPDATE business_accounts
      SET
        status = ?,
        review_notes = ?,
        reviewed_by_user_id = ?,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [input.status, input.reviewNotes, input.reviewedByUserId, input.id],
  );

  return getBusinessAccountById(input.id);
}
