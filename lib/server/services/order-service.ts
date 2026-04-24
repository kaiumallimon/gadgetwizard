import Stripe from "stripe";

import { getEnv } from "@/lib/server/core/env";
import { badRequest, notFound } from "@/lib/server/core/errors";
import type { AddressSnapshot, Order, OrderItem, OrderStatus } from "@/lib/client/types";
import {
  createOrder as createOrderRepo,
  getOrderById,
  getOrdersByUserId,
  listOrdersByUserId,
  getOrderItemsByOrderId,
  listOrders,
  updateOrderStatus,
  findOrderByPaymentIntent,
  type OrderItemRecord,
  type OrderRecord,
  type ListOrdersFilter,
} from "@/lib/server/repositories/order-repository";
import {
  getAddressById,
  createAddress,
  type CreateAddressInput,
} from "@/lib/server/repositories/address-repository";
import {
  getOrderPaymentByOrderIdForUser,
  upsertOrderPayment,
  type OrderPaymentRecord,
} from "@/lib/server/repositories/order-payment-repository";
import { getCartByUserId } from "@/lib/server/repositories/cart-repository";
import { execute } from "@/lib/server/core/db";

function getStripe(): Stripe {
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY) {
    throw badRequest("Payment processing is not configured on this server.");
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
}

export interface CheckoutAddressInput {
  addressId?: number;
  newAddress?: {
    label?: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country?: string;
    saveAddress?: boolean;
  };
}

async function resolveShippingAddress(
  userId: number,
  input: CheckoutAddressInput,
): Promise<{ snapshot: AddressSnapshot; savedAddressId?: number }> {
  if (input.addressId) {
    const addr = await getAddressById(input.addressId);
    if (!addr || addr.user_id !== userId) {
      throw notFound("Address not found");
    }
    return {
      snapshot: {
        fullName: addr.full_name,
        phone: addr.phone,
        addressLine1: addr.address_line1,
        addressLine2: addr.address_line2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postal_code,
        country: addr.country,
        label: addr.label,
      },
    };
  }

  if (input.newAddress) {
    const na = input.newAddress;
    const snapshot: AddressSnapshot = {
      fullName: na.fullName,
      phone: na.phone,
      addressLine1: na.addressLine1,
      addressLine2: na.addressLine2 ?? null,
      city: na.city,
      state: na.state ?? null,
      postalCode: na.postalCode ?? null,
      country: na.country ?? "Bangladesh",
      label: na.label ?? null,
    };

    let savedAddressId: number | undefined;
    if (na.saveAddress) {
      const created = await createAddress({
        userId,
        label: na.label,
        fullName: na.fullName,
        phone: na.phone,
        addressLine1: na.addressLine1,
        addressLine2: na.addressLine2,
        city: na.city,
        state: na.state,
        postalCode: na.postalCode,
        country: na.country,
        isDefault: false,
      } satisfies CreateAddressInput);
      savedAddressId = created.id;
    }

    return { snapshot, savedAddressId };
  }

  throw badRequest("A shipping address is required to proceed.");
}

export async function createPaymentIntent(
  userId: number,
  _addressInput?: CheckoutAddressInput,
): Promise<{ clientSecret: string; paymentIntentId: string; amount: number }> {
  const stripe = getStripe();
  const cart = await getCartByUserId(userId);

  if (!cart || cart.items.length === 0) {
    throw badRequest("Your cart is empty.");
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.appliedDiscountedPrice ?? item.unitPrice;
    return sum + price * item.quantity;
  }, 0);

  const totalAmount = subtotal; // No shipping fee for now
  const amountInCents = Math.round(totalAmount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { userId: String(userId) },
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Failed to create payment intent");
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: totalAmount,
  };
}

export interface CreateOrderInput {
  userId: number;
  paymentIntentId: string;
  addressInput: CheckoutAddressInput;
}

export interface OrderPayment {
  orderId: number;
  userId: number;
  provider: "stripe";
  providerPaymentId: string;
  currency: string;
  amount: number;
  amountReceived: number;
  status: string;
  paymentMethodTypes: string[];
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function centsToAmount(value: number | null | undefined): number {
  return Number(((value ?? 0) / 100).toFixed(2));
}

export async function createOrderAfterPayment(input: CreateOrderInput): Promise<Order> {
  const stripe = getStripe();

  // Verify payment with Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(input.paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    throw badRequest(`Payment not completed. Status: ${paymentIntent.status}`);
  }

  // Check if order already exists for this payment intent (idempotency)
  const existing = await findOrderByPaymentIntent(input.paymentIntentId);
  if (existing) {
    await upsertOrderPayment({
      orderId: Number(existing.id),
      userId: Number(existing.user_id),
      provider: "stripe",
      providerPaymentId: paymentIntent.id,
      currency: paymentIntent.currency,
      amount: centsToAmount(paymentIntent.amount),
      amountReceived: centsToAmount(paymentIntent.amount_received),
      status: paymentIntent.status,
      paymentMethodTypes: paymentIntent.payment_method_types,
      paidAt: new Date(),
    });

    return mapOrderRecord(existing, await getOrderItemsByOrderId(existing.id));
  }

  const cart = await getCartByUserId(input.userId);
  if (!cart || cart.items.length === 0) {
    throw badRequest("Cart is empty — cannot create order.");
  }

