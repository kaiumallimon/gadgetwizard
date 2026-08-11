"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2, Power, Search, ShieldPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { AppUser } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AdminUserManagerProps {
  initialUsers: AppUser[];
  currentUserId: number;
}

export function AdminUserManager({ initialUsers, currentUserId }: AdminUserManagerProps) {
  const { token, user } = useAuthStore();
  const [items, setItems] = useState(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const activeAdminCount = useMemo(
    () => items.filter((entry) => entry.isActive).length,
    [items],
  );

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return items;
    }

    return items.filter(
      (entry) =>
        entry.name.toLowerCase().includes(term) ||
        entry.email.toLowerCase().includes(term),
    );
  }, [items, search]);

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
    const effectiveCurrentUserId = user?.id ?? currentUserId;

    if (!nextStatus && adminUser.id === effectiveCurrentUserId) {
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
    const effectiveCurrentUserId = user?.id ?? currentUserId;

    if (adminUser.id === effectiveCurrentUserId) {
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
    <div className="grid items-start gap-6 xl:grid-cols-[360px_1fr]">
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
                minLength={2}
                maxLength={120}
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
            Created admins receive a secure email with temporary login credentials on creation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Admin Accounts</CardTitle>
            <Badge variant="secondary">Total: {items.length}</Badge>
          </div>
          <p className="text-sm text-zinc-600">Active: {activeAdminCount} | Inactive: {items.length - activeAdminCount}</p>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredItems.length === 0 ? (
            <p className="text-sm text-zinc-500">No admin accounts found for this search.</p>
          ) : (
            <div className="rounded-lg border border-zinc-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((adminUser) => {
                    const isBusy = busyUserId === adminUser.id;
                    const effectiveCurrentUserId = user?.id ?? currentUserId;
                    const isSelf = adminUser.id === effectiveCurrentUserId;
                    const disablingLastActiveAdmin = adminUser.isActive && activeAdminCount <= 1;

                    return (
                      <TableRow key={adminUser.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-zinc-900">{adminUser.name}</p>
                            {isSelf && <Badge variant="outline">You</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-700">{adminUser.email}</TableCell>
                        <TableCell>
                          <Badge variant={adminUser.isActive ? "secondary" : "outline"}>
                            {adminUser.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-600">{new Date(adminUser.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
