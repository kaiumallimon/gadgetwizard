import Link from "next/link";

import { getPublicFaqs } from "@/lib/server/services/faq-service";

export const dynamic = "force-dynamic";

export default async function FaqsPage() {
  const faqs = await getPublicFaqs();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header className="rounded-2xl bg-linear-to-br from-orange-50/70 via-white to-amber-50/50 p-5 sm:p-7">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Support Center</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900 sm:text-4xl">Frequently Asked Questions</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 sm:text-base">
          Find quick answers about orders, products, delivery, warranty, and account support.
        </p>
        <div className="mt-4">
          <Link href="/" className="inline-flex rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white">
            Back to Home
          </Link>
        </div>
      </header>

      {faqs.length === 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-600">
          FAQs are being prepared. Please check back shortly.
        </section>
      ) : (
        <section className="space-y-3">
          {faqs.map((faq, index) => (
            <details
              key={faq.id}
              className="group rounded-xl border border-zinc-200 bg-white p-4 open:bg-zinc-50/70"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-100 px-2 text-xs font-semibold text-(--accent)">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-base font-semibold text-zinc-900">{faq.question}</span>
              </summary>
              <p className="pl-9 pt-3 text-sm leading-relaxed text-zinc-600">{faq.answer}</p>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
