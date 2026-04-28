-- Migration 033: Fix inventory_reservations.expires_at to avoid auto-updates
-- The original phpMyAdmin dump used ON UPDATE CURRENT_TIMESTAMP, which breaks TTL logic.

ALTER TABLE inventory_reservations
  MODIFY expires_at TIMESTAMP NOT NULL;
