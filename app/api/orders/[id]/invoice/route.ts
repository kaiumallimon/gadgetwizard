import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { NextRequest } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import { withRouteAudit } from "@/lib/server/middleware/route-audit";
import { requireRole } from "@/lib/server/auth/guards";
import { badRequest } from "@/lib/server/core/errors";
import { handleRouteError, noStoreHeaders } from "@/lib/server/core/http";
import { getOrderForUser, getOrderPaymentForUser } from "@/lib/server/services/order-service";

export const dynamic = "force-dynamic";

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const PAGE_MARGIN = 40;

function money(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadLogoPngBytes(): Promise<Uint8Array | null> {
  try {
    const logoSvg = await readFile(join(process.cwd(), "public", "logo.svg"), "utf8");
    const base64Match = logoSvg.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
    if (!base64Match?.[1]) {
      return null;
    }

    return Uint8Array.from(Buffer.from(base64Match[1], "base64"));
  } catch {
    return null;
  }
}

async function GETHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(request, ["user"]);
    const { id } = await params;

    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw badRequest("Invalid order ID");
    }

    const [order, payment] = await Promise.all([
      getOrderForUser(orderId, session.userId),
      getOrderPaymentForUser(orderId, session.userId),
    ]);

    const effectiveCurrency = payment?.currency ?? "USD";

    const doc = await PDFDocument.create();
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);

    page.drawRectangle({
      x: 0,
      y: A4_HEIGHT - 100,
      width: A4_WIDTH,
      height: 100,
      color: rgb(0.96, 0.97, 0.99),
    });

    const logoBytes = await loadLogoPngBytes();
    if (logoBytes) {
      const logoPng = await doc.embedPng(logoBytes);
      page.drawImage(logoPng, {
        x: PAGE_MARGIN,
        y: A4_HEIGHT - 82,
        width: 42,
        height: 42,
      });
    }

    page.drawText("GadgetWizard", {
      x: PAGE_MARGIN + 52,
      y: A4_HEIGHT - 56,
      size: 22,
      font: fontBold,
      color: rgb(0.1, 0.12, 0.18),
    });

    page.drawText("INVOICE", {
      x: A4_WIDTH - PAGE_MARGIN - 95,
      y: A4_HEIGHT - 58,
      size: 20,
      font: fontBold,
      color: rgb(0.94, 0.38, 0.16),
    });

    page.drawText(`Invoice #: GW-${order.id}`, {
      x: A4_WIDTH - PAGE_MARGIN - 170,
      y: A4_HEIGHT - 78,
      size: 10,
      font: fontRegular,
      color: rgb(0.33, 0.36, 0.44),
    });

    let y = A4_HEIGHT - 130;

    page.drawText("Billed To", {
      x: PAGE_MARGIN,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.12, 0.18),
    });
    y -= 16;

    page.drawText(order.shippingAddressSnapshot.fullName, {
      x: PAGE_MARGIN,
      y,
      size: 11,
      font: fontRegular,
      color: rgb(0.2, 0.23, 0.3),
    });
    y -= 14;

    const addressLines = [
      order.shippingAddressSnapshot.addressLine1,
      order.shippingAddressSnapshot.addressLine2,
      [
        order.shippingAddressSnapshot.city,
        order.shippingAddressSnapshot.state,
        order.shippingAddressSnapshot.postalCode,
      ].filter(Boolean).join(", "),
      order.shippingAddressSnapshot.country,
      order.shippingAddressSnapshot.phone,
    ].filter((line): line is string => Boolean(line));

    for (const line of addressLines) {
      page.drawText(line, {
        x: PAGE_MARGIN,
        y,
        size: 10,
        font: fontRegular,
        color: rgb(0.35, 0.38, 0.45),
      });
      y -= 12;
    }

    const metaX = A4_WIDTH - PAGE_MARGIN - 210;
    const metaTopY = A4_HEIGHT - 130;

    page.drawRectangle({
      x: metaX - 12,
      y: metaTopY - 82,
      width: 222,
      height: 92,
      borderColor: rgb(0.86, 0.89, 0.94),
      borderWidth: 1,
      color: rgb(0.99, 0.99, 1),
    });

    const paymentMethod = payment?.paymentMethodTypes.length
      ? payment.paymentMethodTypes.join(", ").toUpperCase()
      : "CARD";

    const invoiceMeta: Array<[string, string]> = [
      ["Order Date", formatDate(order.createdAt)],
      ["Payment Status", payment?.status.toUpperCase() ?? (order.stripePaymentStatus ?? "PAID").toUpperCase()],
      ["Payment Ref", payment?.providerPaymentId ?? (order.stripePaymentIntentId ?? "N/A")],
      ["Method", paymentMethod],
    ];

    let metaY = metaTopY;
    for (const [label, value] of invoiceMeta) {
      page.drawText(label, {
        x: metaX,
        y: metaY,
        size: 9,
        font: fontBold,
        color: rgb(0.32, 0.35, 0.42),
      });

      page.drawText(value, {
        x: metaX + 95,
        y: metaY,
        size: 9,
        font: fontRegular,
        color: rgb(0.15, 0.18, 0.24),
      });

      metaY -= 20;
    }

    const tableTopY = A4_HEIGHT - 290;
    page.drawRectangle({
      x: PAGE_MARGIN,
      y: tableTopY,
      width: A4_WIDTH - PAGE_MARGIN * 2,
      height: 24,
      color: rgb(0.93, 0.95, 0.99),
    });

    const colProductX = PAGE_MARGIN + 8;
    const colQtyX = A4_WIDTH - PAGE_MARGIN - 170;
    const colUnitX = A4_WIDTH - PAGE_MARGIN - 115;
    const colTotalX = A4_WIDTH - PAGE_MARGIN - 52;

    page.drawText("Product", {
      x: colProductX,
      y: tableTopY + 8,
      size: 10,
      font: fontBold,
      color: rgb(0.2, 0.24, 0.32),
    });
    page.drawText("Qty", {
      x: colQtyX,
      y: tableTopY + 8,
      size: 10,
      font: fontBold,
      color: rgb(0.2, 0.24, 0.32),
    });
    page.drawText("Unit", {
      x: colUnitX,
      y: tableTopY + 8,
      size: 10,
      font: fontBold,
      color: rgb(0.2, 0.24, 0.32),
    });
    page.drawText("Total", {
      x: colTotalX,
      y: tableTopY + 8,
      size: 10,
      font: fontBold,
      color: rgb(0.2, 0.24, 0.32),
    });

    let rowY = tableTopY - 20;
    for (const item of order.items) {
      page.drawText(item.productName.slice(0, 62), {
        x: colProductX,
        y: rowY,
        size: 9,
        font: fontRegular,
        color: rgb(0.12, 0.15, 0.2),
      });
      page.drawText(String(item.quantity), {
        x: colQtyX,
        y: rowY,
        size: 9,
        font: fontRegular,
        color: rgb(0.12, 0.15, 0.2),
      });
      page.drawText(money(item.unitPrice, effectiveCurrency), {
        x: colUnitX,
        y: rowY,
        size: 9,
        font: fontRegular,
        color: rgb(0.12, 0.15, 0.2),
      });
      page.drawText(money(item.totalPrice, effectiveCurrency), {
        x: colTotalX,
        y: rowY,
        size: 9,
        font: fontRegular,
        color: rgb(0.12, 0.15, 0.2),
      });

      rowY -= 16;
    }

    const summaryY = Math.max(rowY - 14, 170);

    page.drawRectangle({
      x: A4_WIDTH - PAGE_MARGIN - 220,
      y: summaryY - 56,
      width: 220,
      height: 72,
      color: rgb(0.97, 0.98, 1),
      borderColor: rgb(0.86, 0.89, 0.94),
      borderWidth: 1,
    });

    page.drawText("Subtotal", {
      x: A4_WIDTH - PAGE_MARGIN - 208,
      y: summaryY,
      size: 10,
      font: fontRegular,
      color: rgb(0.33, 0.36, 0.44),
    });
    page.drawText(money(order.subtotal, effectiveCurrency), {
      x: A4_WIDTH - PAGE_MARGIN - 82,
      y: summaryY,
      size: 10,
      font: fontRegular,
      color: rgb(0.15, 0.18, 0.24),
    });

    page.drawText("Payment Received", {
      x: A4_WIDTH - PAGE_MARGIN - 208,
      y: summaryY - 18,
      size: 10,
      font: fontRegular,
      color: rgb(0.33, 0.36, 0.44),
    });
    page.drawText(
      money(payment?.amountReceived ?? order.totalAmount, effectiveCurrency),
      {
        x: A4_WIDTH - PAGE_MARGIN - 82,
        y: summaryY - 18,
        size: 10,
        font: fontRegular,
        color: rgb(0.15, 0.18, 0.24),
      },
    );

    page.drawText("Total", {
      x: A4_WIDTH - PAGE_MARGIN - 208,
      y: summaryY - 40,
      size: 11,
      font: fontBold,
      color: rgb(0.12, 0.15, 0.2),
    });
    page.drawText(money(order.totalAmount, effectiveCurrency), {
      x: A4_WIDTH - PAGE_MARGIN - 82,
      y: summaryY - 40,
      size: 11,
      font: fontBold,
      color: rgb(0.94, 0.38, 0.16),
    });

    page.drawLine({
      start: { x: PAGE_MARGIN, y: 72 },
      end: { x: A4_WIDTH - PAGE_MARGIN, y: 72 },
      color: rgb(0.9, 0.92, 0.95),
      thickness: 1,
    });

    page.drawText("Automatically generated from the GadgetWizard website.", {
      x: PAGE_MARGIN,
      y: 54,
      size: 9,
      font: fontRegular,
      color: rgb(0.45, 0.48, 0.55),
    });

    page.drawText(`Generated: ${formatDate(new Date().toISOString())}`, {
      x: PAGE_MARGIN,
      y: 40,
      size: 9,
      font: fontRegular,
      color: rgb(0.45, 0.48, 0.55),
    });

    const pdfBytes = await doc.save();
    return new Response(pdfBytes, {
      status: 200,
      headers: noStoreHeaders({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-order-${order.id}.pdf`,
      }),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export const GET = withRouteAudit(GETHandler);
