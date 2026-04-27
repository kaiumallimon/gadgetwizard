import { randomUUID } from "node:crypto";

import type { ChatRealtimeEvent } from "@/lib/client/types";
import type { AuthSession, UserRole } from "@/lib/server/types";

interface ChatRealtimeClient {
  id: string;
  session: AuthSession;
  controller: ReadableStreamDefaultController<Uint8Array>;
  heartbeatTimer: ReturnType<typeof setInterval>;
}

interface ChatRealtimeHub {
  clients: Map<string, ChatRealtimeClient>;
  encoder: TextEncoder;
}

declare global {
  var __gadgetwizardChatRealtimeHub: ChatRealtimeHub | undefined;
}

function getHub(): ChatRealtimeHub {
  if (globalThis.__gadgetwizardChatRealtimeHub) {
    return globalThis.__gadgetwizardChatRealtimeHub;
  }

  globalThis.__gadgetwizardChatRealtimeHub = {
    clients: new Map<string, ChatRealtimeClient>(),
    encoder: new TextEncoder(),
  };

  return globalThis.__gadgetwizardChatRealtimeHub;
}

function toSseData(event: ChatRealtimeEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function sendEvent(client: ChatRealtimeClient, event: ChatRealtimeEvent): void {
  try {
    client.controller.enqueue(getHub().encoder.encode(toSseData(event)));
  } catch {
    removeClientById(client.id);
  }
}

function sendHeartbeat(client: ChatRealtimeClient): void {
  try {
    client.controller.enqueue(getHub().encoder.encode(": ping\n\n"));
  } catch {
    removeClientById(client.id);
  }
}

function removeClientById(clientId: string): void {
  const hub = getHub();
  const client = hub.clients.get(clientId);
  if (!client) {
    return;
  }

  clearInterval(client.heartbeatTimer);
  hub.clients.delete(clientId);

  if (activeConnectionsForUser(client.session.userId, client.session.role) === 0) {
    publishPresence(client.session, false);
  }
}

function activeConnectionsForUser(userId: number, role: UserRole): number {
  let count = 0;
  for (const client of getHub().clients.values()) {
    if (client.session.userId === userId && client.session.role === role) {
      count += 1;
    }
  }

  return count;
}

function publishPresence(session: AuthSession, isOnline: boolean): void {
  publishChatRealtimeEvent(
    {
      type: "presence.updated",
      userId: session.userId,
      role: session.role,
      isOnline,
    },
    {
      includeAllAdmins: true,
      userIds: [session.userId],
    },
  );
}

export function createChatEventStream(session: AuthSession): ReadableStream<Uint8Array> {
  const hub = getHub();
  let activeClientId: string | null = null;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const clientId = randomUUID();
      activeClientId = clientId;
      const heartbeatTimer = setInterval(() => {
        const client = hub.clients.get(clientId);
        if (!client) {
          clearInterval(heartbeatTimer);
          return;
        }

        sendHeartbeat(client);
      }, 15000);

      hub.clients.set(clientId, {
        id: clientId,
        session,
        controller,
        heartbeatTimer,
      });

      sendEvent(
        {
          id: clientId,
          session,
          controller,
          heartbeatTimer,
        },
        {
          type: "connected",
          userId: session.userId,
          role: session.role,
        },
      );

      if (activeConnectionsForUser(session.userId, session.role) === 1) {
        publishPresence(session, true);
      }
    },
    cancel() {
      if (activeClientId) {
        removeClientById(activeClientId);
        activeClientId = null;
      }
    },
  });
}

export function publishChatRealtimeEvent(
  event: ChatRealtimeEvent,
  input: {
    userIds?: number[];
    includeAllAdmins?: boolean;
    excludeUserId?: number;
  } = {},
): void {
  const userIdSet = new Set(input.userIds ?? []);

  for (const client of getHub().clients.values()) {
    if (input.excludeUserId && client.session.userId === input.excludeUserId) {
      continue;
    }

    const isTargetedUser = userIdSet.size > 0 && userIdSet.has(client.session.userId);
    const isAdminBroadcast = input.includeAllAdmins === true && client.session.role === "admin";

    if (!isTargetedUser && !isAdminBroadcast) {
      continue;
    }

    sendEvent(client, event);
  }
}

export function disconnectChatSession(session: AuthSession): void {
  const hub = getHub();
  const disconnectedIds: string[] = [];

  for (const client of hub.clients.values()) {
    if (client.session.userId !== session.userId || client.session.role !== session.role) {
      continue;
    }

    clearInterval(client.heartbeatTimer);
    disconnectedIds.push(client.id);
  }

  for (const id of disconnectedIds) {
    hub.clients.delete(id);
  }

  if (activeConnectionsForUser(session.userId, session.role) === 0) {
    publishPresence(session, false);
  }
}