import { createHash } from "node:crypto";

const tables = ["rate_limits", "schema_migrations", "workspace"];
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

async function readPayload(db) {
  const workspace = await db.query(
    "SELECT id, data::text AS data, updated_at::text AS updated_at FROM pedss.workspace ORDER BY id",
  );
  if (workspace.rows.length !== 1 || workspace.rows[0].id !== 1)
    throw Error("O banco de origem precisa conter exatamente um workspace válido.");
  const state = JSON.parse(workspace.rows[0].data);
  if (state.version !== 2 || !Array.isArray(state.companies) || !Array.isArray(state.users))
    throw Error("Formato de workspace não reconhecido; nenhuma conversão automática foi feita.");
  const migrations = await db.query(
    "SELECT version, applied_at::text AS applied_at FROM pedss.schema_migrations ORDER BY version",
  );
  const limits = await db.query(
    "SELECT key, hits, expires_at::text AS expires_at FROM pedss.rate_limits ORDER BY key",
  );
  return { workspace: workspace.rows[0], migrations: migrations.rows, rateLimits: limits.rows };
}

export function validateBackup(backup) {
  if (backup?.format !== "pedss-postgres-backup" || backup.version !== 1)
    throw Error("Arquivo de backup não reconhecido.");
  if (digest(backup.payload) !== backup.sha256) throw Error("Integridade do backup inválida.");
  const payload = backup.payload;
  if (
    payload.workspace?.id !== 1 ||
    typeof payload.workspace.data !== "string" ||
    !Array.isArray(payload.migrations) ||
    !Array.isArray(payload.rateLimits)
  )
    throw Error("Estrutura do backup inválida.");
  const state = JSON.parse(payload.workspace.data);
  if (state.version !== 2 || !Array.isArray(state.companies) || !Array.isArray(state.users))
    throw Error("Workspace do backup inválido.");
  return payload;
}

/** The caller owns the connection. This function never writes to the source. */
export async function exportDatabase(db) {
  await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  try {
    await db.query("SET LOCAL TIME ZONE 'UTC'");
    const relations = await db.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'pedss' ORDER BY tablename",
    );
    if (JSON.stringify(relations.rows.map((row) => row.tablename)) !== JSON.stringify(tables))
      throw Error(
        "Há tabelas ausentes ou adicionais em pedss; revise a migração antes de continuar.",
      );
    const payload = await readPayload(db);
    await db.query("COMMIT");
    return {
      format: "pedss-postgres-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      payload,
      sha256: digest(payload),
    };
  } catch (error) {
    await db.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

/** Import only into an empty, already prepared schema. Never replace destination data. */
export async function importDatabase(db, backup) {
  const payload = validateBackup(backup);
  await db.query("BEGIN");
  try {
    await db.query("SET LOCAL TIME ZONE 'UTC'");
    await db.query("SET LOCAL lock_timeout = '10s'");
    await db.query(
      "LOCK TABLE pedss.workspace, pedss.schema_migrations, pedss.rate_limits IN ACCESS EXCLUSIVE MODE",
    );
    const existing = await db.query(
      "SELECT (SELECT count(*) FROM pedss.workspace) + (SELECT count(*) FROM pedss.schema_migrations) + (SELECT count(*) FROM pedss.rate_limits) AS count",
    );
    if (Number(existing.rows[0].count) !== 0)
      throw Error(
        "O destino já contém dados. Importação recusada para não sobrescrever registros.",
      );
    await db.query(
      "INSERT INTO pedss.workspace (id, data, updated_at) VALUES ($1, $2::jsonb, $3::timestamptz)",
      [1, payload.workspace.data, payload.workspace.updated_at],
    );
    for (const row of payload.migrations)
      await db.query(
        "INSERT INTO pedss.schema_migrations (version, applied_at) VALUES ($1, $2::timestamptz)",
        [row.version, row.applied_at],
      );
    for (const row of payload.rateLimits)
      await db.query(
        "INSERT INTO pedss.rate_limits (key, hits, expires_at) VALUES ($1, $2, $3::timestamptz)",
        [row.key, row.hits, row.expires_at],
      );
    const copied = await readPayload(db);
    if (digest(copied) !== backup.sha256)
      throw Error("A conferência após cópia falhou; a transação será desfeita.");
    await db.query("COMMIT");
    return { sha256: backup.sha256, verified: true };
  } catch (error) {
    await db.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

export async function verifyDatabase(db, backup) {
  validateBackup(backup);
  const actual = await exportDatabase(db);
  if (actual.sha256 !== backup.sha256) throw Error("O destino difere do backup de origem.");
  return { sha256: actual.sha256, verified: true };
}
