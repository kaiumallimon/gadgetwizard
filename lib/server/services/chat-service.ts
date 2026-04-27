import { badRequest, forbidden, notFound } from "@/lib/server/core/errors";
import {
  countConversationsForAdmin,
  countConversationsForCustomer,
  countMessagesByConversationId,
  createConversation,
  createMessage,
  findOpenConversationForCustomer,
  getConversationById,
  listConversationsForAdmin,
  listConversationsForCustomer,
  listMessagesByConversationId,
  markConversationReadByAdmin,
  markConversationReadByCustomer,
  setConversationTypingState,
  type ChatConversationRow,
  type ChatMessageRow,
} from "@/lib/server/repositories/chat-repository";
import { publishChatRealtimeEvent } from "@/lib/server/realtime/chat-realtime";
import type {
  ChatConversation,
  ChatConversationSourceType,
  ChatMessage,
  ChatSenderRole,
} from "@/lib/client/types";
import type { AuthSession } from "@/lib/server/types";

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toOptionalIso(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  return toIso(value);
}

function isFutureDate(value: Date | string | null): boolean {
  if (!value) {
    return false;
  }

  return new Date(value).getTime() > Date.now();
}

function mapConversation(row: ChatConversationRow, role: AuthSession["role"]): ChatConversation {
  const unreadCount = role === "admin" ? row.admin_unread_count : row.customer_unread_count;
  const isOtherParticipantTyping =
    role === "admin"
      ? isFutureDate(row.customer_typing_until)
      : isFutureDate(row.admin_typing_until);

  return {
    id: row.id,
    customerUserId: row.customer_user_id,
    adminUserId: row.admin_user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    adminName: row.admin_name,
    adminEmail: row.admin_email,
    sourceType: row.source_type,
    sourceRef: row.source_ref,
    status: row.status,
    latestMessageId: row.latest_message_id,
    latestMessagePreview: row.latest_message_body,
    latestMessageSenderRole: row.latest_message_sender_role,
    latestMessageAt: toOptionalIso(row.latest_message_created_at ?? row.last_message_at),
    unreadCount,
    isOtherParticipantTyping,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapMessage(row: ChatMessageRow, role: AuthSession["role"]): ChatMessage {
  const isReadByMe = role === "admin" ? row.read_by_admin_at !== null : row.read_by_customer_at !== null;
  const isReadByOtherParticipant = role === "admin" ? row.read_by_customer_at !== null : row.read_by_admin_at !== null;

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderUserId: row.sender_user_id,
    senderRole: row.sender_role,
    senderName: row.sender_name,
    body: row.body,
    readByCustomerAt: toOptionalIso(row.read_by_customer_at),
    readByAdminAt: toOptionalIso(row.read_by_admin_at),
    isReadByMe,
    isReadByOtherParticipant,
    createdAt: toIso(row.created_at),
  };
}

async function requireConversationAccess(session: AuthSession, conversationId: number): Promise<ChatConversationRow> {
  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    throw notFound("Conversation not found");
  }

  if (session.role === "user" && conversation.customer_user_id !== session.userId) {
    throw forbidden("You do not have access to this conversation");
  }

  return conversation;
}

function publishConversationEvent(input: {
  conversationId: number;
  customerUserId: number;
  event:
    | { type: "conversation.created"; conversationId: number }
    | { type: "conversation.updated"; conversationId: number }
    | { type: "message.created"; conversationId: number; messageId: number }
    | { type: "messages.read"; conversationId: number; byRole: ChatSenderRole }
    | { type: "typing.updated"; conversationId: number; byRole: ChatSenderRole; isTyping: boolean };
}): void {
  publishChatRealtimeEvent(input.event, {
    userIds: [input.customerUserId],
    includeAllAdmins: true,
  });
}

export async function getChatConversationsForSession(
  session: AuthSession,
  input: {
    page: number;
    pageSize: number;
    search?: string;
  },
): Promise<{
  items: ChatConversation[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> {
  if (session.role === "admin") {
    const [rows, total] = await Promise.all([
      listConversationsForAdmin({
        page: input.page,
        pageSize: input.pageSize,
        search: input.search,
      }),
      countConversationsForAdmin(input.search),
    ]);

    return {
      items: rows.map((row) => mapConversation(row, session.role)),
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
      },
    };
  }

  const [rows, total] = await Promise.all([
    listConversationsForCustomer({
      customerUserId: session.userId,
      page: input.page,
      pageSize: input.pageSize,
    }),
    countConversationsForCustomer(session.userId),
  ]);

  return {
    items: rows.map((row) => mapConversation(row, session.role)),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
    },
  };
}

