import { execute, queryOne, queryRows } from "@/lib/server/core/db";

export interface CartItemRecord {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  productImages: string[];
  stock: number;
  productStockSnapshot: number;
  productWholesalePrice: number | null;
  productWholesaleMinQuantity: number | null;
  quantity: number;
  unitPrice: number;
  appliedDiscountedPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CartRecord {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  items: CartItemRecord[];
}

interface CartRow {
  id: number;
  user_id: number;
  created_at: Date | string;
  updated_at: Date | string;
}

interface CartItemRow {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_images: string;
  stock: number;
  product_stock_snapshot: number;
  wholesale_price: string | number | null;
  wholesale_min_quantity: number | null;
  quantity: number;
  unit_price: string | number;
  applied_discounted_price: string | number | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface ExistingCartItemRow {
  id: number;
  quantity: number;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapCartItem(row: CartItemRow): CartItemRecord {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    productImages: JSON.parse(row.product_images) as string[],
    stock: row.stock,
    productStockSnapshot: row.product_stock_snapshot,
    productWholesalePrice: row.wholesale_price === null ? null : Number(row.wholesale_price),
    productWholesaleMinQuantity: row.wholesale_min_quantity,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    appliedDiscountedPrice: row.applied_discounted_price === null ? null : Number(row.applied_discounted_price),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function findCartByUserId(userId: number): Promise<CartRow | null> {
  return queryOne<CartRow>(
    `
      SELECT id, user_id, created_at, updated_at
      FROM carts
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId],
  );
}

export async function ensureCartForUser(userId: number): Promise<CartRow> {
  const existing = await findCartByUserId(userId);
  if (existing) {
    return existing;
  }

  const result = await execute("INSERT INTO carts (user_id) VALUES (?)", [userId]);
  const created = await queryOne<CartRow>(
    `
      SELECT id, user_id, created_at, updated_at
      FROM carts
      WHERE id = ?
      LIMIT 1
    `,
    [result.insertId],
  );

  if (!created) {
    throw new Error("Unable to create cart");
  }

  return created;
}

export async function getCartByUserId(userId: number): Promise<CartRecord> {
  const cart = await ensureCartForUser(userId);

  const itemRows = await queryRows<CartItemRow>(
    `
      SELECT
        ci.id,
        ci.product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        p.images AS product_images,
        p.stock,
        ci.product_stock_snapshot,
        p.wholesale_price,
        p.wholesale_min_quantity,
        ci.quantity,
        ci.unit_price,
        ci.applied_discounted_price,
        ci.created_at,
        ci.updated_at
      FROM cart_items ci
      INNER JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at DESC
    `,
    [cart.id],
  );

  return {
    id: cart.id,
    userId: cart.user_id,
    createdAt: toIso(cart.created_at),
    updatedAt: toIso(cart.updated_at),
    items: itemRows.map(mapCartItem),
  };
}

export async function findCartItem(cartId: number, productId: number): Promise<ExistingCartItemRow | null> {
  return queryOne<ExistingCartItemRow>(
    `
      SELECT id, quantity
      FROM cart_items
      WHERE cart_id = ? AND product_id = ?
      LIMIT 1
    `,
    [cartId, productId],
  );
}

export async function addToCartItem(input: {
  cartId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  appliedDiscountedPrice: number | null;
  productStockSnapshot: number;
}): Promise<void> {
  await execute(
    `
      INSERT INTO cart_items (
        cart_id,
        product_id,
        quantity,
        unit_price,
        applied_discounted_price,
        product_stock_snapshot
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        quantity = quantity + VALUES(quantity),
        unit_price = VALUES(unit_price),
        applied_discounted_price = VALUES(applied_discounted_price),
        product_stock_snapshot = VALUES(product_stock_snapshot)
    `,
    [
      input.cartId,
      input.productId,
      input.quantity,
      input.unitPrice,
      input.appliedDiscountedPrice,
      input.productStockSnapshot,
    ],
  );
}

export async function updateCartItemQuantity(
  cartItemId: number,
  quantity: number,
  productStockSnapshot: number,
): Promise<void> {
  await execute(
    "UPDATE cart_items SET quantity = ?, product_stock_snapshot = ? WHERE id = ?",
    [quantity, productStockSnapshot, cartItemId],
  );
}

export async function clearCartItemsByCartId(cartId: number): Promise<void> {
  await execute("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
}

export async function removeCartItem(cartItemId: number): Promise<void> {
  await execute("DELETE FROM cart_items WHERE id = ?", [cartItemId]);
}

export async function insertCartActivity(input: {
  userId: number;
  cartId: number;
  productId: number;
  action: "add" | "update" | "remove";
  quantityBefore: number | null;
  quantityAfter: number | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await execute(
    `
      INSERT INTO cart_activity_logs
        (user_id, cart_id, product_id, action, quantity_before, quantity_after, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.userId,
      input.cartId,
      input.productId,
      input.action,
      input.quantityBefore,
      input.quantityAfter,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ],
  );
}
