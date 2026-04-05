"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2, Power, ShieldPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { AppUser } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminUserManagerProps {
  initialUsers: AppUser[];
}

export function AdminUserManager({ initialUsers }: AdminUserManagerProps) {
  const { token, user } = useAuthStore();
  const [items, setItems] = useState(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const activeAdminCount = useMemo(
    () => items.filter((entry) => entry.isActive).length,
    [items],
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      toast.error("Name and email are required");
      return;
    }

    try {
      setIsCreating(true);
      const response = await apiClient.adminCreateAdminUser(
        {
          name: trimmedName,
          email: trimmedEmail,
        },
        token ?? undefined,
      );

      setItems((previous) => [response.item, ...previous]);
      setName("");
      setEmail("");
      toast.success("Admin account created");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create admin account";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleStatus(adminUser: AppUser) {
    const nextStatus = !adminUser.isActive;

    if (!nextStatus && adminUser.id === user?.id) {
      toast.error("You cannot deactivate your own admin account");
      return;
    }

    try {
      setBusyUserId(adminUser.id);
      const response = await apiClient.adminUpdateAdminUserStatus(
        adminUser.id,
        { isActive: nextStatus },
        token ?? undefined,
      );

      setItems((previous) =>
        previous.map((entry) => (entry.id === adminUser.id ? response.item : entry)),
      );
      toast.success(nextStatus ? "Admin account activated" : "Admin account deactivated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update admin account";
      toast.error(message);
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleDelete(adminUser: AppUser) {
    if (adminUser.id === user?.id) {
      toast.error("You cannot delete your own admin account");
      return;
    }

    const confirmed = window.confirm(`Delete admin account for ${adminUser.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      setBusyUserId(adminUser.id);
      await apiClient.adminDeleteAdminUser(adminUser.id, token ?? undefined);
      setItems((previous) => previous.filter((entry) => entry.id !== adminUser.id));
      toast.success("Admin account deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete admin account";
      toast.error(message);
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create Admin Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleCreate}>
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Name</p>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Admin Name"
                disabled={isCreating}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Email</p>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                disabled={isCreating}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldPlus className="h-4 w-4" />} Create Admin
            </Button>
          </form>

          <p className="mt-3 text-xs text-zinc-500">
            Created admins become active immediately. They can sign in once their Firebase login uses the same email.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Admin Accounts</CardTitle>
            <Badge variant="secondary">Total: {items.length}</Badge>
          </div>
          <p className="text-sm text-zinc-600">Active: {activeAdminCount} | Inactive: {items.length - activeAdminCount}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && <p className="text-sm text-zinc-500">No admin accounts found.</p>}

          {items.map((adminUser) => {
            const isBusy = busyUserId === adminUser.id;
            const isSelf = adminUser.id === user?.id;
            const disablingLastActiveAdmin = adminUser.isActive && activeAdminCount <= 1;

            return (
              <article key={adminUser.id} className="rounded-lg border border-zinc-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-900">{adminUser.name}</p>
                    <p className="text-sm text-zinc-600">{adminUser.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>admin</Badge>
                    <Badge variant={adminUser.isActive ? "secondary" : "outline"}>
                      {adminUser.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <p className="mt-2 text-xs text-zinc-500">
                  Joined: {new Date(adminUser.createdAt).toLocaleDateString()}
                  {isSelf ? " | This is your account" : ""}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(adminUser)}
                    disabled={isBusy || (isSelf && adminUser.isActive) || disablingLastActiveAdmin}
                  >
                    {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                    {adminUser.isActive ? "Deactivate" : "Activate"}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(adminUser)}
                    disabled={isBusy || isSelf || disablingLastActiveAdmin}
                  >
                    {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
                  </Button>
                </div>
              </article>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
