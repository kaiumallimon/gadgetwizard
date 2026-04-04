import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/server/auth/server-session";
import { getCurrentUser } from "@/lib/server/services/auth-service";
import { getCartForUser } from "@/lib/server/services/cart-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const [user, cart] = await Promise.all([getCurrentUser(session.userId), getCartForUser(session.userId)]);

  const cartItemCount = cart.items.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">User Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Welcome back, {user.name}</h1>
        <p className="mt-2 text-(--muted)">Reward points: {user.rewardPoints}. Reach 100 points to unlock loyalty pricing.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-(--muted)">Role</p>
          <p className="text-xl font-semibold text-white">{user.role}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-(--muted)">Cart Items</p>
          <p className="text-xl font-semibold text-white">{cartItemCount}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-(--muted)">Purchase History</p>
          <p className="text-base font-medium text-amber-300">Coming soon</p>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/cart" className="rounded-full bg-(--accent) px-5 py-2 font-medium text-black">
            Manage Cart
          </Link>
          {user.role === "admin" && (
            <Link href="/admin" className="rounded-full border border-white/20 px-5 py-2 font-medium text-white">
              Open Admin Dashboard
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
