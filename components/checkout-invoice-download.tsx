"use client";

import { useRef, useState } from "react";

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

export function CheckoutInvoiceDownload({ order }: CheckoutInvoiceDownloadProps) {
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!invoiceRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = (html2pdfModule.default ?? html2pdfModule) as any;
      const options = {
        margin: [0.35, 0.35, 0.35, 0.35],
        filename: `invoice-order-${order.id}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };

      await html2pdf().from(invoiceRef.current).set(options).save();
    } finally {
      setDownloading(false);
    }
  }

  const subtotal = order.subtotal;
  const shipping = order.shippingAmount;
  const tax = 0;
  const total = order.totalAmount;
  const address = order.shippingAddressSnapshot;

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

      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <div ref={invoiceRef} className="w-[794px] bg-white px-10 py-10 text-zinc-900">
          <div className="border border-zinc-300 p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase text-orange-600">Gadget Wizard</p>
                <p className="mt-2 text-sm font-semibold">Gadget Wizard Pty Ltd</p>
                <p className="text-xs text-zinc-600">123 Main Street</p>
                <p className="text-xs text-zinc-600">Sydney, NSW 2000</p>
                <p className="text-xs text-zinc-600">(321) 456-7890</p>
                <p className="text-xs text-zinc-600">support@gadgetwizard.com</p>
              </div>
              <div className="min-w-[220px] rounded border border-zinc-300">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-3 py-2 text-[11px] font-semibold uppercase text-zinc-600">
                  <span>Date</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-[11px] font-semibold uppercase text-zinc-600">
                  <span>Receipt No.</span>
                  <span>GW-{order.id}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase text-zinc-600">
                  <span>Customer No.</span>
                  <span>{order.userId}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6 text-xs text-zinc-700">
              <div>
                <p className="text-[11px] font-semibold uppercase text-zinc-500">Bill To</p>
                <p className="mt-2 text-sm font-semibold text-zinc-900">{address.fullName}</p>
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>{[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}</p>
                <p>{address.country}</p>
                <p>{address.phone}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-zinc-500">Payment</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Method</span>
                    <span className="font-semibold text-zinc-900">Card</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="font-semibold text-zinc-900">Paid</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Reference</span>
                    <span className="font-semibold text-zinc-900">{order.stripePaymentIntentId ?? "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border border-zinc-300">
              <div className="grid grid-cols-[1fr_80px_90px_90px] border-b border-zinc-200 bg-zinc-100 text-[11px] font-semibold uppercase text-zinc-500">
                <div className="px-3 py-2">Description</div>
                <div className="px-3 py-2 text-right">Qty</div>
                <div className="px-3 py-2 text-right">Unit Price</div>
                <div className="px-3 py-2 text-right">Total</div>
              </div>
              <div className="divide-y divide-zinc-200 text-xs">
                {order.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_80px_90px_90px]">
                    <div className="px-3 py-2">
                      <p className="font-semibold text-zinc-900">{item.productName}</p>
                      {item.productSku && <p className="text-[11px] text-zinc-500">SKU: {item.productSku}</p>}
                    </div>
                    <div className="px-3 py-2 text-right">{item.quantity}</div>
                    <div className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</div>
                    <div className="px-3 py-2 text-right">
                      {formatCurrency(item.totalPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-[260px] border border-zinc-300 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-3 py-2">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
                  <span>Tax</span>
                  <span className="font-semibold text-zinc-900">{formatCurrency(tax)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2">
                  <span>Shipping</span>
                  <span className="font-semibold text-zinc-900">{formatCurrency(shipping)}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-zinc-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-zinc-500">
              <p className="text-sm font-semibold text-zinc-900">Thank you</p>
              <p>Please contact support if you have questions about this receipt.</p>
              <p className="mt-2 text-[11px] text-orange-600">www.gadgetwizard.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
