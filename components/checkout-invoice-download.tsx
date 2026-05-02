"use client";

import { useState } from "react";
import type { Order } from "@/lib/client/types";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface InvoiceLineItem {
  id: string;
  name: string;
  /** e.g. "Color: Black · Size: M" */
  variant?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  /** Optional – pass a small square image URL to show a thumbnail */
  imageUrl?: string;
}

type PaymentStatus = "confirmed" | "pending" | "failed" | "refunded";
type CardNetwork = "VISA" | "MC" | "AMEX" | "DISC" | string;

export interface CheckoutInvoiceProps {
  order: Order & {
    orderNumber: string;
    orderDate: string;           // ISO string
    estimatedDelivery?: string;  // e.g. "May 2 – May 5, 2026"
    paymentStatus: PaymentStatus;

    // Payment method
    cardNetwork?: CardNetwork;   // "VISA" | "MC" | "AMEX" | "DISC"
    cardLast4?: string;          // "4242"

    // Addresses
    billingAddress: {
      name: string;
      lines: string[];           // ["88 Stanton St, Apt 4", "New York, NY 10002", "United States"]
    };
    shippingAddress?: {          // omit if same as billing
      name: string;
      lines: string[];
    };

    // Line items & pricing
    lineItems: InvoiceLineItem[];
    shippingCost?: number;       // 0 = free
    taxRate?: number;            // 0.075 = 7.5%
    promoCode?: string;          // "SAVE10"
    promoDiscount?: number;      // absolute $

    // Store branding
    storeName: string;
    storeEmail: string;
    storeWebsite?: string;
    /** URL to your logo image; falls back to first letter of storeName */
    logoUrl?: string;

    returnWindowDays?: number;   // default 30
    supportEmail?: string;
    helpCentreUrl?: string;
    trackOrderUrl?: string;
    returnUrl?: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (n: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const PAYMENT_STATUS: Record<
  PaymentStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  confirmed: { label: "Payment confirmed", bg: "#EAF3DE", text: "#3B6D11", dot: "#639922" },
  pending:   { label: "Payment pending",   bg: "#FAEEDA", text: "#854F0B", dot: "#BA7517" },
  failed:    { label: "Payment failed",    bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
  refunded:  { label: "Refunded",          bg: "#E6F1FB", text: "#185FA5", dot: "#378ADD" },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StoreLogo({ logoUrl, name }: { logoUrl?: string; name: string }) {
  const s: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 8,
    flexShrink: 0,
    overflow: "hidden",
    background: "#185FA5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  return (
    <div style={s}>
      {logoUrl ? (
        <img src={logoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function ProductThumb({ imageUrl, name }: { imageUrl?: string; name: string }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 6,
        background: "var(--color-background-secondary)",
        border: "0.5px solid var(--color-border-tertiary)",
        flexShrink: 0,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <rect x="2" y="6" width="14" height="10" rx="2" fill="var(--color-border-secondary)" />
          <path d="M6 6V5a3 3 0 016 0v1" stroke="var(--color-border-tertiary)" strokeWidth="1.5" fill="none" />
        </svg>
      )}
    </div>
  );
}

function CardChip({ network }: { network?: CardNetwork }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 18,
        borderRadius: 3,
        border: "0.5px solid var(--color-border-secondary)",
        background: "var(--color-background-secondary)",
        fontSize: 8,
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: "var(--color-text-secondary)",
        userSelect: "none" as const,
      }}
    >
      {network ?? "CARD"}
    </div>
  );
}

function MetaCol({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <span
        style={{
          fontSize: 10,
          textTransform: "uppercase" as const,
          letterSpacing: "0.08em",
          color: "var(--color-text-tertiary)",
          display: "block",
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      <div style={{ fontSize: 12, color: "var(--color-text-primary)", lineHeight: 1.65 }}>
        {children}
      </div>
    </div>
  );
}

function TotalsRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", gap: "2rem" }}>
      <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: accent ? "#3B6D11" : "var(--color-text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main invoice component
// ---------------------------------------------------------------------------
export function CheckoutInvoice({ order }: CheckoutInvoiceProps) {
  const subtotal = order.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const shipping = order.shippingCost ?? 0;
  const tax = subtotal * (order.taxRate ?? 0);
  const promo = order.promoDiscount ?? 0;
  const total = subtotal + shipping + tax - promo;
  const itemCount = order.lineItems.reduce((s, i) => s + i.quantity, 0);

  const status = PAYMENT_STATUS[order.paymentStatus] ?? PAYMENT_STATUS.pending;
  const shippingAddr = order.shippingAddress ?? order.billingAddress;
  const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 680, margin: "0 auto" }}>
      <div
        style={{
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: "var(--border-radius-lg)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "1.75rem 2rem 1.5rem",
            borderBottom: "0.5px solid var(--color-border-tertiary)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StoreLogo logoUrl={order.logoUrl} name={order.storeName} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>
                {order.storeName}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 1 }}>
                {order.storeEmail}
                {order.storeWebsite ? ` · ${order.storeWebsite}` : ""}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.5, color: "var(--color-text-primary)", margin: 0, lineHeight: 1 }}>
              Receipt
            </p>
            <p style={{ ...mono, fontSize: 12, color: "var(--color-text-secondary)", marginTop: 5 }}>
              Order #{order.orderNumber}
            </p>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: status.bg,
                color: status.text,
                fontSize: 11,
                fontWeight: 500,
                padding: "3px 9px",
                borderRadius: 99,
                marginTop: 7,
              }}
            >
              <span style={{ width: 5, height: 5, background: status.dot, borderRadius: "50%" }} />
              {status.label}
            </span>
          </div>
        </div>

        {/* ── Meta ── */}
        <div
          style={{
            padding: "1.25rem 2rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1.25rem",
            borderBottom: "0.5px solid var(--color-border-tertiary)",
          }}
        >
          <MetaCol label="Billing address">
            <strong>{order.billingAddress.name}</strong>
            {order.billingAddress.lines.map((l) => (
              <span key={l} style={{ display: "block" }}>{l}</span>
            ))}
          </MetaCol>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <MetaCol label="Shipping address">
              <strong>{shippingAddr.name}</strong>
              {shippingAddr.lines.map((l) => (
                <span key={l} style={{ display: "block" }}>{l}</span>
              ))}
            </MetaCol>
            {order.estimatedDelivery && (
              <MetaCol label="Est. delivery">
                <span style={mono}>{order.estimatedDelivery}</span>
              </MetaCol>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <MetaCol label="Order date">
              <span style={mono}>{fmtDate(order.orderDate)}</span>
            </MetaCol>
            <MetaCol label="Payment">
              {order.cardLast4 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CardChip network={order.cardNetwork} />
                  <span style={{ ...mono, fontSize: 12 }}>•••• {order.cardLast4}</span>
                </div>
              ) : (
                <span style={mono}>—</span>
              )}
            </MetaCol>
          </div>
        </div>

        {/* ── Line items ── */}
        <div style={{ padding: "0 2rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", margin: "1.25rem 0" }}>
            <colgroup>
              <col style={{ width: "48%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <thead>
              <tr>
                {["Product", "Qty", "Price", "Total"].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.08em",
                      color: "var(--color-text-tertiary)",
                      fontWeight: 500,
                      padding: "0 0 8px",
                      textAlign: i === 0 ? "left" : "right",
                      borderBottom: "0.5px solid var(--color-border-secondary)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.lineItems.map((item, idx) => {
                const isLast = idx === order.lineItems.length - 1;
                const border = isLast ? "none" : "0.5px solid var(--color-border-tertiary)";
                return (
                  <tr key={item.id}>
                    <td style={{ padding: "11px 0", borderBottom: border, verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <ProductThumb imageUrl={item.imageUrl} name={item.name} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                            {item.name}
                          </div>
                          {item.variant && (
                            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                              {item.variant}
                            </div>
                          )}
                          {item.sku && (
                            <div style={{ ...mono, fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 1 }}>
                              SKU: {item.sku}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...mono, fontSize: 12, color: "var(--color-text-secondary)", textAlign: "right", padding: "11px 0", borderBottom: border, verticalAlign: "top" }}>
                      {item.quantity}
                    </td>
                    <td style={{ ...mono, fontSize: 12, color: "var(--color-text-secondary)", textAlign: "right", padding: "11px 0", borderBottom: border, verticalAlign: "top" }}>
                      {fmt(item.unitPrice)}
                    </td>
                    <td style={{ ...mono, fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", textAlign: "right", padding: "11px 0", borderBottom: border, verticalAlign: "top" }}>
                      {fmt(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Totals ── */}
        <div
          style={{
            padding: "0.75rem 2rem 1.25rem",
            display: "flex",
            justifyContent: "flex-end",
            borderTop: "0.5px solid var(--color-border-tertiary)",
          }}
        >
          <div style={{ minWidth: 228 }}>
            <TotalsRow label={`Subtotal (${itemCount} item${itemCount !== 1 ? "s" : ""})`} value={fmt(subtotal)} />
            <TotalsRow
              label={shipping === 0 ? "Shipping (Free)" : "Shipping"}
              value={shipping === 0 ? "Free" : fmt(shipping)}
            />
            {(order.taxRate ?? 0) > 0 && (
              <TotalsRow
                label={`Sales tax (${((order.taxRate ?? 0) * 100).toFixed(1)}%)`}
                value={fmt(tax)}
              />
            )}
            {promo > 0 && order.promoCode && (
              <TotalsRow label={`Promo code ${order.promoCode}`} value={`−${fmt(promo)}`} accent />
            )}
            <hr style={{ border: "none", borderTop: "0.5px solid var(--color-border-secondary)", margin: "7px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "2rem" }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>
                Total paid
              </span>
              <span style={{ ...mono, fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>
                {fmt(total)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            background: "var(--color-background-secondary)",
            borderTop: "0.5px solid var(--color-border-tertiary)",
            padding: "1rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", lineHeight: 1.6, margin: 0, maxWidth: 340 }}>
            Free returns within {order.returnWindowDays ?? 30} days.{" "}
            Questions? Contact us at{" "}
            <a href={`mailto:${order.supportEmail ?? order.storeEmail}`} style={{ color: "var(--color-text-secondary)" }}>
              {order.supportEmail ?? order.storeEmail}
            </a>
            {order.helpCentreUrl ? " or visit our Help Centre." : "."}
          </p>

          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {order.trackOrderUrl && (
              <a
                href={order.trackOrderUrl}
                style={{
                  fontSize: 11,
                  color: "var(--color-text-secondary)",
                  border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: 6,
                  padding: "5px 12px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Track order
              </a>
            )}
            {order.returnUrl && (
              <a
                href={order.returnUrl}
                style={{
                  fontSize: 11,
                  color: "var(--color-text-secondary)",
                  border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: 6,
                  padding: "5px 12px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Start return
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Download button — co-located, unchanged from your original
// ---------------------------------------------------------------------------
export function CheckoutInvoiceDownload({ order }: { order: Order }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/invoice`);
      if (!response.ok) throw new Error(`Failed to fetch invoice (${response.status})`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-order-${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Invoice download failed", error);
      // TODO: surface to user via toast
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button type="button" onClick={handleDownload} variant="outline" className="rounded-full" disabled={downloading}>
      {downloading ? "Preparing invoice…" : "Download Invoice"}
    </Button>
  );
}