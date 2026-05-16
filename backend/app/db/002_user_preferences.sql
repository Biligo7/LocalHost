-- Migration 002: user preferences (indexes on app_users.external_subject live in schema / 003).

CREATE TABLE IF NOT EXISTS user_preferences (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES app_users(id) UNIQUE,
    preferences_text text NOT NULL DEFAULT '',
    onboarding_completed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_user_preferences_user_id ON user_preferences(user_id);
