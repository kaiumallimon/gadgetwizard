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
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}.${day}.${year}`;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function wrapText(value: string, maxChars: number): string[] {
  const words = value.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word;
      continue;
    }
    current = next;
  }

  if (current) lines.push(current);
  return lines;
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
    const textColor = rgb(0.14, 0.14, 0.14);
    const mutedColor = rgb(0.45, 0.45, 0.45);
    const lineColor = rgb(0.88, 0.88, 0.88);
    const headerBg = rgb(0.96, 0.96, 0.96);

    const contentLeft = PAGE_MARGIN;
    const contentRight = A4_WIDTH - PAGE_MARGIN;
    const contentWidth = contentRight - contentLeft;

    const drawRightAlignedText = (
      text: string,
      rightX: number,
      y: number,
      size: number,
      font: typeof fontRegular,
      color: ReturnType<typeof rgb>,
    ) => {
      const width = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: rightX - width, y, size, font, color });
    };

    const drawDivider = (y: number) => {
      page.drawLine({
        start: { x: contentLeft, y },
        end: { x: contentRight, y },
        color: lineColor,
        thickness: 1,
      });
    };

    const logoBytes = await loadLogoPngBytes();
    const logoWidth = 110;
    const logoHeight = 32;

    if (logoBytes) {
      const logoPng = await doc.embedPng(logoBytes);
      page.drawImage(logoPng, {
        x: contentRight - logoWidth,
        y: A4_HEIGHT - PAGE_MARGIN - logoHeight + 6,
        width: logoWidth,
        height: logoHeight,
      });
    } else {
      const fallback = "GadgetWizard";
      drawRightAlignedText(fallback, contentRight, A4_HEIGHT - PAGE_MARGIN - 16, 12, fontBold, textColor);
    }

    let cursorY = A4_HEIGHT - PAGE_MARGIN - 12;
    const invoiceLabel = "Invoice No:";
    page.drawText(invoiceLabel, {
      x: contentLeft,
      y: cursorY,
      size: 11,
      font: fontBold,
      color: textColor,
    });
    const invoiceLabelWidth = fontBold.widthOfTextAtSize(invoiceLabel, 11);
    page.drawText(`#GW-${order.id}`, {
      x: contentLeft + invoiceLabelWidth + 6,
      y: cursorY,
      size: 11,
      font: fontRegular,
      color: textColor,
    });

    cursorY -= 16;
    const dateLabel = "Date:";
    page.drawText(dateLabel, {
      x: contentLeft,
      y: cursorY,
      size: 10,
      font: fontBold,
      color: textColor,
    });
    const dateLabelWidth = fontBold.widthOfTextAtSize(dateLabel, 10);
    page.drawText(formatDate(order.createdAt), {
      x: contentLeft + dateLabelWidth + 6,
      y: cursorY,
      size: 10,
      font: fontRegular,
      color: mutedColor,
    });

    cursorY -= 18;
    drawDivider(cursorY);
    cursorY -= 20;

    const columnGap = 30;
    const columnWidth = (contentWidth - columnGap) / 2;
    const rightColumnX = contentLeft + columnWidth + columnGap;

    page.drawText("Invoice To:", {
      x: contentLeft,
      y: cursorY,
      size: 10,
      font: fontBold,
      color: textColor,
    });
    page.drawText("Pay To:", {
      x: rightColumnX,
      y: cursorY,
      size: 10,
      font: fontBold,
      color: textColor,
    });

    const addressLines = [
      order.shippingAddressSnapshot.addressLine1,
      order.shippingAddressSnapshot.addressLine2,
      [
        order.shippingAddressSnapshot.city,
        order.shippingAddressSnapshot.state,
        order.shippingAddressSnapshot.postalCode,
      ].filter(Boolean).join(", "),
      order.shippingAddressSnapshot.country,
    ].filter((line): line is string => Boolean(line));

    const leftLines = [order.shippingAddressSnapshot.fullName, ...addressLines];
    const rightLines = [
      "Gadget Wizard Pty Ltd",
      "123 Main Street",
      "Sydney, NSW 2000",
      "Australia",
      "support@gadgetwizard.com",
    ];

    const lineHeight = 12;
    let leftY = cursorY - 14;
    let rightY = cursorY - 14;
    const maxLines = Math.max(leftLines.length, rightLines.length);
    for (let i = 0; i < maxLines; i += 1) {
      if (leftLines[i]) {
        page.drawText(leftLines[i], {
          x: contentLeft,
          y: leftY,
          size: 9,
          font: fontRegular,
          color: mutedColor,
        });
      }
      if (rightLines[i]) {
        page.drawText(rightLines[i], {
          x: rightColumnX,
          y: rightY,
          size: 9,
          font: fontRegular,
          color: mutedColor,
        });
      }
      leftY -= lineHeight;
      rightY -= lineHeight;
    }

    cursorY = Math.min(leftY, rightY) - 4;
    drawDivider(cursorY);
    cursorY -= 18;

    const tableX = contentLeft;
    const tableWidth = contentWidth;
    const headerHeight = 22;
    const headerTopY = cursorY;

    page.drawRectangle({
      x: tableX,
      y: headerTopY - headerHeight,
      width: tableWidth,
      height: headerHeight,
      color: headerBg,
    });

    const headerTextY = headerTopY - 15;
    const colItemX = tableX + 8;
    const colDescX = tableX + 140;
    const colQtyRight = tableX + tableWidth - 155;
    const colPriceRight = tableX + tableWidth - 85;
    const colTotalRight = tableX + tableWidth - 10;

    page.drawText("Item", {
      x: colItemX,
      y: headerTextY,
      size: 9,
      font: fontBold,
      color: textColor,
    });
    page.drawText("Description", {
      x: colDescX,
      y: headerTextY,
      size: 9,
      font: fontBold,
      color: textColor,
    });
    drawRightAlignedText("Qty", colQtyRight, headerTextY, 9, fontBold, textColor);
    drawRightAlignedText("Price", colPriceRight, headerTextY, 9, fontBold, textColor);
    drawRightAlignedText("Total", colTotalRight, headerTextY, 9, fontBold, textColor);

    let rowY = headerTopY - headerHeight - 12;
    const rowHeight = 22;

    if (order.items.length === 0) {
      page.drawText("No items", {
        x: colItemX,
        y: rowY,
        size: 9,
        font: fontRegular,
        color: mutedColor,
      });
      rowY -= rowHeight;
    }

    for (const item of order.items) {
      const itemName = truncate(item.productName, 24);
      const description = truncate(item.productSku ?? "Standard item", 32);

      page.drawText(itemName, {
        x: colItemX,
        y: rowY,
        size: 9,
        font: fontRegular,
        color: mutedColor,
      });
      page.drawText(description, {
        x: colDescX,
        y: rowY,
        size: 9,
        font: fontRegular,
        color: mutedColor,
      });
      drawRightAlignedText(String(item.quantity), colQtyRight, rowY, 9, fontRegular, mutedColor);
      drawRightAlignedText(money(item.unitPrice, effectiveCurrency), colPriceRight, rowY, 9, fontRegular, mutedColor);
      drawRightAlignedText(money(item.totalPrice, effectiveCurrency), colTotalRight, rowY, 9, fontRegular, mutedColor);

      rowY -= rowHeight;
      page.drawLine({
        start: { x: tableX, y: rowY + 8 },
        end: { x: tableX + tableWidth, y: rowY + 8 },
        color: lineColor,
        thickness: 1,
      });
    }

    const infoBoxHeight = 56;
    const infoBoxY = rowY - 4 - infoBoxHeight;
    const summaryBoxWidth = 170;
    const summaryX = tableX + tableWidth - summaryBoxWidth;

    page.drawRectangle({
      x: tableX,
      y: infoBoxY,
      width: tableWidth,
      height: infoBoxHeight,
      borderColor: lineColor,
      borderWidth: 1,
    });
    page.drawLine({
      start: { x: summaryX, y: infoBoxY },
      end: { x: summaryX, y: infoBoxY + infoBoxHeight },
      color: lineColor,
      thickness: 1,
    });

    const additionalInfo = order.notes ?? "Please keep this invoice for your records.";
    const infoLines = wrapText(additionalInfo, 60).slice(0, 2);

    page.drawText("Additional Information:", {
      x: tableX + 8,
      y: infoBoxY + infoBoxHeight - 16,
      size: 9,
      font: fontBold,
      color: textColor,
    });

    let infoLineY = infoBoxY + infoBoxHeight - 30;
    for (const line of infoLines) {
      page.drawText(line, {
        x: tableX + 8,
        y: infoLineY,
        size: 9,
        font: fontRegular,
        color: mutedColor,
      });
      infoLineY -= 12;
    }

    const summaryTopY = infoBoxY + infoBoxHeight - 16;
    const rightEdge = tableX + tableWidth - 8;

    page.drawText("Subtotal", {
      x: summaryX + 8,
      y: summaryTopY,
      size: 9,
      font: fontBold,
      color: textColor,
    });
    drawRightAlignedText(money(order.subtotal, effectiveCurrency), rightEdge, summaryTopY, 9, fontBold, textColor);

    page.drawText("Tax", {
      x: summaryX + 8,
      y: summaryTopY - 18,
      size: 9,
      font: fontBold,
      color: textColor,
    });
    drawRightAlignedText(money(0, effectiveCurrency), rightEdge, summaryTopY - 18, 9, fontBold, textColor);

    const totalY = infoBoxY - 18;
    page.drawText("Total Amount", {
      x: summaryX + 8,
      y: totalY,
      size: 11,
      font: fontBold,
      color: textColor,
    });
    drawRightAlignedText(money(order.totalAmount, effectiveCurrency), rightEdge, totalY, 11, fontBold, textColor);

    const noteY = totalY - 40;
    const noteIconX = tableX + 8;
    const noteIconY = noteY + 2;

    page.drawRectangle({
      x: noteIconX,
      y: noteIconY,
      width: 14,
      height: 18,
      borderColor: mutedColor,
      borderWidth: 1,
    });
    page.drawLine({
      start: { x: noteIconX + 10, y: noteIconY + 18 },
      end: { x: noteIconX + 14, y: noteIconY + 14 },
      color: mutedColor,
      thickness: 1,
    });

    const noteText =
      "Here we can write additional notes for the client to get a better understanding of this invoice.";
    const noteLines = wrapText(noteText, 90).slice(0, 2);

    page.drawText("Note:", {
      x: noteIconX + 24,
      y: noteY + 8,
      size: 10,
      font: fontBold,
      color: textColor,
    });

    let noteLineY = noteY + 8;
    for (const line of noteLines) {
      page.drawText(line, {
        x: noteIconX + 70,
        y: noteLineY,
        size: 9,
        font: fontRegular,
        color: mutedColor,
      });
      noteLineY -= 12;
    }

    const pdfBytes = await doc.save();
    return new Response(Buffer.from(pdfBytes), {
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
