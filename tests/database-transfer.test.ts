import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs/promises";
import {
  exportDatabase,
  importDatabase,
  validateBackup,
  verifyDatabase,
} from "../server/database-transfer.mjs";
import { postgresConnection } from "../server/postgres-connection.mjs";

let source: PGlite, target: PGlite, schema: string;
const original = {
  version: 2,
  revision: 17,
  companies: [{ id: "immutable-store", name: "Loja" }],
  users: [{ id: "master", passwordHash: "preserve-exactly", passwordSalt: "salt" }],
  sessions: [{ tokenHash: "opaque-existing-digest" }],
  tenants: {
    "immutable-store": {
      products: [{ priceCents: 4490 }],
      orders: [{ id: "sale", totalCents: 4490 }],
    },
  },
  legacyUnknownField: { keep: true },
};
beforeAll(async () => {
  schema = await fs.readFile(new URL("../migrations/001_initial.sql", import.meta.url), "utf8");
  source = new PGlite();
  target = new PGlite();
  await source.exec(schema);
  await target.exec(schema);
}, 30000);
beforeEach(async () => {
  for (const db of [source, target])
    await db.exec("TRUNCATE pedss.workspace, pedss.schema_migrations, pedss.rate_limits");
  await source.query(
    "INSERT INTO pedss.workspace (id, data, updated_at) VALUES (1, $1, '2026-10-30 12:00:00.123456+00')",
    [JSON.stringify(original)],
  );
  await source.exec(
    "INSERT INTO pedss.schema_migrations(version) VALUES ('001'); INSERT INTO pedss.rate_limits(key,hits,expires_at) VALUES ('private-key',3,'2026-10-30 13:00:00.654321+00')",
  );
});
afterAll(async () => {
  await source?.close();
  await target?.close();
});

it("preserves legacy fields, credentials, tokens, IDs, cents and timestamps exactly", async () => {
  const backup = await exportDatabase(source);
  expect(await importDatabase(target, backup)).toEqual({ sha256: backup.sha256, verified: true });
  expect(await verifyDatabase(target, backup)).toEqual({ sha256: backup.sha256, verified: true });
  const copied = await exportDatabase(target);
  expect(copied.payload).toEqual(backup.payload);
  expect(JSON.parse(copied.payload.workspace.data)).toEqual(original);
  expect(await exportDatabase(source)).toMatchObject({ sha256: backup.sha256 });
});

it("refuses an occupied destination without overwriting anything", async () => {
  const backup = await exportDatabase(source);
  await target.query("INSERT INTO pedss.workspace(id,data) VALUES(1,$1)", [
    JSON.stringify({ ...original, revision: 99 }),
  ]);
  await expect(importDatabase(target, backup)).rejects.toThrow("destino já contém dados");
  const remaining = await target.query<{ revision: string }>(
    "SELECT data->>'revision' AS revision FROM pedss.workspace",
  );
  expect(remaining.rows[0].revision).toBe("99");
});

it("rejects modified backups before opening a destination transaction", async () => {
  const backup = await exportDatabase(source);
  backup.payload.workspace.data = JSON.stringify({ ...original, revision: 999 });
  expect(() => validateBackup(backup)).toThrow("Integridade");
  await expect(importDatabase(target, backup)).rejects.toThrow("Integridade");
  const count = await target.query<{ count: number }>(
    "SELECT count(*)::int AS count FROM pedss.workspace",
  );
  expect(count.rows[0].count).toBe(0);
});

it("rolls back the complete destination if an insertion fails", async () => {
  const backup = await exportDatabase(source);
  const failing = {
    query: async (sql: string, values?: unknown[]) => {
      if (sql.startsWith("INSERT INTO pedss.rate_limits")) throw Error("simulated write failure");
      return target.query(sql, values);
    },
  };
  await expect(importDatabase(failing, backup)).rejects.toThrow("simulated write failure");
  const count = await target.query<{ count: number }>(
    "SELECT count(*)::int AS count FROM pedss.workspace",
  );
  expect(count.rows[0].count).toBe(0);
  expect((await target.query("SELECT * FROM pedss.schema_migrations")).rows).toHaveLength(0);
});

it("refuses unknown source tables and detects divergence after transfer", async () => {
  const backup = await exportDatabase(source);
  await importDatabase(target, backup);
  await target.exec("UPDATE pedss.workspace SET data=jsonb_set(data,'{revision}','18')");
  await expect(verifyDatabase(target, backup)).rejects.toThrow("difere");
  await source.exec("CREATE TABLE pedss.unmapped_data(id int)");
  try {
    await expect(exportDatabase(source)).rejects.toThrow("tabelas ausentes ou adicionais");
  } finally {
    await source.exec("DROP TABLE pedss.unmapped_data");
  }
});

it("verifies TLS even if the supplied URL requests insecure settings", () => {
  const options = postgresConnection(
    "postgresql://user:password@db.example.com:6543/postgres?sslmode=disable&sslrootcert=elsewhere&application_name=pedss",
    { ca: "-----BEGIN CERTIFICATE-----\\nCA\\n-----END CERTIFICATE-----" },
  );
  expect(options.ssl).toEqual({
    rejectUnauthorized: true,
    ca: "-----BEGIN CERTIFICATE-----\nCA\n-----END CERTIFICATE-----",
  });
  const url = new URL(options.connectionString);
  expect(url.searchParams.has("sslmode")).toBe(false);
  expect(url.searchParams.has("sslrootcert")).toBe(false);
  expect(url.searchParams.get("application_name")).toBe("pedss");
  expect(postgresConnection("postgres://u:p@db.example.com/postgres").ssl).toEqual({
    rejectUnauthorized: true,
  });
  expect(() => postgresConnection("invalid")).toThrow("inválida");
  expect(() => postgresConnection("https://example.com")).toThrow("PostgreSQL");
});

it("keeps the Supabase schema private with RLS and preserves all existing data", async () => {
  const hardening = await fs.readFile(
    new URL("../supabase/migrations/20261030135339_harden_pedss_schema.sql", import.meta.url),
    "utf8",
  );
  await target.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;");
  await target.query("INSERT INTO pedss.workspace(id,data) VALUES(1,$1)", [
    JSON.stringify(original),
  ]);
  await target.exec(hardening);
  const protection = await target.query<{ name: string; rls: boolean }>(
    "SELECT relname AS name, relrowsecurity AS rls FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='pedss' AND c.relkind='r' ORDER BY name",
  );
  expect(protection.rows).toEqual([
    { name: "rate_limits", rls: true },
    { name: "schema_migrations", rls: true },
    { name: "workspace", rls: true },
  ]);
  for (const role of ["anon", "authenticated", "service_role"]) {
    await target.exec(`SET ROLE ${role}`);
    try {
      await expect(target.query("SELECT data FROM pedss.workspace")).rejects.toThrow(
        /permission denied/i,
      );
    } finally {
      await target.exec("RESET ROLE");
    }
  }
  const preserved = await target.query<{ data: unknown }>("SELECT data FROM pedss.workspace");
  expect(preserved.rows[0].data).toEqual(original);
});
