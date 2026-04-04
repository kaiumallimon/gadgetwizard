import {
  addToCartItem,
  findCartItem,
  getCartByUserId,
  insertCartActivity,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/server/repositories/cart-repository";
import { findProductById } from "@/lib/server/repositories/product-repository";
import { findUserById } from "@/lib/server/repositories/user-repository";
import { badRequest, notFound } from "@/lib/server/core/errors";

const REWARD_POINTS_DISCOUNT_THRESHOLD = 100;

function getAppliedDiscountPrice(input: {
  userRewardPoints: number;
  discountedPrice: number | null;
}): number | null {
  if (input.userRewardPoints < REWARD_POINTS_DISCOUNT_THRESHOLD) {
    return null;
  }

  return input.discountedPrice;
}

export async function getCartForUser(userId: number) {
  const cart = await getCartByUserId(userId);
  return cart;
}

export async function addToCartForUser(input: {
  userId: number;
  productId: number;
  quantity: number;
}) {
  if (input.quantity <= 0) {
    throw badRequest("Quantity must be greater than zero");
  }

  const user = await findUserById(input.userId);
  if (!user) {
    throw notFound("User not found");
  }

  const product = await findProductById(input.productId, true);
  if (!product) {
    throw notFound("Product not found");
  }

  const cart = await getCartByUserId(input.userId);
  const existing = await findCartItem(cart.id, input.productId);
  const quantityBefore = existing?.quantity ?? 0;
  const quantityAfter = quantityBefore + input.quantity;

  if (quantityAfter > product.stock) {
    throw badRequest("Requested quantity exceeds stock");
  }

  const appliedDiscountedPrice = getAppliedDiscountPrice({
    userRewardPoints: user.rewardPoints,
    discountedPrice: product.discountedPrice,
  });

  await addToCartItem({
    cartId: cart.id,
    productId: input.productId,
    quantity: input.quantity,
    unitPrice: product.price,
    appliedDiscountedPrice,
  });

  await insertCartActivity({
    userId: input.userId,
    cartId: cart.id,
    productId: input.productId,
    action: "add",
    quantityBefore,
    quantityAfter,
  });

  return getCartByUserId(input.userId);
}

export async function updateCartForUser(input: {
  userId: number;
  productId: number;
  quantity: number;
}) {
  if (input.quantity <= 0) {
    throw badRequest("Quantity must be greater than zero");
  }

  const product = await findProductById(input.productId, true);
  if (!product) {
    throw notFound("Product not found");
  }

  if (input.quantity > product.stock) {
    throw badRequest("Requested quantity exceeds stock");
  }

  const cart = await getCartByUserId(input.userId);
  const existing = await findCartItem(cart.id, input.productId);
  if (!existing) {
    throw notFound("Cart item not found");
  }

  await updateCartItemQuantity(existing.id, input.quantity);

  await insertCartActivity({
    userId: input.userId,
    cartId: cart.id,
    productId: input.productId,
    action: "update",
    quantityBefore: existing.quantity,
    quantityAfter: input.quantity,
  });

  return getCartByUserId(input.userId);
}

export async function removeFromCartForUser(input: { userId: number; productId: number }) {
  const cart = await getCartByUserId(input.userId);
  const existing = await findCartItem(cart.id, input.productId);
  if (!existing) {
    throw notFound("Cart item not found");
  }

  await removeCartItem(existing.id);

  await insertCartActivity({
    userId: input.userId,
    cartId: cart.id,
    productId: input.productId,
    action: "remove",
    quantityBefore: existing.quantity,
    quantityAfter: 0,
  });

  return getCartByUserId(input.userId);
}
