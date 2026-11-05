-- 040_add_withdrawal_payout_confirmation.sql
--
-- AUD finding: approving a withdrawal only ever confirmed that
-- stripe.transfers.create() succeeded — i.e. that Stripe accepted moving
-- the money into the seller's CONNECTED ACCOUNT balance. It never confirmed
-- the money actually left Stripe and landed in the seller's bank account.
-- A transfer can succeed and still never reach the seller's bank (their
-- payout schedule is paused, their bank account was removed, the payout
-- itself fails) with nothing in this app ever finding out.
--
-- 'approved' now means "transfer to the connected account's Stripe balance
-- succeeded" (unchanged meaning). 'paid' and 'payout_failed' are new,
-- strictly later states reached only once Stripe confirms (via a Connect
-- webhook — see lib/connect-payouts.ts) that an actual bank payout
-- including this transfer's money has landed or failed.
ALTER TABLE withdrawal_requests DROP CONSTRAINT IF EXISTS withdrawal_requests_status_check;
ALTER TABLE withdrawal_requests ADD CONSTRAINT withdrawal_requests_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'failed', 'paid', 'payout_failed'));

ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS stripe_payout_id TEXT;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS payout_confirmed_at TIMESTAMPTZ;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS payout_failure_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_stripe_payout_id ON withdrawal_requests(stripe_payout_id);
