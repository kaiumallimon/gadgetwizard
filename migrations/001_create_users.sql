-- 001_create_users.sql
-- Core users table mapped to Firebase identities.

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    firebase_uid VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(120) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    reward_points INT UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_firebase_uid (firebase_uid),
    UNIQUE KEY uk_users_email (email),
    KEY idx_users_role (role),
    KEY idx_users_created_at (created_at),
    CONSTRAINT chk_users_reward_points_non_negative CHECK (reward_points >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
