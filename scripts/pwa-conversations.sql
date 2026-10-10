-- Apply to isolated test DB first. No production migration performed by agent.
CREATE TABLE IF NOT EXISTS pwa_conversations (
 id uuid PRIMARY KEY, user_id text NOT NULL, title text NOT NULL,
 messages jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pwa_conversations_user ON pwa_conversations(user_id, updated_at);
