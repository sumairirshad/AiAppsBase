-- 018_add_session_version.sql
-- The session cookie was HMAC(userId) with nothing else — changing a
-- password never invalidated any existing signed cookie on any other
-- device, since the signature depended on nothing that password-change
-- updates. Add a counter that's embedded in the signed cookie and bumped on
-- password change, so older cookies stop verifying once it moves.

ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;
