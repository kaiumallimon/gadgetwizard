-- Migration 031: Create newsletter subscribers table.

CREATE TABLE newsletter_subscribers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  subscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_newsletter_subscribers_email (email),
  KEY idx_newsletter_subscribers_is_active (is_active),
  KEY idx_newsletter_subscribers_subscribed_at (subscribed_at),

  CONSTRAINT chk_newsletter_subscribers_email_not_empty
    CHECK (CHAR_LENGTH(TRIM(email)) > 3)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
