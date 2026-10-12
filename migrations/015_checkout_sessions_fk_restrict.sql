-- 015_checkout_sessions_fk_restrict.sql
-- checkout_sessions.user_id/product_id were ON DELETE CASCADE, so deleting a
-- user or product silently wiped their checkout session history (including
-- completed, paid sessions) instead of blocking the delete or forcing it to
-- be handled explicitly. Switch both to RESTRICT.

ALTER TABLE checkout_sessions DROP CONSTRAINT IF EXISTS checkout_sessions_user_id_fkey;
ALTER TABLE checkout_sessions
  ADD CONSTRAINT checkout_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE checkout_sessions DROP CONSTRAINT IF EXISTS checkout_sessions_product_id_fkey;
ALTER TABLE checkout_sessions
  ADD CONSTRAINT checkout_sessions_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;
