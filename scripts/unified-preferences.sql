-- Additive. Apply manually to isolated DB before activation, never automatically.
CREATE TABLE IF NOT EXISTS account_preferences (
 user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
 voice text NOT NULL DEFAULT 'marin' CHECK (voice IN ('marin','cedar')),
 auto_save boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- Voice call IDs are server-only, never authentication credentials.
ALTER TABLE premium_requests ADD COLUMN IF NOT EXISTS provider_call_id text;
CREATE UNIQUE INDEX IF NOT EXISTS premium_call_id ON premium_requests(provider_call_id) WHERE provider_call_id IS NOT NULL;

ALTER TABLE pwa_conversations ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;
ALTER TABLE premium_requests ADD COLUMN IF NOT EXISTS provider_usage jsonb;
ALTER TABLE premium_requests ADD COLUMN IF NOT EXISTS provider_ended_at timestamptz;
