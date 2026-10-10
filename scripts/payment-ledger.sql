-- Unapplied additive migration. Explicit environment separation; no grants.
BEGIN;
CREATE TABLE IF NOT EXISTS billing_event_inbox (
  environment text NOT NULL CHECK(environment IN ('test','live')),
  event_id text NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed')),
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(environment,event_id)
);
CREATE TABLE IF NOT EXISTS billing_payment_snapshot (
  environment text NOT NULL CHECK(environment IN ('test','live')),
  payment_id text NOT NULL,
  user_id text NOT NULL,
  currency text NOT NULL CHECK(currency='usd'),
  synthetic boolean NOT NULL DEFAULT false,
  collected_micro_usd bigint NOT NULL CHECK(collected_micro_usd>=0),
  fee_micro_usd bigint NOT NULL CHECK(fee_micro_usd>=0),
  refunded_micro_usd bigint NOT NULL DEFAULT 0 CHECK(refunded_micro_usd>=0),
  disputed_micro_usd bigint NOT NULL DEFAULT 0 CHECK(disputed_micro_usd>=0),
  settled boolean NOT NULL DEFAULT false,
  spendable_micro_usd bigint NOT NULL DEFAULT 0 CHECK(spendable_micro_usd>=0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(environment,payment_id),
  CHECK(environment='test' OR synthetic=false)
);
CREATE TABLE IF NOT EXISTS billing_funding_adjustment (
  environment text NOT NULL CHECK(environment IN ('test','live')),
  event_id text NOT NULL,
  payment_id text NOT NULL,
  user_id text NOT NULL,
  delta_micro_usd bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(environment,event_id,payment_id),
  FOREIGN KEY(environment,payment_id) REFERENCES billing_payment_snapshot(environment,payment_id)
);
COMMIT;
