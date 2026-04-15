-- 019_migrate_auth_to_nextauth_credentials.sql
-- Moves auth identity from Firebase UID to generic auth UID and adds password hash storage.

ALTER TABLE users
  CHANGE COLUMN firebase_uid auth_uid VARCHAR(128) NOT NULL;

ALTER TABLE users
  DROP INDEX uk_users_firebase_uid,
  ADD UNIQUE KEY uk_users_auth_uid (auth_uid);

ALTER TABLE users
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER auth_uid,
  ADD COLUMN password_updated_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;
