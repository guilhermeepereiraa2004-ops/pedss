CREATE SCHEMA IF NOT EXISTS pedss;
CREATE TABLE IF NOT EXISTS pedss.schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pedss.workspace (
  id smallint PRIMARY KEY CHECK (id = 1),
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pedss.rate_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_expiry ON pedss.rate_limits(expires_at);
