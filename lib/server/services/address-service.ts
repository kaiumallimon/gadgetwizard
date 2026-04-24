import { notFound } from "@/lib/server/core/errors";
import type { UserAddress } from "@/lib/client/types";
import {
  getAddressesByUserId,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  type AddressRecord,
} from "@/lib/server/repositories/address-repository";

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapAddress(row: AddressRecord): UserAddress {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    fullName: row.full_name,
    phone: row.phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    isDefault: Boolean(row.is_default),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function getUserAddresses(userId: number): Promise<UserAddress[]> {
  const rows = await getAddressesByUserId(userId);
  return rows.map(mapAddress);
}

export async function createUserAddress(
  userId: number,
  input: {
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
  },
): Promise<UserAddress> {
  const row = await createAddress({ userId, ...input });
  return mapAddress(row);
}

export async function updateUserAddress(
  userId: number,
  addressId: number,
  input: {
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
  },
): Promise<UserAddress> {
  const existing = await getAddressById(addressId);
  if (!existing || existing.user_id !== userId) {
    throw notFound("Address not found");
  }

  const row = await updateAddress(addressId, userId, input);
  if (!row) throw new Error("Failed to update address");
  return mapAddress(row);
}

export async function deleteUserAddress(userId: number, addressId: number): Promise<void> {
  const existing = await getAddressById(addressId);
  if (!existing || existing.user_id !== userId) {
    throw notFound("Address not found");
  }
  await deleteAddress(addressId, userId);
}
