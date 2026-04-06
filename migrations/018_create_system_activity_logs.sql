-- 018_create_system_activity_logs.sql
-- Generic API activity log table for system monitoring (CRUD audit trail).

CREATE TABLE IF NOT EXISTS system_activity_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    actor_user_id BIGINT UNSIGNED NULL,
    actor_name VARCHAR(255) NULL,
    actor_email VARCHAR(255) NULL,
    actor_role ENUM('admin', 'user', 'guest') NOT NULL DEFAULT 'guest',
    http_method VARCHAR(10) NOT NULL,
    crud_action ENUM('create', 'read', 'update', 'delete') NOT NULL,
    route_path VARCHAR(255) NOT NULL,
    route_pattern VARCHAR(255) NULL,
    resource_name VARCHAR(120) NOT NULL,
    resource_id VARCHAR(120) NULL,
    status_code SMALLINT UNSIGNED NOT NULL,
    is_success TINYINT(1) NOT NULL DEFAULT 0,
    message VARCHAR(500) NOT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_system_activity_actor_user_id (actor_user_id),
    KEY idx_system_activity_crud_action (crud_action),
    KEY idx_system_activity_resource_name (resource_name),
    KEY idx_system_activity_is_success (is_success),
    KEY idx_system_activity_created_at (created_at),
    CONSTRAINT fk_system_activity_actor_user
        FOREIGN KEY (actor_user_id)
        REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT chk_system_activity_metadata_json CHECK (metadata IS NULL OR JSON_VALID(metadata))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;