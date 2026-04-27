import { execute, queryOne, queryRows } from "@/lib/server/core/db";
import type { ChatConversationSourceType, ChatConversationStatus, ChatSenderRole } from "@/lib/client/types";

export interface ChatConversationRow {
  id: number;
  customer_user_id: number;
  admin_user_id: number | null;
  customer_name: string;
  customer_email: string;
  admin_name: string | null;
  admin_email: string | null;
  source_type: ChatConversationSourceType;
  source_ref: string | null;
  status: ChatConversationStatus;
  last_message_at: Date | string | null;
  latest_message_id: number | null;
  latest_message_body: string | null;
  latest_message_sender_role: ChatSenderRole | null;
  latest_message_created_at: Date | string | null;
  customer_unread_count: number;
  admin_unread_count: number;
  customer_typing_until: Date | string | null;
  admin_typing_until: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ChatMessageRow {
  id: number;
  conversation_id: number;
  sender_user_id: number;
  sender_role: ChatSenderRole;
  sender_name: string;
  body: string;
  read_by_customer_at: Date | string | null;
  read_by_admin_at: Date | string | null;
  created_at: Date | string;
}

interface CountRow {
  total: number;
}

const CONVERSATION_SELECT_SQL = `
  SELECT
    c.id,
    c.customer_user_id,
    c.admin_user_id,
    cu.name AS customer_name,
    cu.email AS customer_email,
    au.name AS admin_name,
    au.email AS admin_email,
    c.source_type,
    c.source_ref,
    c.status,
    c.last_message_at,
    lm.id AS latest_message_id,
    lm.body AS latest_message_body,
    lm.sender_role AS latest_message_sender_role,
    lm.created_at AS latest_message_created_at,
    COALESCE(uc.customer_unread_count, 0) AS customer_unread_count,
    COALESCE(ua.admin_unread_count, 0) AS admin_unread_count,
    c.customer_typing_until,
    c.admin_typing_until,
    c.created_at,
    c.updated_at
  FROM chat_conversations c
  JOIN users cu ON cu.id = c.customer_user_id
  LEFT JOIN users au ON au.id = c.admin_user_id
  LEFT JOIN (
    SELECT m1.conversation_id, m1.id, m1.body, m1.sender_role, m1.created_at
    FROM chat_messages m1
    INNER JOIN (
      SELECT conversation_id, MAX(id) AS max_id
      FROM chat_messages
      GROUP BY conversation_id
    ) lm2 ON lm2.max_id = m1.id
  ) lm ON lm.conversation_id = c.id
  LEFT JOIN (
    SELECT conversation_id, COUNT(*) AS customer_unread_count
    FROM chat_messages
    WHERE sender_role = 'admin' AND read_by_customer_at IS NULL
    GROUP BY conversation_id
  ) uc ON uc.conversation_id = c.id
  LEFT JOIN (
    SELECT conversation_id, COUNT(*) AS admin_unread_count
    FROM chat_messages
    WHERE sender_role = 'user' AND read_by_admin_at IS NULL
    GROUP BY conversation_id
  ) ua ON ua.conversation_id = c.id
`;

function normalizeSourceRef(sourceRef: string | null | undefined): string | null {
  const value = sourceRef?.trim() ?? "";
  return value.length > 0 ? value : null;
}

export async function findOpenConversationForCustomer(input: {
  customerUserId: number;
  sourceType: ChatConversationSourceType;
  sourceRef?: string | null;
}): Promise<ChatConversationRow | null> {
  const sourceRef = normalizeSourceRef(input.sourceRef);

  return queryOne<ChatConversationRow>(
    `${CONVERSATION_SELECT_SQL}
      WHERE c.customer_user_id = ?
        AND c.status = 'open'
        AND c.source_type = ?
        AND ((? IS NULL AND c.source_ref IS NULL) OR c.source_ref = ?)
      ORDER BY c.id DESC
      LIMIT 1`,
    [input.customerUserId, input.sourceType, sourceRef, sourceRef],
  );
}

export async function createConversation(input: {
  customerUserId: number;
  sourceType: ChatConversationSourceType;
  sourceRef?: string | null;
}): Promise<ChatConversationRow> {
  const sourceRef = normalizeSourceRef(input.sourceRef);

  const result = await execute(
    `INSERT INTO chat_conversations (
      customer_user_id,
      source_type,
      source_ref,
      status,
      customer_last_read_at,
      last_message_at
    ) VALUES (?, ?, ?, 'open', NOW(), NOW())`,
    [input.customerUserId, input.sourceType, sourceRef],
  );

  const conversation = await getConversationById(result.insertId);
  if (!conversation) {
    throw new Error("Failed to retrieve created conversation");
  }

  return conversation;
}

export async function getConversationById(id: number): Promise<ChatConversationRow | null> {
  return queryOne<ChatConversationRow>(
    `${CONVERSATION_SELECT_SQL}
      WHERE c.id = ?
      LIMIT 1`,
    [id],
  );
}

export async function listConversationsForCustomer(input: {
  customerUserId: number;
  page: number;
  pageSize: number;
}): Promise<ChatConversationRow[]> {
  const offset = (input.page - 1) * input.pageSize;

  return queryRows<ChatConversationRow>(
    `${CONVERSATION_SELECT_SQL}
      WHERE c.customer_user_id = ?
      ORDER BY COALESCE(c.last_message_at, c.updated_at) DESC, c.id DESC
      LIMIT ? OFFSET ?`,
    [input.customerUserId, input.pageSize, offset],
  );
}

export async function countConversationsForCustomer(customerUserId: number): Promise<number> {
  const row = await queryOne<CountRow>(
    `SELECT COUNT(*) AS total
     FROM chat_conversations
     WHERE customer_user_id = ?`,
    [customerUserId],
  );

  return row?.total ?? 0;
}

export async function listConversationsForAdmin(input: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<ChatConversationRow[]> {
  const offset = (input.page - 1) * input.pageSize;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (input.search) {
    const term = `%${input.search}%`;
    conditions.push("(cu.name LIKE ? OR cu.email LIKE ? OR c.source_ref LIKE ?)");
    params.push(term, term, term);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return queryRows<ChatConversationRow>(
    `${CONVERSATION_SELECT_SQL}
      ${whereSql}
      ORDER BY COALESCE(c.last_message_at, c.updated_at) DESC, c.id DESC
      LIMIT ? OFFSET ?`,
    [...params, input.pageSize, offset],
  );
}

export async function countConversationsForAdmin(search?: string): Promise<number> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (search) {
    const term = `%${search}%`;
    conditions.push("(u.name LIKE ? OR u.email LIKE ? OR c.source_ref LIKE ?)");
    params.push(term, term, term);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const row = await queryOne<CountRow>(
    `SELECT COUNT(*) AS total
     FROM chat_conversations c
     JOIN users u ON u.id = c.customer_user_id
     ${whereSql}`,
    params,
  );

  return row?.total ?? 0;
}

export async function listMessagesByConversationId(input: {
  conversationId: number;
  page: number;
  pageSize: number;
}): Promise<ChatMessageRow[]> {
  const offset = (input.page - 1) * input.pageSize;

  const rows = await queryRows<ChatMessageRow>(
    `SELECT
      m.id,
      m.conversation_id,
      m.sender_user_id,
      m.sender_role,
      u.name AS sender_name,
      m.body,
      m.read_by_customer_at,
      m.read_by_admin_at,
      m.created_at
     FROM chat_messages m
     JOIN users u ON u.id = m.sender_user_id
     WHERE m.conversation_id = ?
     ORDER BY m.id DESC
     LIMIT ? OFFSET ?`,
    [input.conversationId, input.pageSize, offset],
  );

  return rows.reverse();
}

export async function countMessagesByConversationId(conversationId: number): Promise<number> {
  const row = await queryOne<CountRow>(
    `SELECT COUNT(*) AS total
     FROM chat_messages
     WHERE conversation_id = ?`,
    [conversationId],
  );

  return row?.total ?? 0;
}

export async function getMessageById(id: number): Promise<ChatMessageRow | null> {
  return queryOne<ChatMessageRow>(
    `SELECT
      m.id,
      m.conversation_id,
      m.sender_user_id,
      m.sender_role,
      u.name AS sender_name,
      m.body,
      m.read_by_customer_at,
      m.read_by_admin_at,
      m.created_at
     FROM chat_messages m
     JOIN users u ON u.id = m.sender_user_id
     WHERE m.id = ?
     LIMIT 1`,
    [id],
  );
}

export async function createMessage(input: {
  conversationId: number;
  senderUserId: number;
  senderRole: ChatSenderRole;
} & (
  | {
      body: string;
      senderRole: "user";
    }
  | {
      body: string;
      senderRole: "admin";
    }
)): Promise<ChatMessageRow> {
  const body = input.body.trim();

  const insertResult =
    input.senderRole === "user"
      ? await execute(
        `INSERT INTO chat_messages (
          conversation_id,
          sender_user_id,
          sender_role,
          body,
          read_by_customer_at,
          read_by_admin_at
        ) VALUES (?, ?, 'user', ?, NOW(), NULL)`,
        [input.conversationId, input.senderUserId, body],
      )
      : await execute(
        `INSERT INTO chat_messages (
          conversation_id,
          sender_user_id,
          sender_role,
          body,
          read_by_customer_at,
          read_by_admin_at
        ) VALUES (?, ?, 'admin', ?, NULL, NOW())`,
        [input.conversationId, input.senderUserId, body],
      );

  if (input.senderRole === "user") {
    await execute(
      `UPDATE chat_conversations
       SET
         last_message_at = NOW(),
         customer_last_read_at = NOW(),
         customer_typing_until = NULL,
         updated_at = NOW()
       WHERE id = ?`,
      [input.conversationId],
    );
  } else {
    await execute(
      `UPDATE chat_conversations
       SET
         admin_user_id = COALESCE(admin_user_id, ?),
         last_message_at = NOW(),
         admin_last_read_at = NOW(),
         admin_typing_until = NULL,
         updated_at = NOW()
       WHERE id = ?`,
      [input.senderUserId, input.conversationId],
    );
  }

  const message = await getMessageById(insertResult.insertId);
  if (!message) {
    throw new Error("Failed to retrieve created message");
  }

  return message;
}

export async function markConversationReadByCustomer(conversationId: number): Promise<void> {
  await execute(
    `UPDATE chat_messages
     SET read_by_customer_at = NOW()
     WHERE conversation_id = ?
       AND sender_role = 'admin'
       AND read_by_customer_at IS NULL`,
    [conversationId],
  );

  await execute(
    `UPDATE chat_conversations
     SET customer_last_read_at = NOW(), updated_at = NOW()
     WHERE id = ?`,
    [conversationId],
  );
}

export async function markConversationReadByAdmin(conversationId: number, adminUserId: number): Promise<void> {
  await execute(
    `UPDATE chat_messages
     SET read_by_admin_at = NOW()
     WHERE conversation_id = ?
       AND sender_role = 'user'
       AND read_by_admin_at IS NULL`,
    [conversationId],
  );

  await execute(
    `UPDATE chat_conversations
     SET admin_user_id = COALESCE(admin_user_id, ?), admin_last_read_at = NOW(), updated_at = NOW()
     WHERE id = ?`,
    [adminUserId, conversationId],
  );
}

export async function setConversationTypingState(input: {
  conversationId: number;
  role: ChatSenderRole;
  isTyping: boolean;
  adminUserId?: number;
}): Promise<void> {
  if (input.role === "user") {
    if (input.isTyping) {
      await execute(
        `UPDATE chat_conversations
         SET customer_typing_until = DATE_ADD(NOW(), INTERVAL 8 SECOND), updated_at = NOW()
         WHERE id = ?`,
        [input.conversationId],
      );
      return;
    }

    await execute(
      `UPDATE chat_conversations
       SET customer_typing_until = NULL, updated_at = NOW()
       WHERE id = ?`,
      [input.conversationId],
    );
    return;
  }

  if (input.isTyping) {
    await execute(
      `UPDATE chat_conversations
       SET
         admin_user_id = COALESCE(admin_user_id, ?),
         admin_typing_until = DATE_ADD(NOW(), INTERVAL 8 SECOND),
         updated_at = NOW()
       WHERE id = ?`,
      [input.adminUserId ?? null, input.conversationId],
    );
    return;
  }

  await execute(
    `UPDATE chat_conversations
     SET admin_typing_until = NULL, updated_at = NOW()
     WHERE id = ?`,
    [input.conversationId],
  );
}