export async function startChatConversationForUser(
  session: AuthSession,
  input: {
    sourceType: ChatConversationSourceType;
    sourceRef?: string | null;
    initialMessage?: string;
  },
): Promise<ChatConversation> {
  if (session.role !== "user") {
    throw forbidden("Only customers can initiate chat conversations");
  }

  let conversation = await findOpenConversationForCustomer({
    customerUserId: session.userId,
    sourceType: input.sourceType,
    sourceRef: input.sourceRef ?? null,
  });

  if (!conversation) {
    conversation = await createConversation({
      customerUserId: session.userId,
      sourceType: input.sourceType,
      sourceRef: input.sourceRef ?? null,
    });

    publishConversationEvent({
      conversationId: conversation.id,
      customerUserId: conversation.customer_user_id,
      event: {
        type: "conversation.created",
        conversationId: conversation.id,
      },
    });
  }

  const initialMessage = input.initialMessage?.trim();
  if (initialMessage) {
    await sendChatMessageForSession(session, conversation.id, initialMessage);
  }

  const updated = await getConversationById(conversation.id);
  if (!updated) {
    throw notFound("Conversation not found");
  }

  return mapConversation(updated, session.role);
}

export async function getChatMessagesForSession(
  session: AuthSession,
  input: {
    conversationId: number;
    page: number;
    pageSize: number;
  },
): Promise<{
  conversation: ChatConversation;
  items: ChatMessage[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> {
  const conversation = await requireConversationAccess(session, input.conversationId);
  const [rows, total] = await Promise.all([
    listMessagesByConversationId({
      conversationId: input.conversationId,
      page: input.page,
      pageSize: input.pageSize,
    }),
    countMessagesByConversationId(input.conversationId),
  ]);

  return {
    conversation: mapConversation(conversation, session.role),
    items: rows.map((row) => mapMessage(row, session.role)),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
    },
  };
}

export async function sendChatMessageForSession(
  session: AuthSession,
  conversationId: number,
  body: string,
): Promise<ChatMessage> {
  const conversation = await requireConversationAccess(session, conversationId);

  if (conversation.status !== "open") {
    throw badRequest("This conversation is closed");
  }

  const normalizedBody = body.trim();
  if (!normalizedBody) {
    throw badRequest("Message body is required");
  }

  const message = await createMessage({
    conversationId,
    senderUserId: session.userId,
    senderRole: session.role,
    body: normalizedBody,
  });

  publishConversationEvent({
    conversationId,
    customerUserId: conversation.customer_user_id,
    event: {
      type: "message.created",
      conversationId,
      messageId: message.id,
    },
  });

  publishConversationEvent({
    conversationId,
    customerUserId: conversation.customer_user_id,
    event: {
      type: "conversation.updated",
      conversationId,
    },
  });

  return mapMessage(message, session.role);
}

export async function markChatConversationReadForSession(
  session: AuthSession,
  conversationId: number,
): Promise<void> {
  const conversation = await requireConversationAccess(session, conversationId);

  if (session.role === "admin") {
    await markConversationReadByAdmin(conversationId, session.userId);
  } else {
    await markConversationReadByCustomer(conversationId);
  }

  publishConversationEvent({
    conversationId,
    customerUserId: conversation.customer_user_id,
    event: {
      type: "messages.read",
      conversationId,
      byRole: session.role,
    },
  });

  publishConversationEvent({
    conversationId,
    customerUserId: conversation.customer_user_id,
    event: {
      type: "conversation.updated",
      conversationId,
    },
  });
}

export async function setChatTypingForSession(
  session: AuthSession,
  conversationId: number,
  isTyping: boolean,
): Promise<void> {
  const conversation = await requireConversationAccess(session, conversationId);

  await setConversationTypingState({
    conversationId,
    role: session.role,
    isTyping,
    adminUserId: session.role === "admin" ? session.userId : undefined,
  });

  publishConversationEvent({
    conversationId,
    customerUserId: conversation.customer_user_id,
    event: {
      type: "typing.updated",
      conversationId,
      byRole: session.role,
      isTyping,
    },
  });
}