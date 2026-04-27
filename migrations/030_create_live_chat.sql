-- Migration 030: Create real-time chat conversations and messages.

CREATE TABLE chat_conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_user_id BIGINT UNSIGNED NOT NULL,
  admin_user_id BIGINT UNSIGNED NULL,
  source_type ENUM('home', 'dashboard', 'product', 'order', 'account', 'other') NOT NULL DEFAULT 'home',
  source_ref VARCHAR(191) NULL,
  status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  last_message_at TIMESTAMP NULL,
  customer_last_read_at TIMESTAMP NULL,
  admin_last_read_at TIMESTAMP NULL,
  customer_typing_until TIMESTAMP NULL,
  admin_typing_until TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_chat_conversations_customer (customer_user_id, updated_at),
  INDEX idx_chat_conversations_admin (admin_user_id, updated_at),
  INDEX idx_chat_conversations_status (status),
  INDEX idx_chat_conversations_last_message_at (last_message_at),
  INDEX idx_chat_conversations_source (source_type, source_ref),

  CONSTRAINT fk_chat_conversations_customer_user
    FOREIGN KEY (customer_user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_chat_conversations_admin_user
    FOREIGN KEY (admin_user_id)
    REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


CREATE TABLE chat_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_user_id BIGINT UNSIGNED NOT NULL,
  sender_role ENUM('user', 'admin') NOT NULL,
  body TEXT NOT NULL,
  read_by_customer_at TIMESTAMP NULL,
  read_by_admin_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_chat_messages_conversation (conversation_id, id),
  INDEX idx_chat_messages_sender (sender_user_id),
  INDEX idx_chat_messages_customer_unread (conversation_id, read_by_customer_at),
  INDEX idx_chat_messages_admin_unread (conversation_id, read_by_admin_at),

  CONSTRAINT fk_chat_messages_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES chat_conversations (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_chat_messages_sender_user
    FOREIGN KEY (sender_user_id)
    REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_chat_messages_body_not_empty
    CHECK (CHAR_LENGTH(TRIM(body)) > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;