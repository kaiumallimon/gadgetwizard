import Link from "next/link";
import { redirect } from "next/navigation";

import { FaqManager } from "@/components/admin/faq-manager";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminFaqs } from "@/lib/server/services/faq-service";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const faqs = await getAdminFaqs();

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">FAQ Management</h1>
        <p className="mt-2 text-sm text-zinc-600">Create and maintain frequently asked questions shown on the public FAQ page.</p>
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
                <BreadcrumbPage>FAQs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <FaqManager initialFaqs={faqs} />
    </div>
  );
}