  const { snapshot } = await resolveShippingAddress(input.userId, input.addressInput);

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.appliedDiscountedPrice ?? item.unitPrice;
    return sum + price * item.quantity;
  }, 0);

  const order = await createOrderRepo({
    userId: input.userId,
    totalAmount: subtotal,
    subtotal,
    shippingAmount: 0,
    stripePaymentIntentId: input.paymentIntentId,
    stripePaymentStatus: paymentIntent.status,
    shippingAddressSnapshot: snapshot,
    items: cart.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productSku: null,
      productImageUrl: item.productImages[0] ?? null,
      quantity: item.quantity,
      unitPrice: item.appliedDiscountedPrice ?? item.unitPrice,
      totalPrice: (item.appliedDiscountedPrice ?? item.unitPrice) * item.quantity,
    })),
  });

  await upsertOrderPayment({
    orderId: Number(order.id),
    userId: input.userId,
    provider: "stripe",
    providerPaymentId: paymentIntent.id,
    currency: paymentIntent.currency,
    amount: centsToAmount(paymentIntent.amount),
    amountReceived: centsToAmount(paymentIntent.amount_received),
    status: paymentIntent.status,
    paymentMethodTypes: paymentIntent.payment_method_types,
    paidAt: new Date(),
  });

  // Clear the cart after successful order
  await execute(`DELETE FROM cart_items WHERE cart_id = ?`, [cart.id]);

  const items = await getOrderItemsByOrderId(order.id);
  return mapOrderRecord(order, items);
}

export async function getOrderForUser(orderId: number, userId: number): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order || order.user_id !== userId) {
    throw notFound("Order not found");
  }
  const items = await getOrderItemsByOrderId(orderId);
  return mapOrderRecord(order, items);
}

export async function getOrderPaymentForUser(orderId: number, userId: number): Promise<OrderPayment | null> {
  const payment = await getOrderPaymentByOrderIdForUser(orderId, userId);
  if (!payment) {
    return null;
  }

  return mapOrderPaymentRecord(payment);
}

export async function getUserOrders(userId: number): Promise<Order[]> {
  const rows = await getOrdersByUserId(userId);
  const orders: Order[] = [];
  for (const row of rows) {
    const items = await getOrderItemsByOrderId(row.id);
    orders.push(mapOrderRecord(row, items));
  }
  return orders;
}

export async function getUserOrdersPaginated(input: {
  userId: number;
  page: number;
  pageSize: number;
}): Promise<{
  items: Order[];
  total: number;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const { rows, total } = await listOrdersByUserId({
    userId: input.userId,
    page: input.page,
    pageSize: input.pageSize,
  });

  const items: Order[] = [];
  for (const row of rows) {
    const orderItems = await getOrderItemsByOrderId(row.id);
    items.push(mapOrderRecord(row, orderItems));
  }

  return {
    items,
    total,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize),
    },
  };
}

export async function getAdminOrders(filter: ListOrdersFilter): Promise<{
  items: Order[];
  total: number;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const { rows, total } = await listOrders(filter);
  const items: Order[] = [];
  for (const row of rows) {
    const orderItems = await getOrderItemsByOrderId(row.id);
    items.push(mapOrderRecord(row, orderItems));
  }
  return {
    items,
    total,
    pagination: {
      page: filter.page,
      pageSize: filter.pageSize,
      total,
      totalPages: Math.ceil(total / filter.pageSize),
    },
  };
}

export async function updateAdminOrderStatus(
  orderId: number,
  status: OrderStatus,
  notes?: string,
): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order) throw notFound("Order not found");

  await updateOrderStatus(orderId, status, notes);

  const updated = await getOrderById(orderId);
  if (!updated) throw new Error("Failed to retrieve updated order");
  const items = await getOrderItemsByOrderId(orderId);
  return mapOrderRecord(updated, items);
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapOrderRecord(
  row: OrderRecord,
  itemRows: OrderItemRecord[],
): Order {
  const snapshot = typeof row.shipping_address_snapshot === "string"
    ? (JSON.parse(row.shipping_address_snapshot) as AddressSnapshot)
    : row.shipping_address_snapshot as AddressSnapshot;

  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    totalAmount: Number(row.total_amount),
    subtotal: Number(row.subtotal),
    shippingAmount: Number(row.shipping_amount),
    stripePaymentIntentId: row.stripe_payment_intent_id,
    stripePaymentStatus: row.stripe_payment_status,
    shippingAddressSnapshot: snapshot,
    notes: row.notes,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    userName: row.user_name,
    userEmail: row.user_email,
    items: itemRows.map(mapOrderItem),
  };
}

function mapOrderItem(row: OrderItemRecord): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    productSku: row.product_sku,
    productImageUrl: row.product_image_url,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
    createdAt: toIso(row.created_at),
  };
}

function mapOrderPaymentRecord(row: OrderPaymentRecord): OrderPayment {
  let paymentMethodTypes: string[] = [];
  if (row.payment_method_types) {
    if (Array.isArray(row.payment_method_types)) {
      paymentMethodTypes = row.payment_method_types.filter((value): value is string => typeof value === "string");
    } else {
      try {
        const parsed = JSON.parse(row.payment_method_types) as unknown;
        if (Array.isArray(parsed)) {
          paymentMethodTypes = parsed.filter((value): value is string => typeof value === "string");
        }
      } catch {
        paymentMethodTypes = [];
      }
    }
  }

  return {
    orderId: row.order_id,
    userId: row.user_id,
    provider: row.provider,
    providerPaymentId: row.provider_payment_id,
    currency: row.currency.toUpperCase(),
    amount: Number(row.amount),
    amountReceived: Number(row.amount_received),
    status: row.status,
    paymentMethodTypes,
    paidAt: row.paid_at ? toIso(row.paid_at) : null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}
