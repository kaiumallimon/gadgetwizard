import Link from "next/link";

const policySections = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    points: [
      "Contact details such as name, email address, phone number, and delivery address.",
      "Account and authentication data needed to secure your profile and orders.",
      "Order, cart, and product interaction details to process purchases and improve service quality.",
      "Technical signals like browser/device data for security, performance monitoring, and analytics.",
    ],
  },
  {
    id: "how-we-use-information",
    title: "How We Use Information",
    points: [
      "To fulfill orders, coordinate delivery, and provide post-purchase assistance.",
      "To manage account access, authentication sessions, and fraud prevention workflows.",
      "To improve catalog relevance, website experience, and support response quality.",
      "To send transactional updates and important policy or service notices.",
    ],
  },
  {
    id: "sharing-and-disclosure",
    title: "Sharing And Disclosure",
    points: [
      "We share only what is necessary with trusted logistics, payment, and infrastructure partners.",
      "We do not sell personal data to third parties for unrelated advertising purposes.",
      "Data may be disclosed when required by legal obligations or to protect platform security.",
    ],
  },
  {
    id: "data-security",
    title: "Data Security",
    points: [
      "We use layered controls such as access restrictions, encrypted transport, and operational safeguards.",
      "Only authorized personnel and systems can access protected customer information.",
      "Security controls are reviewed continuously to reduce risk and improve resilience.",
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights",
    points: [
      "You may request account data updates or corrections when information is inaccurate.",
      "You may request support for account access, password recovery, and profile management.",
      "For privacy questions, please contact support so we can review and address your request.",
    ],
  },
];

export const dynamic = "force-dynamic";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
        <header className="rounded-3xl bg-linear-to-br from-zinc-50 via-white to-orange-50 p-6 sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Legal</p>
          <h1 className="mt-2 text-4xl font-semibold text-zinc-900 sm:text-5xl">Privacy Policy</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            This Privacy Policy explains how Gadget Wizard collects, uses, protects, and manages personal information when you use our website and services.
          </p>
          <p className="mt-2 text-xs font-medium text-zinc-500">Last updated: April 2026</p>
          <div className="mt-4">
            <Link href="/" className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-white">
              Back Home
            </Link>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-2 lg:sticky lg:top-24 lg:h-fit">
            {policySections.map((section) => (
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
            {policySections.map((section) => (
              <article key={section.id} id={section.id} className="scroll-mt-24 space-y-3">
                <h2 className="text-2xl font-semibold text-zinc-900">{section.title}</h2>
                <ul className="space-y-2 text-sm leading-relaxed text-zinc-600 sm:text-base">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
