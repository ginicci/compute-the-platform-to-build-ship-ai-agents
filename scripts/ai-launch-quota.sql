-- Apply to an isolated test database first. Do not delete/reset this ledger to
-- grant more trial usage; the lifetime cap protects the initial launch reserve.
CREATE TABLE IF NOT EXISTS ai_launch_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_launch_attempts_user_time ON ai_launch_attempts (user_id, created_at);
