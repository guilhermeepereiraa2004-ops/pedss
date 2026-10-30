import pg from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { workspaceSchema } from "../src/core/model.ts";
import { postgresConnection } from "./postgres-connection.mjs";
import {
  readAccess,
  readScoped,
  readManifest,
  readWriteSnapshot,
  writeChanges,
} from "./read-model.mjs";

let pool;
const revisions = new WeakMap();
async function readRevision(db) {
  const cached = revisions.get(db);
  if (cached && cached.until > Date.now()) return cached.value;
  const entry = { until: Infinity, value: null };
  entry.value = db
    .query("SELECT (data->>'revision')::bigint AS revision FROM pedss.workspace WHERE id = 1")
    .then(({ rows }) => {
      if (!rows[0]) throw Error("Banco não inicializado.");
      entry.until = Date.now() + 500;
      return Number(rows[0].revision);
    })
    .catch((error) => {
      if (revisions.get(db) === entry) revisions.delete(db);
      throw error;
    });
  revisions.set(db, entry);
  return entry.value;
}
export function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL ausente.");
  if (!pool) {
    pool = new pg.Pool({
      ...postgresConnection(process.env.DATABASE_URL, { ca: process.env.DATABASE_SSL_CA }),
      max: 1,
      idleTimeoutMillis: 5000,
    });
    attachDatabasePool(pool);
  }
  return pool;
}

/** One transaction per command. The row lock prevents lost updates across instances. */
export function createPostgresStore(db = database()) {
  return {
    access: (tokenHash) => readAccess(db, tokenHash),
    readScoped: (view) => readScoped(db, view),
    manifest: (view) => readManifest(db, view),
    readCommand: async (storeId) =>
      workspaceSchema.parse(await readWriteSnapshot(db, storeId, true, false)),
    revision: () => readRevision(db),
    async read() {
      const { rows } = await db.query("SELECT data FROM pedss.workspace WHERE id = 1");
      if (!rows[0]) throw new Error("Execute npm run db:migrate.");
      return workspaceSchema.parse(rows[0].data);
    },
    async transact(work, selection) {
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        await client.query("SET LOCAL lock_timeout = '10s'");
        const raw = selection
          ? await readWriteSnapshot(client, selection.storeId, selection.omitMedia)
          : (await client.query("SELECT data FROM pedss.workspace WHERE id = 1 FOR UPDATE")).rows[0]
              ?.data;
        if (!raw) throw new Error("Banco não inicializado.");
        const state = workspaceSchema.parse(raw);
        const before = structuredClone(state);
        const result = await work(state);
        state.revision++;
        if (result?.state) result.state.revision = state.revision;
        await writeChanges(client, before, workspaceSchema.parse(state));
        await client.query("COMMIT");
        revisions.delete(db);
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async limit(key, maximum, seconds = 60) {
      const { rows } = await db.query(
        `INSERT INTO pedss.rate_limits (key, hits, expires_at)
        VALUES ($1, 1, now() + $2 * interval '1 second')
        ON CONFLICT (key) DO UPDATE SET
          hits = CASE WHEN pedss.rate_limits.expires_at < now() THEN 1 ELSE pedss.rate_limits.hits + 1 END,
          expires_at = CASE WHEN pedss.rate_limits.expires_at < now() THEN now() + $2 * interval '1 second' ELSE pedss.rate_limits.expires_at END
        RETURNING hits`,
        [key, seconds],
      );
      return rows[0].hits <= maximum;
    },
  };
}
