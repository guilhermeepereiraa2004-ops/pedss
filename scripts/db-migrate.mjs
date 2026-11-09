import fs from "node:fs/promises";
import pg from "pg";
import { seedWorkspace } from "../server/seed.mjs";
import { postgresConnection } from "../server/postgres-connection.mjs";
const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error("DATABASE_URL_UNPOOLED ausente. Puxe as variáveis da Vercel.");
const client = new pg.Client(postgresConnection(url, { ca: process.env.DATABASE_SSL_CA }));
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext('pedss-migrations'))");
  for (const [version, file] of [
    ["001", "001_initial.sql"],
    ["002", "002_order_push.sql"],
  ]) {
    await client.query(await fs.readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8"));
    await client.query(
      "INSERT INTO pedss.schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING",
      [version],
    );
  }
  await client.query(
    "INSERT INTO pedss.workspace (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING",
    [JSON.stringify(seedWorkspace())],
  );
  await client.query("DELETE FROM pedss.rate_limits WHERE expires_at < now()");
  await client.query("COMMIT");
  console.log("Migrações aplicadas. Dados existentes preservados.");
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Migração não aplicada:", error.code || error.name);
  process.exitCode = 1;
} finally {
  await client.end();
}
