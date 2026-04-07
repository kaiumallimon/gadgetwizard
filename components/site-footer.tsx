import Image from "next/image";
import Link from "next/link";
import { CreditCard, Headset, MapPin, Phone, ShieldCheck, Truck } from "lucide-react";

const quickShopLinks = [
  { href: "/", label: "Home" },
  { href: "/faqs", label: "FAQs" },
  { href: "/cart", label: "Cart" },
  { href: "/?auth=login", label: "Sign In" },
  { href: "/?auth=signup", label: "Create Account" },
];

const customerCareLinks = [
  { href: "/forgot-password", label: "Password Help" },
  { href: "/dashboard", label: "User Dashboard" },
  { href: "/admin", label: "Admin Console" },
  { href: "/admin/activity", label: "Order Activity" },
];

const companyLinks = [
  { href: "/about-us", label: "About GadgetWizard" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/", label: "Refund Guidelines" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-16 overflow-hidden bg-black text-zinc-300">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-0 h-64 w-64 rounded-full bg-[#f36523]/10 blur-3xl" />
        <div className="absolute right-0 top-12 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-8 border-b border-zinc-800/50 pb-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo-black-surfacce.svg"
                alt="GadgetWizard"
                width={308}
                height={60}
                style={{ width: "auto" }}
                className="h-11 w-auto sm:h-12"
              />
            </Link>
            <h2 className="max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Trusted gadgets, secure shopping, and support that actually responds.
            </h2>
            <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
              Buy smarter with a modern ecommerce platform built for speed, verified accounts, and transparent after-sales service.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl bg-zinc-900/55 p-3 ring-1 ring-zinc-700/40">
                <ShieldCheck className="h-4 w-4 text-orange-300" />
                <p className="mt-2 text-sm font-medium text-zinc-100">Secure Checkout</p>
              </article>
              <article className="rounded-2xl bg-zinc-900/55 p-3 ring-1 ring-zinc-700/40">
                <Truck className="h-4 w-4 text-orange-300" />
                <p className="mt-2 text-sm font-medium text-zinc-100">Fast Delivery</p>
              </article>
              <article className="rounded-2xl bg-zinc-900/55 p-3 ring-1 ring-zinc-700/40">
                <CreditCard className="h-4 w-4 text-orange-300" />
                <p className="mt-2 text-sm font-medium text-zinc-100">Easy Payments</p>
              </article>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-zinc-900/45 p-5 ring-1 ring-zinc-700/45">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-orange-300/60 to-transparent" />
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-300/10 blur-2xl" />

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Need Help?</p>
            <p className="mt-2 text-lg font-semibold text-white">Customer Support</p>
            <p className="mt-2 text-sm text-zinc-400">
              Our team is available every day to help with account access, product guidance, and order updates.
            </p>

            <div className="mt-5 space-y-2 text-sm">
              <p className="inline-flex w-full items-center gap-2 rounded-lg bg-zinc-900/70 px-3 py-2 text-zinc-200 ring-1 ring-zinc-700/40">
                <Phone className="h-4 w-4 text-orange-300" /> +880 1712-345678
              </p>
              <p className="inline-flex w-full items-center gap-2 rounded-lg bg-zinc-900/70 px-3 py-2 text-zinc-200 ring-1 ring-zinc-700/40">
                <Headset className="h-4 w-4 text-orange-300" /> support@gadgetwizard.com.au
              </p>
              <p className="inline-flex w-full items-center gap-2 rounded-lg bg-zinc-900/70 px-3 py-2 text-zinc-200 ring-1 ring-zinc-700/40">
                <MapPin className="h-4 w-4 text-orange-300" /> Dhaka, Bangladesh
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Quick Shop</p>
            <ul className="mt-3 space-y-2 text-sm">
              {quickShopLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-zinc-300 transition hover:pl-1 hover:text-orange-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Customer Care</p>
            <ul className="mt-3 space-y-2 text-sm">
              {customerCareLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-zinc-300 transition hover:pl-1 hover:text-orange-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Company</p>
            <ul className="mt-3 space-y-2 text-sm">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-zinc-300 transition hover:pl-1 hover:text-orange-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Business Hours</p>
            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              <p>Sat - Thu: 10:00 AM - 10:00 PM</p>
              <p>Friday: 3:00 PM - 10:00 PM</p>
              <p className="text-zinc-500">Live chat and email support are open during business hours.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800/50 bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {year} GadgetWizard. All rights reserved.</p>
          <p>Built for secure ecommerce, fast support, and modern account management.</p>
        </div>
      </div>
    </footer>
  );
}
