import Stripe from "stripe";

import { getEnv } from "@/lib/server/core/env";
import { badRequest, notFound } from "@/lib/server/core/errors";
import { withTransaction } from "@/lib/server/core/db";
import {
  calculateCheckoutTotal,
  getShowroomPickupSnapshot,
  type CheckoutFulfillmentMethod,
} from "@/lib/shared/checkout";
import type {
  AddressSnapshot,
  Order,
  OrderItem,
  OrderPurchaseMode,
  OrderStatus,
} from "@/lib/client/types";
import {
  clearCartItemsByProductIds,
  createOrder as createOrderRepo,
  decrementProductStock,
  findOrderByPaymentIntent,
  getOrderById,
  getOrderItemsByOrderId,
  getOrdersByUserId,
  listOrders,
  listOrdersByUserId,
  lockProductsForCheckout,
  toOrderItemImageFromProductRow,
  updateOrderStatus,
  type CheckoutProductRow,
  type ListOrdersFilter,
  type OrderItemRecord,
  type OrderRecord,
} from "@/lib/server/repositories/order-repository";
import {
  createAddress,
  getAddressById,
  type CreateAddressInput,
} from "@/lib/server/repositories/address-repository";
import {
  getOrderPaymentByOrderIdForUser,
  type OrderPaymentRecord,
  upsertOrderPayment,
} from "@/lib/server/repositories/order-payment-repository";
import { getBusinessAccountById } from "@/lib/server/repositories/business-account-repository";
import { getCartByUserId, type CartItemRecord } from "@/lib/server/repositories/cart-repository";
import { getBusinessCheckoutContext } from "@/lib/server/services/business-account-service";

function getStripe(): Stripe {
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY) {
    throw badRequest("Payment processing is not configured on this server.");
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
}

