-- 006_create_reward_ledger.sql
-- Ledger for reward point changes (future-ready for checkout integration).

CREATE TABLE IF NOT EXISTS reward_points_ledger (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    points_change INT NOT NULL,
    source ENUM('purchase', 'manual_adjustment', 'system') NOT NULL DEFAULT 'system',
    reference_id VARCHAR(100) NULL,
    note VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_reward_ledger_user_id (user_id),
    KEY idx_reward_ledger_created_at (created_at),
    CONSTRAINT fk_reward_ledger_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
