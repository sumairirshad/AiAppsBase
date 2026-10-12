-- 022_add_platform_settings.sql
-- Platform-wide configuration (commission rate to start) was only an env
-- var and hardcoded UI strings — there was no admin-editable, persisted
-- source of truth. A simple key/value table so new settings can be added
-- without another migration per setting.

CREATE TABLE IF NOT EXISTS platform_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);
