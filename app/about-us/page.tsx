import Link from "next/link";

const aboutSections = [
  {
    id: "who-we-are",
    title: "Who We Are",
    body: "Gadget Wizard is an Australia-focused technology e-commerce store built for customers who value genuine products, transparent pricing, and reliable support. We serve students, professionals, creators, and everyday users looking for trusted devices and accessories in one place.",
  },
  {
    id: "what-we-offer",
    title: "What We Offer",
    body: "Our catalog includes smartphones, tablets, wearables, audio devices, MacBook accessories, charging essentials, and protection gear. We curate products from globally recognized brands and prioritize quality, compatibility, and long-term reliability.",
  },
  {
    id: "customer-experience",
    title: "Customer Experience",
    body: "From product discovery to post-purchase guidance, we design every step to be smooth and responsive. Customers can expect clear communication, practical recommendations, and support for delivery, warranty, and usage questions.",
  },
  {
    id: "our-promise",
    title: "Our Promise",
    body: "We are committed to authentic inventory, fair policies, and continuous service improvement. Gadget Wizard exists to make modern technology accessible, dependable, and enjoyable for Australian lifestyles.",
  },
];

export const dynamic = "force-dynamic";

export default function AboutUsPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
        <header className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-50 via-white to-amber-50 p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-orange-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-amber-200/40 blur-3xl" />

          <div className="relative space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Company</p>
            <h1 className="text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl">
              About
              <span className="bg-linear-to-r from-(--accent) via-orange-400 to-amber-400 bg-clip-text text-transparent"> Gadget Wizard</span>
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-zinc-600 sm:text-base">
              Australia's trusted destination for modern gadgets, accessories, and responsive customer support.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href="/" className="rounded-full bg-(--accent) px-4 py-2 text-sm font-semibold text-white hover:brightness-95">
                Back Home
              </Link>
              <Link href="/faqs" className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-white">
                Visit FAQs
              </Link>
            </div>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2">
          {aboutSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
            >
              {section.title}
            </a>
          ))}
        </nav>

        <section className="space-y-8">
          {aboutSections.map((section) => (
            <article key={section.id} id={section.id} className="scroll-mt-24 border-l-2 border-orange-100 pl-4 sm:pl-6">
              <h2 className="text-2xl font-semibold text-zinc-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-base">{section.body}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
