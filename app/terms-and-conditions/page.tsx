import Link from "next/link";

const termsSections = [
  {
    id: "acceptance",
    title: "Acceptance Of Terms",
    body: "By accessing or purchasing through Gadget Wizard, you agree to these Terms and Conditions. If you do not agree with any section, please discontinue use of the platform.",
  },
  {
    id: "orders-and-pricing",
    title: "Orders And Pricing",
    body: "Product pricing, availability, and promotional offers may change without prior notice. Orders are confirmed only after successful processing and system validation.",
  },
  {
    id: "product-information",
    title: "Product Information",
    body: "We strive to keep listings accurate, including descriptions, specifications, and images. Minor differences may occur due to supplier updates, display variations, or packaging changes.",
  },
  {
    id: "shipping-and-delivery",
    title: "Shipping And Delivery",
    body: "Delivery times are estimated and may vary by location, courier capacity, or external disruptions. Gadget Wizard is not liable for delays caused by third-party logistics providers beyond our direct control.",
  },
  {
    id: "returns-and-warranty",
    title: "Returns And Warranty",
    body: "Return and warranty support are subject to product eligibility, condition checks, and policy windows. Customers should retain invoices and packaging where applicable for faster processing.",
  },
  {
    id: "account-responsibility",
    title: "Account Responsibility",
    body: "You are responsible for safeguarding account credentials and session access. Any suspicious account activity should be reported to support immediately.",
  },
  {
    id: "limitation-of-liability",
    title: "Limitation Of Liability",
    body: "To the fullest extent allowed by law, Gadget Wizard is not liable for indirect, incidental, or consequential damages arising from service use, except where statutory protections apply.",
  },
  {
    id: "policy-updates",
    title: "Policy Updates",
    body: "These Terms may be updated to reflect legal, operational, or product changes. Continued use of the platform after updates indicates acceptance of the revised Terms.",
  },
];

export const dynamic = "force-dynamic";

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
        <header className="rounded-3xl bg-linear-to-br from-amber-50/70 via-white to-orange-50/70 p-6 sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Legal</p>
          <h1 className="mt-2 text-4xl font-semibold text-zinc-900 sm:text-5xl">Terms And Conditions</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            These Terms describe the rules, responsibilities, and conditions for using Gadget Wizard services and placing orders through our platform.
          </p>
          <p className="mt-2 text-xs font-medium text-zinc-500">Last updated: April 2026</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/" className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-white">
              Back Home
            </Link>
            <Link href="/privacy-policy" className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Privacy Policy
            </Link>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-2 lg:sticky lg:top-24 lg:h-fit">
            {termsSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                {section.title}
              </a>
            ))}
          </aside>

          <div className="space-y-8">
            {termsSections.map((section, index) => (
              <article key={section.id} id={section.id} className="scroll-mt-24 border-l-2 border-zinc-100 pl-4 sm:pl-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Section {index + 1}</p>
                <h2 className="mt-1 text-2xl font-semibold text-zinc-900">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-base">{section.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
