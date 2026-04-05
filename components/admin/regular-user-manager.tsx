"use client";

import { useMemo, useState } from "react";
import { Ban, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/client/api";
import type { AppUser } from "@/lib/client/types";
import { useAuthStore } from "@/lib/stores/auth-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RegularUserManagerProps {
  initialUsers: AppUser[];
}

export function RegularUserManager({ initialUsers }: RegularUserManagerProps) {
  const { token } = useAuthStore();
  const [items, setItems] = useState(initialUsers);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const stats = useMemo(
    () => ({
      active: items.filter((entry) => entry.isActive).length,
      banned: items.filter((entry) => !entry.isActive).length,
    }),
    [items],
  );

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
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Regular Users</CardTitle>
          <Badge variant="secondary">Total: {items.length}</Badge>
        </div>
        <p className="text-sm text-zinc-600">Active: {stats.active} | Banned: {stats.banned}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <p className="text-sm text-zinc-500">No regular users found.</p>}

        {items.map((userItem) => {
          const isBusy = busyUserId === userItem.id;

          return (
            <article key={userItem.id} className="rounded-lg border border-zinc-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-900">{userItem.name}</p>
                  <p className="text-sm text-zinc-600">{userItem.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">user</Badge>
                  <Badge variant={userItem.isActive ? "secondary" : "outline"} className={userItem.isActive ? "" : "border-red-200 bg-red-50 text-red-700"}>
                    {userItem.isActive ? "Active" : "Banned"}
                  </Badge>
                </div>
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                Reward Points: {userItem.rewardPoints} | Joined: {new Date(userItem.createdAt).toLocaleDateString()}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
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
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}
