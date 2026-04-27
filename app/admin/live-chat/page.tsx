import Link from "next/link";

import { AdminLiveChatManager } from "@/components/admin/admin-live-chat-manager";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { requireServerRole } from "@/lib/server/auth/server-session";
import { getChatConversationsForSession } from "@/lib/server/services/chat-service";

export const dynamic = "force-dynamic";

export default async function AdminLiveChatPage() {
  const session = await requireServerRole(["admin"]);

  const conversations = await getChatConversationsForSession(session, {
    page: 1,
    pageSize: 50,
  });

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Live Chat Inbox</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Respond to customer conversations in real time. Messages, read states, and typing indicators update instantly.
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
                <BreadcrumbPage>Live Chat</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <AdminLiveChatManager initialConversations={conversations.items} />
    </div>
  );
}