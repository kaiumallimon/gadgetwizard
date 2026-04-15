"use client";

import { useMemo, useState } from "react";
import { Ban, CheckCircle2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { AppUser } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RegularUserManagerProps {
  initialUsers: AppUser[];
}

export function RegularUserManager({ initialUsers }: RegularUserManagerProps) {
  const { token } = useAuthStore();
  const [items, setItems] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const stats = useMemo(
    () => ({
      active: items.filter((entry) => entry.isActive).length,
      banned: items.filter((entry) => !entry.isActive).length,
    }),
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

  async function handleToggleBan(userItem: AppUser) {
    const nextActive = !userItem.isActive;

    const confirmed = window.confirm(
      nextActive
        ? `Unban ${userItem.name}? They will be able to login again.`
        : `Ban ${userItem.name}? They will not be able to login again.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyUserId(userItem.id);
      const response = await apiClient.adminUpdateRegularUserStatus(
        userItem.id,
        { isActive: nextActive },
        token ?? undefined,
      );

      setItems((previous) =>
        previous.map((entry) => (entry.id === userItem.id ? response.item : entry)),
      );
      toast.success(nextActive ? "User unbanned" : "User banned");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update user status";
      toast.error(message);
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Regular Users</CardTitle>
          <Badge variant="secondary">Total: {items.length}</Badge>
        </div>
        <p className="text-sm text-zinc-600">Active: {stats.active} | Banned: {stats.banned}</p>
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
          <p className="text-sm text-zinc-500">No regular users found for this search.</p>
        ) : (
          <div className="rounded-lg border border-zinc-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Reward Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((userItem) => {
                  const isBusy = busyUserId === userItem.id;

                  return (
                    <TableRow key={userItem.id}>
                      <TableCell className="font-medium text-zinc-900">{userItem.name}</TableCell>
                      <TableCell className="text-zinc-700">{userItem.email}</TableCell>
                      <TableCell className="text-zinc-700">{userItem.rewardPoints}</TableCell>
                      <TableCell>
                        <Badge variant={userItem.isActive ? "secondary" : "outline"} className={userItem.isActive ? "" : "border-red-200 bg-red-50 text-red-700"}>
                          {userItem.isActive ? "Active" : "Banned"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-600">{new Date(userItem.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={userItem.isActive ? "destructive" : "outline"}
                            onClick={() => handleToggleBan(userItem)}
                            disabled={isBusy}
                          >
                            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : userItem.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            {userItem.isActive ? "Ban User" : "Unban User"}
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
  );
}