export interface CheckoutAddressInput {
  purchaseMode?: OrderPurchaseMode;
  fulfillmentMethod?: CheckoutFulfillmentMethod;
  selectedProductIds?: number[];
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

type ResolvedOrderItem = {
  productId: number;
  productName: string;
  productSku: string | null;
  productImageUrl: string | null;
  quantity: number;
  isWholesaleItem: boolean;
  unitPrice: number;
  wholesaleUnitPrice: number | null;
  totalPrice: number;
};

function resolveCheckoutCartItems(cart: CartItemRecord[], selectedProductIds?: number[]): CartItemRecord[] {
  if (!selectedProductIds || selectedProductIds.length === 0) {
    return cart;
  }

  const selectedSet = new Set(selectedProductIds);
  const selectedItems = cart.filter((item) => selectedSet.has(item.productId));

  if (selectedItems.length === 0) {
    throw badRequest("No selected cart items were found.");
  }

  return selectedItems;
}

async function resolveShippingAddress(
  userId: number,
  input: CheckoutAddressInput,
): Promise<{ snapshot: AddressSnapshot; savedAddressId?: number }> {
  if ((input.fulfillmentMethod ?? "delivery") === "pickup") {
    return { snapshot: getShowroomPickupSnapshot() };
  }

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

function centsToAmount(value: number | null | undefined): number {
  return Number(((value ?? 0) / 100).toFixed(2));
}

function resolveRegularUnitPrice(input: { unitPrice: number; appliedDiscountedPrice: number | null }): number {
  return input.appliedDiscountedPrice ?? input.unitPrice;
}

function resolvePricingForMode(input: {
  productName: string;
  quantity: number;
  purchaseMode: OrderPurchaseMode;
  canUseBusinessMode: boolean;
  regularUnitPrice: number;
  wholesalePrice: number | null;
  wholesaleMinQuantity: number | null;
}): { unitPrice: number; isWholesaleItem: boolean; wholesaleUnitPrice: number | null } {
  const hasWholesaleRule = input.wholesalePrice !== null && input.wholesaleMinQuantity !== null;

  if (input.purchaseMode === "business" && !input.canUseBusinessMode) {
    throw badRequest("Your business account is not approved yet for wholesale purchases");
  }

  const isWholesaleItem =
    input.purchaseMode === "business" &&
    hasWholesaleRule &&
    input.quantity >= (input.wholesaleMinQuantity ?? Number.MAX_SAFE_INTEGER);

  if (isWholesaleItem) {
    return {
      unitPrice: input.wholesalePrice ?? input.regularUnitPrice,
      isWholesaleItem: true,
      wholesaleUnitPrice: input.wholesalePrice,
    };
  }

  return {
    unitPrice: input.regularUnitPrice,
    isWholesaleItem: false,
    wholesaleUnitPrice: null,
  };
}

function buildOrderItemFromCart(input: {
  cartItem: CartItemRecord;
  purchaseMode: OrderPurchaseMode;
  canUseBusinessMode: boolean;
}): ResolvedOrderItem {
  if (input.cartItem.quantity > input.cartItem.stock) {
    throw badRequest(
      `${input.cartItem.productName} stock changed. Available: ${input.cartItem.stock}, requested: ${input.cartItem.quantity}`,
    );
  }

  const pricing = resolvePricingForMode({
    productName: input.cartItem.productName,
    quantity: input.cartItem.quantity,
    purchaseMode: input.purchaseMode,
    canUseBusinessMode: input.canUseBusinessMode,
    regularUnitPrice: resolveRegularUnitPrice({
      unitPrice: input.cartItem.unitPrice,
      appliedDiscountedPrice: input.cartItem.appliedDiscountedPrice,
    }),
    wholesalePrice: input.cartItem.productWholesalePrice,
    wholesaleMinQuantity: input.cartItem.productWholesaleMinQuantity,
  });

  return {
    productId: input.cartItem.productId,
    productName: input.cartItem.productName,
    productSku: null,
    productImageUrl: input.cartItem.productImages[0] ?? null,
    quantity: input.cartItem.quantity,
    isWholesaleItem: pricing.isWholesaleItem,
    unitPrice: pricing.unitPrice,
    wholesaleUnitPrice: pricing.wholesaleUnitPrice,
    totalPrice: pricing.unitPrice * input.cartItem.quantity,
  };
}

function buildOrderItemFromLockedProduct(input: {
  cartItem: CartItemRecord;
  product: CheckoutProductRow;
  purchaseMode: OrderPurchaseMode;
  canUseBusinessMode: boolean;
}): ResolvedOrderItem {
  if (input.product.is_active !== 1) {
    throw badRequest(`${input.product.name} is no longer available for purchase.`);
  }

  if (input.cartItem.quantity > input.product.stock) {
    throw badRequest(
      `${input.product.name} stock changed. Available: ${input.product.stock}, requested: ${input.cartItem.quantity}`,
    );
  }

  const regularUnitPrice = input.product.discounted_price === null
    ? Number(input.product.original_price)
    : Number(input.product.discounted_price);

  const pricing = resolvePricingForMode({
    productName: input.product.name,
    quantity: input.cartItem.quantity,
    purchaseMode: input.purchaseMode,
    canUseBusinessMode: input.canUseBusinessMode,
    regularUnitPrice,
    wholesalePrice: input.product.wholesale_price === null ? null : Number(input.product.wholesale_price),
    wholesaleMinQuantity: input.product.wholesale_min_quantity,
  });

  return {
    productId: input.product.id,
    productName: input.product.name,
    productSku: input.product.sku,
    productImageUrl: toOrderItemImageFromProductRow(input.product),
    quantity: input.cartItem.quantity,
    isWholesaleItem: pricing.isWholesaleItem,
    unitPrice: pricing.unitPrice,
    wholesaleUnitPrice: pricing.wholesaleUnitPrice,
    totalPrice: pricing.unitPrice * input.cartItem.quantity,
  };
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export async function createPaymentIntent(
  userId: number,
  input?: CheckoutAddressInput,
): Promise<{ clientSecret: string; paymentIntentId: string; amount: number }> {
  const stripe = getStripe();
  const purchaseMode = input?.purchaseMode ?? "regular";
  const fulfillmentMethod = input?.fulfillmentMethod ?? "delivery";

  const cart = await getCartByUserId(userId);
  if (!cart || cart.items.length === 0) {
    throw badRequest("Your cart is empty.");
  }

  const checkoutItems = resolveCheckoutCartItems(cart.items, input?.selectedProductIds);

  const checkoutContext = await getBusinessCheckoutContext(userId, purchaseMode);

  const orderItems = checkoutItems.map((item) => buildOrderItemFromCart({
    cartItem: item,
    purchaseMode,
    canUseBusinessMode: checkoutContext.canUseBusinessMode,
  }));

  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totals = calculateCheckoutTotal({ subtotal, fulfillmentMethod });
  const amountInCents = Math.round(totals.total * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      userId: String(userId),
      purchaseMode,
      fulfillmentMethod,
      shippingAmount: String(totals.deliveryCharge),
      businessAccountId: checkoutContext.approvedAccount ? String(checkoutContext.approvedAccount.id) : "",
    },
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Failed to create payment intent");
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: totals.total,
  };
}

export interface CreateOrderInput {
  userId: number;
  paymentIntentId: string;
  purchaseMode?: OrderPurchaseMode;
  fulfillmentMethod?: CheckoutFulfillmentMethod;
  selectedProductIds?: number[];
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

export async function createOrderAfterPayment(input: CreateOrderInput): Promise<Order> {
  const stripe = getStripe();

  const paymentIntent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
  if (paymentIntent.status !== "succeeded") {
    throw badRequest(`Payment not completed. Status: ${paymentIntent.status}`);
  }

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

  const purchaseMode = input.purchaseMode ?? "regular";
  const fulfillmentMethod = paymentIntent.metadata.fulfillmentMethod === "pickup" ? "pickup" : "delivery";
  const cart = await getCartByUserId(input.userId);
  if (!cart || cart.items.length === 0) {
    throw badRequest("Cart is empty — cannot create order.");
  }

  const checkoutItems = resolveCheckoutCartItems(cart.items, input.selectedProductIds);

  const checkoutContext = await getBusinessCheckoutContext(input.userId, purchaseMode);
  const { snapshot } = await resolveShippingAddress(input.userId, {
    ...input.addressInput,
    fulfillmentMethod,
  });

  const createdOrder = await withTransaction(async (connection) => {
    const productIds = Array.from(new Set(checkoutItems.map((item) => item.productId)));
    const lockedProducts = await lockProductsForCheckout(productIds, connection);
    const lockedMap = new Map<number, CheckoutProductRow>(
      lockedProducts.map((product) => [product.id, product]),
    );

    const items: ResolvedOrderItem[] = [];
    for (const cartItem of checkoutItems) {
      const product = lockedMap.get(cartItem.productId);
      if (!product) {
        throw badRequest(`${cartItem.productName} is no longer available.`);
      }

      items.push(
        buildOrderItemFromLockedProduct({
          cartItem,
          product,
          purchaseMode,
          canUseBusinessMode: checkoutContext.canUseBusinessMode,
        }),
      );
    }

    for (const item of items) {
      const decremented = await decrementProductStock(item.productId, item.quantity, connection);
      if (!decremented) {
        throw badRequest(`${item.productName} stock changed while checking out. Please refresh your cart and try again.`);
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totals = calculateCheckoutTotal({ subtotal, fulfillmentMethod });
    const isWholesale = items.some((item) => item.isWholesaleItem);

    const order = await createOrderRepo(
      {
        userId: input.userId,
        purchaseMode,
        isWholesale,
        businessAccountId: checkoutContext.approvedAccount?.id ?? null,
        totalAmount: totals.total,
        subtotal,
        shippingAmount: totals.deliveryCharge,
        stripePaymentIntentId: input.paymentIntentId,
        stripePaymentStatus: paymentIntent.status,
        shippingAddressSnapshot: snapshot,
        items,
      },
      connection,
    );

    await clearCartItemsByProductIds(cart.id, checkoutItems.map((item) => item.productId), connection);

    return order;
  });

  await upsertOrderPayment({
    orderId: Number(createdOrder.id),
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

  const items = await getOrderItemsByOrderId(createdOrder.id);
  const order = mapOrderRecord(createdOrder, items);

  if (order.businessAccountId) {
    const businessAccount = await getBusinessAccountById(order.businessAccountId);
    order.businessAccount = businessAccount;
  }

  return order;
}

export async function getOrderForUser(orderId: number, userId: number): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order || order.user_id !== userId) {
    throw notFound("Order not found");
  }
  const items = await getOrderItemsByOrderId(orderId);
  return mapOrderRecord(order, items);
}

export async function getAdminOrderById(orderId: number): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order) {
    throw notFound("Order not found");
  }

  const items = await getOrderItemsByOrderId(orderId);
  const mapped = mapOrderRecord(order, items);

  if (mapped.businessAccountId) {
    const businessAccount = await getBusinessAccountById(mapped.businessAccountId);
    mapped.businessAccount = businessAccount;
  }

  return mapped;
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
    purchaseMode: row.purchase_mode,
    isWholesale: Number(row.is_wholesale) === 1,
    businessAccountId: row.business_account_id,
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
    isWholesaleItem: Number(row.is_wholesale_item) === 1,
    unitPrice: Number(row.unit_price),
    wholesaleUnitPrice: row.wholesale_unit_price === null ? null : Number(row.wholesale_unit_price),
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
    currency: row.currency,
    amount: Number(row.amount),
    amountReceived: Number(row.amount_received),
    status: row.status,
    paymentMethodTypes,
    paidAt: row.paid_at ? toIso(row.paid_at) : null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}
