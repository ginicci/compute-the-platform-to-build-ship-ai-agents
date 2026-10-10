-- ADDITIVE ONLY. Apply to an isolated test database first. Never grants funding.
BEGIN;
CREATE TABLE IF NOT EXISTS ai_funding_account (
  account_id text PRIMARY KEY,
  available_micro_usd bigint NOT NULL DEFAULT 0 CHECK (available_micro_usd >= 0),
  enabled boolean NOT NULL DEFAULT false
);
-- account_id = 'platform' or 'customer:' || authenticated user ID.
-- Funding must come from a reconciled settled payment / explicitly approved
-- promotional budget. This draft intentionally has no client-accessible grant API.
CREATE TABLE IF NOT EXISTS ai_request_ledger (
  id uuid PRIMARY KEY,
  user_id text NOT NULL,
  feature text NOT NULL,
  reserve_micro_usd bigint NOT NULL CHECK (reserve_micro_usd > 0),
  state text NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved','completed','failed','reconciled')),
  generation_id text,
  usage jsonb,
  actual_micro_usd bigint CHECK (actual_micro_usd >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_request_customer_time ON ai_request_ledger(user_id, created_at);
COMMIT;
