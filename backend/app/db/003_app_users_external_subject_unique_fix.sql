-- Replace partial unique index (if present) so ON CONFLICT (external_subject) works.
DROP INDEX IF EXISTS ix_app_users_external_subject;
CREATE UNIQUE INDEX IF NOT EXISTS ix_app_users_external_subject ON app_users (external_subject);
