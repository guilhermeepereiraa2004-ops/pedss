CREATE TABLE IF NOT EXISTS pedss.order_push_subscriptions (
  store_id text NOT NULL,
  user_id text NOT NULL,
  endpoint text NOT NULL CHECK (length(endpoint) <= 2048),
  p256dh text NOT NULL,
  auth text NOT NULL,
  vapid_key text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, endpoint)
);
ALTER TABLE pedss.order_push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pedss.order_push_subscriptions FROM PUBLIC;

-- The API authenticates and scopes every request. Browser-facing roles cannot read the table.
DO $$
DECLARE browser_role text;
BEGIN
  FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = browser_role) THEN
      EXECUTE format('REVOKE ALL ON pedss.order_push_subscriptions FROM %I', browser_role);
    END IF;
  END LOOP;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'pedss_api') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON pedss.order_push_subscriptions TO pedss_api;
    IF NOT EXISTS (
      SELECT FROM pg_policies WHERE schemaname = 'pedss'
        AND tablename = 'order_push_subscriptions' AND policyname = 'order_push_api'
    ) THEN
      CREATE POLICY order_push_api ON pedss.order_push_subscriptions
        TO pedss_api USING (true) WITH CHECK (true);
    END IF;
  END IF;
END $$;
