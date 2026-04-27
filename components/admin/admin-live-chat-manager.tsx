"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, SendHorizontal, Wifi, WifiOff, X } from "lucide-react";

import { apiClient } from "@/lib/client/api";
import type { ChatConversation, ChatMessage, ChatRealtimeEvent } from "@/lib/client/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

interface AdminLiveChatManagerProps {
  initialConversations: ChatConversation[];
}

interface QueuedAdminMessage {
  id: string;
  body: string;
  createdAt: string;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "No messages yet";
  }

  const date = new Date(value);
  return date.toLocaleString();
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AdminLiveChatManager({ initialConversations }: AdminLiveChatManagerProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(initialConversations[0]?.id ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [composer, setComposer] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [queuedMessages, setQueuedMessages] = useState<QueuedAdminMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMobileThreadsOpen, setIsMobileThreadsOpen] = useState(false);

  const flushInProgressRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const activeConversation = useMemo(
    () => conversations.find((entry) => entry.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const refreshConversations = useCallback(async (searchValue?: string, options: { showLoader?: boolean } = {}) => {
    const { showLoader = true } = options;

    if (showLoader) {
      setIsSearching(true);
    }

    try {
      const response = await apiClient.getChatConversations({
        page: 1,
        pageSize: 50,
        search: searchValue?.trim() || undefined,
      });

      setConversations(response.items);
      setErrorMessage(null);
      setActiveConversationId((previous) => {
        if (previous && response.items.some((entry) => entry.id === previous)) {
          return previous;
        }

        return response.items[0]?.id ?? null;
      });
    } catch {
      setErrorMessage("Unable to refresh conversations right now.");
    } finally {
      if (showLoader) {
        setIsSearching(false);
      }
    }
  }, []);

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
      const response = await apiClient.getChatMessages(conversationId, { page: 1, pageSize: 100 });
      setMessages(response.items);
      setConversations((previous) =>
        previous.map((entry) => (entry.id === response.conversation.id ? response.conversation : entry)),
      );
      setErrorMessage(null);

      if (markRead && response.conversation.unreadCount > 0) {
        await apiClient.markChatConversationRead(conversationId);
      }
    } catch {
      setErrorMessage("Unable to refresh messages right now.");
    } finally {
      if (showLoader) {
        setIsLoadingMessages(false);
      }
    }
    },
    [],
  );

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
    if (typeof window === "undefined") {
      return;
    }

    setIsOnline(window.navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    void refreshMessages(activeConversationId, { markRead: true, showLoader: true });
  }, [activeConversationId, refreshMessages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshConversations(search, { showLoader: false });
    }, 280);

    return () => {
      clearTimeout(timer);
    };
  }, [refreshConversations, search]);

  useEffect(() => {
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
                  isOtherParticipantTyping: payload.byRole === "user" ? payload.isTyping : entry.isOtherParticipantTyping,
                }
                : entry,
            ),
          );
          return;
        }

        if (payload.type === "conversation.created") {
          void refreshConversations(search, { showLoader: false });
          return;
        }

        if (payload.type === "message.created") {
          void refreshConversations(search, { showLoader: false });
          if (activeConversationId && payload.conversationId === activeConversationId) {
            void refreshMessages(activeConversationId, { markRead: true, showLoader: false });
          }
          return;
        }

        if (payload.type === "messages.read") {
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
  }, [activeConversationId, refreshConversations, refreshMessages, search]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      void stopTyping();
    };
  }, [stopTyping]);

  useEffect(() => {
    if (!isOnline || !isRealtimeConnected || !activeConversationId || queuedMessages.length === 0) {
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
          await refreshConversations(search, { showLoader: false });
        }
      } finally {
        flushInProgressRef.current = false;
      }
    };

    void flush();
  }, [activeConversationId, isOnline, isRealtimeConnected, queuedMessages, refreshConversations, refreshMessages, search]);

  async function sendMessage() {
    const body = composer.trim();
    if (!body || !activeConversationId) {
      return;
    }

    setComposer("");

    if (!isOnline || !isRealtimeConnected) {
      setQueuedMessages((previous) => [
        ...previous,
        { id: crypto.randomUUID(), body, createdAt: new Date().toISOString() },
      ]);
      await stopTyping();
      return;
    }

    setIsSendingMessage(true);
    try {
      await apiClient.sendChatMessage(activeConversationId, { body });
      await refreshMessages(activeConversationId, { markRead: false, showLoader: false });
      await refreshConversations(search, { showLoader: false });
    } catch {
      setQueuedMessages((previous) => [
        ...previous,
        { id: crypto.randomUUID(), body, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setIsSendingMessage(false);
      await stopTyping();
    }
  }

  const selectConversation = useCallback((conversationId: number) => {
    setActiveConversationId(conversationId);
    setIsMobileThreadsOpen(false);
  }, []);

  const conversationDirectory = (
    <>
      <div className="space-y-2 border-b border-zinc-200 p-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customer or context"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void refreshConversations(search, { showLoader: true });
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isSearching}
          onClick={() => {
            void refreshConversations(search, { showLoader: true });
          }}
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Search Conversations
        </Button>
      </div>

      <div className="mt-0 flex-1 space-y-2 overflow-y-auto p-3">
        {conversations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-sm text-zinc-500">
            No conversations found.
          </p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => selectConversation(conversation.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                conversation.id === activeConversationId
                  ? "border-orange-300 bg-orange-50"
                  : "border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-semibold text-zinc-900">{conversation.customerName}</p>
                {conversation.unreadCount > 0 ? (
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {conversation.unreadCount}
                  </span>
                ) : null}
              </div>
              <p className="truncate text-xs text-zinc-500">{conversation.customerEmail}</p>
              <p className="truncate text-xs text-zinc-600">{conversation.latestMessagePreview ?? "No messages yet"}</p>
              <p className="mt-1 text-[11px] text-zinc-400">{formatDateTime(conversation.latestMessageAt)}</p>
            </button>
          ))
        )}
      </div>
    </>
  );

  return (
    <>
      <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="hidden min-h-[70vh] overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:flex lg:flex-col">
          {conversationDirectory}
        </aside>

        <section className="flex min-h-[75vh] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:min-h-[70vh]">
        <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 lg:hidden"
              onClick={() => setIsMobileThreadsOpen(true)}
            >
              Threads
            </Button>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{activeConversation?.customerName ?? "Select a conversation"}</p>
              <p className="text-xs text-zinc-500">{activeConversation?.customerEmail ?? ""}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${
              !isOnline
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : isRealtimeConnected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-orange-200 bg-orange-50 text-orange-700"
            }`}
          >
            {!isOnline ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
            {!isOnline ? "Offline" : isRealtimeConnected ? "Connected" : "Reconnecting"}
          </span>
        </header>

        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {errorMessage ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</p>
          ) : null}

          {!activeConversationId ? (
            <p className="text-sm text-zinc-500">Choose a conversation to begin.</p>
          ) : isLoadingMessages ? (
            <div className="flex items-center justify-center text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isMine = message.senderRole === "admin";
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
                      className={`mt-1 w-fit max-w-full rounded-2xl px-3 py-2 text-sm ${
                        isMine
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-200 bg-zinc-50 text-zinc-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>
                    </div>
                  </div>
                );
              })}

              {queuedMessages.map((message) => (
                <div
                  key={message.id}
                  className="ml-auto flex max-w-[92%] flex-col items-end"
                >
                  <div className="w-fit max-w-full rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>
                    <p className="mt-1 text-[11px] text-amber-700">Queued · {formatTime(message.createdAt)}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <footer className="border-t border-zinc-100 p-3">
          {activeConversation?.isOtherParticipantTyping ? (
            <p className="mb-2 text-xs text-zinc-500">Customer is typing...</p>
          ) : null}

          <div className="flex items-end gap-2">
            <Textarea
              rows={2}
              value={composer}
              onChange={(event) => {
                const value = event.target.value;
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
              placeholder={activeConversationId ? "Type a reply..." : "Select conversation to reply"}
              className="min-h-10 resize-none"
              disabled={!activeConversationId}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={!activeConversationId || isSendingMessage || composer.trim().length === 0}
              onClick={() => {
                void sendMessage();
              }}
            >
              {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </footer>
        </section>
      </div>

      <Sheet open={isMobileThreadsOpen} onOpenChange={setIsMobileThreadsOpen}>
        <SheetContent side="left" className="w-[92vw] max-w-sm p-0" showCloseButton={false}>
          <SheetHeader className="border-b border-zinc-200 p-3">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-sm font-semibold text-zinc-900">Threads</SheetTitle>
              <SheetClose asChild>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close threads</span>
                </Button>
              </SheetClose>
            </div>
            <SheetDescription className="text-xs text-zinc-500">Select a conversation to reply</SheetDescription>
          </SheetHeader>
          <div className="flex h-full min-h-0 flex-col bg-white">{conversationDirectory}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}