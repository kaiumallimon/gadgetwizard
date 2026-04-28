"use client";

import { useState } from "react";

import type { Order } from "@/lib/client/types";
import { Button } from "@/components/ui/button";

interface CheckoutInvoiceDownloadProps {
  order: Order;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US");
}

function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const palette = {
  ink: "#111827",
  inkSoft: "#374151",
  muted: "#6b7280",
  subtle: "#9ca3af",
  border: "#d4d4d8",
  panel: "#f4f4f5",
  accent: "#f97316",
};

function buildInvoiceHtml(order: Order): string {
  const address = order.shippingAddressSnapshot;
  const addressLines = [
    address.addressLine1,
    address.addressLine2 ?? "",
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
    address.phone,
  ].filter((line) => line.trim().length > 0);

  const itemsHtml = order.items
    .map((item) => {
      const sku = item.productSku ? `<div class="muted">SKU: ${escapeHtml(item.productSku)}</div>` : "";
      return `
        <tr>
          <td>
            <div class="item-name">${escapeHtml(item.productName)}</div>
            ${sku}
          </td>
          <td class="num">${item.quantity}</td>
          <td class="num">${formatCurrency(item.unitPrice)}</td>
          <td class="num">${formatCurrency(item.totalPrice)}</td>
        </tr>
      `;
    })
    .join("");

  const paymentStatus = titleCase(order.stripePaymentStatus ?? "paid");
  const orderDate = formatDate(order.createdAt);

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background: #ffffff; color: ${palette.ink}; font-family: Arial, Helvetica, sans-serif; }
          .page { width: 794px; padding: 40px; }
          .frame { border: 1px solid ${palette.border}; padding: 32px; }
          .header { display: flex; justify-content: space-between; gap: 24px; }
          .brand { text-transform: uppercase; font-size: 11px; font-weight: 700; color: ${palette.accent}; letter-spacing: 0.12em; }
          .company { margin-top: 8px; font-size: 14px; font-weight: 700; }
          .small { font-size: 12px; color: ${palette.muted}; }
          .meta { min-width: 220px; border: 1px solid ${palette.border}; border-radius: 6px; }
          .meta-row { display: flex; justify-content: space-between; padding: 8px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${palette.muted}; }
          .meta-row + .meta-row { border-top: 1px solid ${palette.border}; }
          .meta-row.head { background: ${palette.panel}; }
          .split { display: flex; gap: 24px; margin-top: 24px; font-size: 12px; color: ${palette.inkSoft}; }
          .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${palette.subtle}; }
          .pay-grid { margin-top: 8px; display: grid; gap: 6px; }
          .pay-row { display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          thead th { text-transform: uppercase; font-size: 11px; letter-spacing: 0.14em; color: ${palette.subtle}; background: ${palette.panel}; border-bottom: 1px solid ${palette.border}; padding: 8px 12px; text-align: left; }
          tbody td { border-bottom: 1px solid ${palette.border}; padding: 10px 12px; font-size: 12px; }
          tbody tr:last-child td { border-bottom: none; }
          .num { text-align: right; }
          .item-name { font-weight: 700; color: ${palette.ink}; }
          .muted { font-size: 11px; color: ${palette.subtle}; margin-top: 2px; }
          .totals { width: 260px; margin-left: auto; border: 1px solid ${palette.border}; margin-top: 24px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 12px; font-size: 12px; }
          .totals-row + .totals-row { border-top: 1px solid ${palette.border}; }
          .totals-row.head { background: ${palette.panel}; }
          .totals-row strong { color: ${palette.ink}; }
          .thanks { margin-top: 28px; text-align: center; font-size: 12px; color: ${palette.subtle}; }
          .thanks strong { font-size: 14px; color: ${palette.ink}; }
          .link { margin-top: 6px; font-size: 11px; color: ${palette.accent}; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="frame">
            <div class="header">
              <div>
                <div class="brand">Gadget Wizard</div>
                <div class="company">Gadget Wizard Pty Ltd</div>
                <div class="small">123 Main Street</div>
                <div class="small">Sydney, NSW 2000</div>
                <div class="small">(321) 456-7890</div>
                <div class="small">support@gadgetwizard.com</div>
              </div>
              <div class="meta">
                <div class="meta-row head"><span>Date</span><span>${orderDate}</span></div>
                <div class="meta-row"><span>Receipt No.</span><span>GW-${order.id}</span></div>
                <div class="meta-row"><span>Customer No.</span><span>${order.userId}</span></div>
              </div>
            </div>

            <div class="split">
              <div>
                <div class="section-title">Bill To</div>
                <div style="margin-top: 6px; font-weight: 700; color: ${palette.ink};">${escapeHtml(address.fullName)}</div>
                ${addressLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}
              </div>
              <div>
                <div class="section-title">Payment</div>
                <div class="pay-grid">
                  <div class="pay-row"><span>Method</span><strong>Card</strong></div>
                  <div class="pay-row"><span>Status</span><strong>${escapeHtml(paymentStatus)}</strong></div>
                  <div class="pay-row"><span>Reference</span><strong>${escapeHtml(order.stripePaymentIntentId ?? "N/A")}</strong></div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="num">Qty</th>
                  <th class="num">Unit Price</th>
                  <th class="num">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-row head"><span>Subtotal</span><strong>${formatCurrency(order.subtotal)}</strong></div>
              <div class="totals-row"><span>Tax</span><strong>${formatCurrency(0)}</strong></div>
              <div class="totals-row"><span>Shipping</span><strong>${formatCurrency(order.shippingAmount)}</strong></div>
              <div class="totals-row"><span>Total</span><strong>${formatCurrency(order.totalAmount)}</strong></div>
            </div>

            <div class="thanks">
              <div><strong>Thank you</strong></div>
              <div>Please contact support if you have questions about this receipt.</div>
              <div class="link">www.gadgetwizard.com</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function CheckoutInvoiceDownload({ order }: CheckoutInvoiceDownloadProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = (html2pdfModule.default ?? html2pdfModule) as any;
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.left = "-10000px";
      iframe.style.top = "0";
      iframe.style.width = "794px";
      iframe.style.height = "1123px";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument;
      if (!doc) {
        document.body.removeChild(iframe);
        return;
      }

      doc.open();
      doc.write(buildInvoiceHtml(order));
      doc.close();

      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      const options = {
        margin: [0.35, 0.35, 0.35, 0.35],
        filename: `invoice-order-${order.id}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };

      await html2pdf().from(doc.body).set(options).save();
      document.body.removeChild(iframe);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        onClick={handleDownload}
        variant="outline"
        className="rounded-full"
        disabled={downloading}
      >
        {downloading ? "Preparing invoice..." : "Download Invoice"}
      </Button>
    </div>
  );
}
