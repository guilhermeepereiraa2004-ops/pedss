-- Private application schema. No legacy/public Supabase tables are modified.
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

REVOKE ALL ON SCHEMA pedss FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA pedss FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pedss REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE pedss.workspace ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedss.schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedss.rate_limits ENABLE ROW LEVEL SECURITY;

-- Supabase's opt-in automatic-RLS event trigger does not need to be callable via RPC.
DO $$ BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
