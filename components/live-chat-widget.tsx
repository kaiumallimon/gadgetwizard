"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { ChevronDown, Loader2, MessageCircle, SendHorizontal, Wifi, WifiOff } from "lucide-react";

import { ApiError, apiClient } from "@/lib/client/api";
import type {
  ChatConversation,
  ChatConversationSourceType,
  ChatMessage,
  ChatRealtimeEvent,
} from "@/lib/client/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

interface LiveChatWidgetProps {
  sourceType?: ChatConversationSourceType;
  sourceRef?: string | null;
}

interface QueuedMessage {
  id: string;
  body: string;
  createdAt: string;
}

const COMPOSER_LIMIT = 100;

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveRealtimeStatus(input: {
  isOnline: boolean;
  isConnected: boolean;
  isOpen: boolean;
}): { label: string; toneClass: string; icon: ComponentType<{ className?: string }> } {
  if (!input.isOnline) {
    return {
      label: "Offline mode: messages will be queued",
      toneClass: "text-amber-700 bg-amber-50 border-amber-200",
      icon: WifiOff,
    };
  }

  if (!input.isOpen) {
    return {
      label: "Ready",
      toneClass: "text-zinc-600 bg-zinc-50 border-zinc-200",
      icon: Wifi,
    };
  }

  if (input.isConnected) {
    return {
      label: "Connected",
      toneClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
      icon: Wifi,
    };
  }

  return {
    label: "Reconnecting...",
    toneClass: "text-orange-700 bg-orange-50 border-orange-200",
    icon: WifiOff,
  };
}

