-- 007_create_banners.sql
-- Home page promotional banners with separate desktop/mobile images and click target.

CREATE TABLE IF NOT EXISTS banners (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    desktop_image_url VARCHAR(500) NOT NULL,
    mobile_image_url VARCHAR(500) NOT NULL,
    click_url VARCHAR(500) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    starts_at DATETIME NULL,
    ends_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_banners_active_sort (is_active, sort_order),
    KEY idx_banners_time_window (starts_at, ends_at),
    CONSTRAINT chk_banners_date_window CHECK (
        ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
