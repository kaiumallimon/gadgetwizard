import Link from "next/link";
import { FiCompass, FiHome } from "react-icons/fi";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-2xl bg-linear-to-br from-orange-50/70 via-white to-amber-50/50 p-6 text-center sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
          <FiCompass className="h-8 w-8 text-(--accent)" />
        </div>
        <p className="mt-5 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Page not found</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">404</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-zinc-600 sm:text-base">
          We couldn&apos;t find the page you were looking for. It may have been moved, renamed, or never existed.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            <FiHome className="h-4 w-4" /> Back to Home
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