export function LiveChatWidget({
  sourceType = "home",
  sourceRef = null,
}: LiveChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [viewerRole, setViewerRole] = useState<"guest" | "user" | "admin">("guest");
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const [composer, setComposer] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const flushInProgressRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const activeConversation = useMemo(
    () => conversations.find((entry) => entry.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const realtimeStatus = resolveRealtimeStatus({
    isOnline,
    isConnected: isRealtimeConnected,
    isOpen: open,
  });
  const RealtimeStatusIcon = realtimeStatus.icon;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const sync = () => {
      setIsMobile(mediaQuery.matches);
      setIsOnline(window.navigator.onLine);
    };

    sync();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    mediaQuery.addEventListener("change", sync);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      mediaQuery.removeEventListener("change", sync);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const markConversationAsRead = useCallback(async (conversationId: number) => {
    try {
      await apiClient.markChatConversationRead(conversationId);
    } catch {
      // best-effort read acknowledgement
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await apiClient.getChatUnreadCount();
      setChatUnreadCount(response.count);
    } catch {
      // best effort; badge is informational only
    }
  }, []);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  const refreshConversations = useCallback(
    async (ensureConversation = false): Promise<ChatConversation[]> => {
      try {
        const response = await apiClient.getChatConversations({ page: 1, pageSize: 20 });
        let items = response.items;

        if (ensureConversation && viewerRole === "user" && items.length === 0) {
          const created = await apiClient.createChatConversation({
            sourceType,
            sourceRef,
          });
          items = [created.item];
        }

        setConversations(items);
        setErrorMessage(null);
        void refreshUnreadCount();

        setActiveConversationId((previous) => {
          if (previous && items.some((entry) => entry.id === previous)) {
            return previous;
          }

          return items[0]?.id ?? null;
        });

        return items;
      } catch {
        setErrorMessage("Unable to refresh conversations right now.");
        return [];
      }
    },
    [refreshUnreadCount, sourceRef, sourceType, viewerRole],
  );

  const refreshMessages = useCallback(
    async (
      conversationId: number,
      options: { markRead?: boolean; showLoader?: boolean } = {},
    ) => {
      const { markRead = true, showLoader = true } = options;

      if (showLoader) {
        setIsLoadingMessages(true);
      }

      try {
        const response = await apiClient.getChatMessages(conversationId, { page: 1, pageSize: 80 });
        setMessages(response.items);

        setConversations((previous) =>
          previous.map((entry) => (entry.id === response.conversation.id ? response.conversation : entry)),
        );
        setErrorMessage(null);
        void refreshUnreadCount();

        if (markRead && response.conversation.unreadCount > 0) {
          await markConversationAsRead(conversationId);
        }
      } catch {
        setErrorMessage("Unable to refresh messages right now.");
      } finally {
        if (showLoader) {
          setIsLoadingMessages(false);
        }
      }
    },
    [markConversationAsRead, refreshUnreadCount],
  );

  const bootstrap = useCallback(async () => {
    setIsBootstrapping(true);
    try {
      const me = await apiClient.getMe();
      setViewerRole(me.session.role);
      setAuthChecked(true);

      if (me.session.role !== "user") {
        return;
      }

      await refreshConversations(true);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setViewerRole("guest");
        setAuthChecked(true);
        return;
      }

      setErrorMessage("Live chat is temporarily unavailable.");
      setAuthChecked(true);
    } finally {
      setIsBootstrapping(false);
    }
  }, [refreshConversations]);

  useEffect(() => {
    if (!open || authChecked) {
      return;
    }

    void bootstrap();
  }, [authChecked, bootstrap, open]);

  useEffect(() => {
    if (!open || viewerRole !== "user") {
      return;
    }

    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    void refreshMessages(activeConversationId, { markRead: true, showLoader: true });
  }, [activeConversationId, open, refreshMessages, viewerRole]);

  useEffect(() => {
    if (viewerRole !== "user") {
      return;
    }

    const stream = new EventSource("/api/chat/stream");

    stream.onopen = () => setIsRealtimeConnected(true);
    stream.onerror = () => setIsRealtimeConnected(false);
    stream.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ChatRealtimeEvent;

        if (payload.type === "typing.updated") {
          setConversations((previous) =>
            previous.map((entry) =>
              entry.id === payload.conversationId
                ? {
                  ...entry,
                  isOtherParticipantTyping: payload.byRole === "admin" ? payload.isTyping : entry.isOtherParticipantTyping,
                }
                : entry,
            ),
          );
          return;
        }

        if (payload.type === "conversation.created") {
          void refreshConversations(false);
          void refreshUnreadCount();
          return;
        }

        if (payload.type === "message.created") {
          void refreshConversations(false);
          void refreshUnreadCount();

          if (activeConversationId && payload.conversationId === activeConversationId) {
            void refreshMessages(activeConversationId, { markRead: true, showLoader: false });
          }
          return;
        }

        if (payload.type === "messages.read") {
          void refreshUnreadCount();

          if (activeConversationId && payload.conversationId === activeConversationId) {
            void refreshMessages(activeConversationId, { markRead: false, showLoader: false });
          }
        }
      } catch {
        // ignore malformed payloads
      }
    };

    return () => {
      setIsRealtimeConnected(false);
      stream.close();
    };
  }, [activeConversationId, open, refreshConversations, refreshMessages, refreshUnreadCount, viewerRole]);

  const stopTyping = useCallback(async () => {
    if (!activeConversationId || !isTypingRef.current) {
      return;
    }

    isTypingRef.current = false;
    try {
      await apiClient.setChatTyping(activeConversationId, false);
    } catch {
      // best effort
    }
  }, [activeConversationId]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      void stopTyping();
    };
  }, [stopTyping]);

  useEffect(() => {
    if (!open || viewerRole !== "user" || !isOnline || !isRealtimeConnected || !activeConversationId || queuedMessages.length === 0) {
      return;
    }

    if (flushInProgressRef.current) {
      return;
    }

    flushInProgressRef.current = true;

    const flush = async () => {
      try {
        let deliveredCount = 0;
        for (const queued of queuedMessages) {
          try {
            await apiClient.sendChatMessage(activeConversationId, { body: queued.body });
            deliveredCount += 1;
          } catch {
            break;
          }
        }

        if (deliveredCount > 0) {
          setQueuedMessages((previous) => previous.slice(deliveredCount));
          await refreshMessages(activeConversationId, { markRead: false, showLoader: false });
          await refreshConversations(false);
          await refreshUnreadCount();
        }
      } finally {
        flushInProgressRef.current = false;
      }
    };

    void flush();
  }, [
    activeConversationId,
    isOnline,
    isRealtimeConnected,
    open,
    queuedMessages,
    refreshConversations,
    refreshMessages,
    refreshUnreadCount,
    viewerRole,
  ]);

  async function ensureConversationId(): Promise<number | null> {
    if (activeConversationId) {
      return activeConversationId;
    }

    const created = await apiClient.createChatConversation({ sourceType, sourceRef });
    setConversations((previous) => {
      if (previous.some((entry) => entry.id === created.item.id)) {
        return previous;
      }

      return [created.item, ...previous];
    });
    setActiveConversationId(created.item.id);
    return created.item.id;
  }

  async function sendCurrentMessage() {
    const body = composer.trim();
    if (!body || viewerRole !== "user") {
      return;
    }

    const conversationId = await ensureConversationId();
    if (!conversationId) {
      return;
    }

    setComposer("");

    if (!isOnline || !isRealtimeConnected) {
      setQueuedMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          body,
          createdAt: new Date().toISOString(),
        },
      ]);
      await stopTyping();
      return;
    }

    setIsSendingMessage(true);
    try {
      await apiClient.sendChatMessage(conversationId, { body });
      await refreshMessages(conversationId, { markRead: false, showLoader: false });
      await refreshConversations(false);
      await refreshUnreadCount();
    } catch {
      setQueuedMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          body,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSendingMessage(false);
      await stopTyping();
    }
  }

  const panelContent = (
    <div className="flex h-full min-h-0 flex-col rounded-[22px] bg-white">
      <div className="border-b border-zinc-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-800">
            <span className="h-2.5 w-2.5 rounded-full bg-linear-to-br from-orange-400 to-rose-500" />
            <span>GadgetWizard Chat</span>
          </div>

          <div className="inline-flex items-center text-zinc-500">
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-zinc-100 hover:text-zinc-800"
              aria-label="Minimize chat"
              onClick={() => setOpen(false)}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
          <RealtimeStatusIcon className="h-3.5 w-3.5" />
          <span>{realtimeStatus.label}</span>
        </div>

        {conversations.length > 1 ? (
          <div className="mt-2">
            <select
              value={activeConversationId ?? ""}
              onChange={(event) => setActiveConversationId(Number(event.target.value))}
              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            >
              {conversations.map((conversation) => (
                <option key={conversation.id} value={conversation.id}>
                  #{conversation.id} {conversation.sourceType.toUpperCase()} {conversation.unreadCount > 0 ? `(${conversation.unreadCount} new)` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {isBootstrapping ? (
        <div className="flex flex-1 items-center justify-center bg-zinc-50 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : viewerRole === "guest" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center">
          <p className="text-sm text-zinc-600">Please sign in to start a support conversation.</p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      ) : viewerRole === "admin" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center">
          <p className="text-sm text-zinc-600">You are signed in as admin. Use the dedicated inbox panel.</p>
          <Button asChild>
            <Link href="/admin/live-chat">Open Admin Inbox</Link>
          </Button>
        </div>
      ) : (
        <>
          {errorMessage ? (
            <p className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</p>
          ) : null}

          <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 px-3 py-3">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : messages.length === 0 && queuedMessages.length === 0 ? (
              <p className="text-center text-sm text-zinc-500">Start the conversation. We usually reply quickly.</p>
            ) : (
              <>
                {messages.map((message) => {
                  const isMine = message.senderRole === "user";

                  return (
                    <div
                      key={message.id}
                      className={`flex max-w-[92%] flex-col ${isMine ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <p className={`text-[11px] ${isMine ? "text-right text-zinc-500" : "text-zinc-500"}`}>
                        {isMine ? "You" : message.senderName}
                        <span className="ml-1">{formatTime(message.createdAt)}</span>
                      </p>
                      <div
                        className={`mt-1 rounded-2xl px-3 py-2 text-sm ${
                          isMine
                            ? "bg-zinc-900 text-white"
                            : "border border-zinc-200 bg-white text-zinc-800"
                        } w-fit max-w-full`}
                      >
                        <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>
                        {isMine ? (
                          <div className="mt-1 text-[11px] text-zinc-300">
                            {message.isReadByOtherParticipant ? "Read" : "Sent"}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {queuedMessages.map((message) => (
                  <div
                    key={message.id}
                    className="ml-auto max-w-[92%] rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                  >
                    <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>
                    <p className="mt-1 text-[11px] text-amber-700">Queued · {formatTime(message.createdAt)}</p>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="border-t border-zinc-200 bg-white px-2 py-2">
            {activeConversation?.isOtherParticipantTyping ? (
              <p className="mb-1 px-2 text-[11px] text-zinc-500">Support agent is typing...</p>
            ) : null}

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2">
              <Textarea
                rows={1}
                value={composer}
                onChange={(event) => {
                  const value = event.target.value.slice(0, COMPOSER_LIMIT);
                  setComposer(value);

                  if (!activeConversationId) {
                    return;
                  }

                  if (value.trim().length === 0) {
                    if (typingTimerRef.current) {
                      clearTimeout(typingTimerRef.current);
                    }
                    void stopTyping();
                    return;
                  }

                  if (!isTypingRef.current) {
                    isTypingRef.current = true;
                    void apiClient.setChatTyping(activeConversationId, true);
                  }

                  if (typingTimerRef.current) {
                    clearTimeout(typingTimerRef.current);
                  }

                  typingTimerRef.current = setTimeout(() => {
                    void stopTyping();
                  }, 1200);
                }}
                placeholder="Type a message..."
                className="min-h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendCurrentMessage();
                  }
                }}
              />

              <div className="mt-1 flex items-center justify-end gap-1 text-zinc-500">
                <span className="text-[11px] text-zinc-400">
                  {composer.length}/{COMPOSER_LIMIT}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 rounded-md text-zinc-700 hover:bg-zinc-100"
                  disabled={isSendingMessage || composer.trim().length === 0}
                  onClick={() => {
                    void sendCurrentMessage();
                  }}
                >
                  {isSendingMessage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SendHorizontal className="h-3.5 w-3.5" />}
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-12 rounded-full border border-zinc-200 bg-white px-4 text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.16)] hover:bg-zinc-50"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-rose-500 text-white">
          <MessageCircle className="h-4 w-4" />
        </span>
        <span className="pl-1">Chat</span>
        {chatUnreadCount > 0 && (
          <span className="ml-1 inline-flex min-w-6 items-center justify-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span>{chatUnreadCount > 99 ? "99+" : chatUnreadCount}</span>
          </span>
        )}
      </Button>

      <Dialog open={open && !isMobile} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] w-[min(96vw,420px)] max-w-none overflow-hidden border-zinc-200 p-0 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:left-auto sm:right-6 sm:top-auto sm:bottom-6 sm:translate-x-0 sm:translate-y-0 [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Live Support Chat</DialogTitle>
            <DialogDescription>Realtime chat with support agents</DialogDescription>
          </DialogHeader>
          <div className="h-[72vh] min-h-130">{panelContent}</div>
        </DialogContent>
      </Dialog>

      <Sheet open={open && isMobile} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[84vh] rounded-t-[22px] p-0" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>Live Support Chat</SheetTitle>
            <SheetDescription>Realtime chat with support agents</SheetDescription>
          </SheetHeader>
          {panelContent}
        </SheetContent>
      </Sheet>
    </>
  );
}