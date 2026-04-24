import { execute, queryOne, queryRows } from "@/lib/server/core/db";

export interface AddressRecord {
  id: number;
  user_id: number;
  label: string | null;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: number; // 0 | 1
  created_at: Date;
  updated_at: Date;
}

export interface CreateAddressInput {
  userId: number;
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export async function getAddressesByUserId(userId: number): Promise<AddressRecord[]> {
  return queryRows<AddressRecord>(
    `SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
    [userId],
  );
}

export async function getAddressById(id: number): Promise<AddressRecord | null> {
  return queryOne<AddressRecord>(
    `SELECT * FROM user_addresses WHERE id = ?`,
    [id],
  );
}

export async function createAddress(input: CreateAddressInput): Promise<AddressRecord> {
  // If this address should be default, clear existing defaults first
  if (input.isDefault) {
    await execute(
      `UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`,
      [input.userId],
    );
  }

  const result = await execute(
    `INSERT INTO user_addresses
      (user_id, label, full_name, phone, address_line1, address_line2,
       city, state, postal_code, country, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.label ?? null,
      input.fullName,
      input.phone,
      input.addressLine1,
      input.addressLine2 ?? null,
      input.city,
      input.state ?? null,
      input.postalCode ?? null,
      input.country ?? "Bangladesh",
      input.isDefault ? 1 : 0,
    ],
  );

  const addr = await getAddressById(result.insertId);
  if (!addr) throw new Error("Failed to retrieve created address");
  return addr;
}

export async function updateAddress(
  id: number,
  userId: number,
  input: UpdateAddressInput,
): Promise<AddressRecord | null> {
  // If marking as default, clear others first
  if (input.isDefault) {
    await execute(
      `UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`,
      [userId],
    );
  }

  await execute(
    `UPDATE user_addresses
     SET label = ?, full_name = ?, phone = ?, address_line1 = ?,
         address_line2 = ?, city = ?, state = ?, postal_code = ?,
         country = ?, is_default = ?, updated_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [
      input.label ?? null,
      input.fullName,
      input.phone,
      input.addressLine1,
      input.addressLine2 ?? null,
      input.city,
      input.state ?? null,
      input.postalCode ?? null,
      input.country ?? "Bangladesh",
      input.isDefault ? 1 : 0,
      id,
      userId,
    ],
  );

  return getAddressById(id);
}

export async function deleteAddress(id: number, userId: number): Promise<void> {
  await execute(
    `DELETE FROM user_addresses WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
}
