import Link from "next/link";
import { redirect } from "next/navigation";

import { NewsletterManager } from "@/components/admin/newsletter-manager";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getNewsletterAdminSummary } from "@/lib/server/services/newsletter-service";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const summary = await getNewsletterAdminSummary();

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Newsletter Campaigns</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Send premium newsletter campaigns to subscribed customers using rich content and CDN-hosted visuals.
        </p>

        <div className="mt-3 border-t border-zinc-200 pt-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Newsletter</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <NewsletterManager initialSummary={summary} />
    </div>
  );
}
