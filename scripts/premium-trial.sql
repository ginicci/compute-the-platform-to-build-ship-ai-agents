-- Additive migration. Apply to an isolated database first. Never run automatically.
BEGIN;
CREATE TABLE IF NOT EXISTS premium_requests (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  request_key text NOT NULL,
  input_hash text NOT NULL,
  feature text NOT NULL,
  entitlement text NOT NULL CHECK (entitlement IN ('trial', 'paid')),
  billing_period text NOT NULL,
  state text NOT NULL CHECK (state IN ('running', 'ready', 'completed', 'failed')),
  result text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  delivered_at timestamptz,
  UNIQUE(user_id, request_key),
  CHECK (state NOT IN ('ready', 'completed') OR (result IS NOT NULL AND length(btrim(result)) > 0 AND completed_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS premium_requests_account ON premium_requests(user_id, created_at);
CREATE TABLE IF NOT EXISTS premium_plans (
  tier_id text NOT NULL,
  interval text NOT NULL CHECK (interval IN ('monthly', 'annual')),
  stripe_price_id text NOT NULL UNIQUE,
  tasks_per_period integer NOT NULL CHECK (tasks_per_period > 0),
  enabled boolean NOT NULL DEFAULT false,
  PRIMARY KEY(tier_id, interval)
);
-- Deliberately no invented prices or automatic entitlement/plan activation.
-- Only the server database role may write these tables. Do not expose them via a public DB API.
COMMIT;
