import { badRequest, notFound } from "@/lib/server/core/errors";
import { findUserById } from "@/lib/server/repositories/user-repository";
import { findProductById } from "@/lib/server/repositories/product-repository";
import {
  addWishlistItem,
  isWishlisted,
  listAdminWishlistEntries,
  listWishlistProductIdsByUser,
  removeWishlistItem,
} from "@/lib/server/repositories/wishlist-repository";

export async function getWishlistForUser(userId: number) {
  const user = await findUserById(userId);
  if (!user) {
    throw notFound("User not found");
  }

  const productRows = await listWishlistProductIdsByUser(userId);
  const products = await Promise.all(
    productRows.map(async (row) => {
      const product = await findProductById(row.productId, true);
      return product;
    }),
  );

  const items = products.filter((product) => product !== null);
  return {
    items,
    productIds: items.map((item) => item.id),
  };
}

export async function addToWishlistForUser(input: { userId: number; productId: number }) {
  const user = await findUserById(input.userId);
  if (!user) {
    throw notFound("User not found");
  }

  const product = await findProductById(input.productId, true);
  if (!product) {
    throw notFound("Product not found");
  }

  await addWishlistItem(input.userId, input.productId);
  return getWishlistForUser(input.userId);
}

export async function removeFromWishlistForUser(input: { userId: number; productId: number }) {
  if (input.productId <= 0) {
    throw badRequest("Invalid product id");
  }

  await removeWishlistItem(input.userId, input.productId);
  return getWishlistForUser(input.userId);
}

export async function isProductWishlistedByUser(input: { userId: number; productId: number }) {
  return isWishlisted(input.userId, input.productId);
}

export async function getAdminWishlist(input: { page: number; pageSize: number; search?: string }) {
  return listAdminWishlistEntries(input);
}
