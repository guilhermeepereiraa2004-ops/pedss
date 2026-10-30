import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { postgresConnection } from "../server/postgres-connection.mjs";
import {
  exportDatabase,
  importDatabase,
  verifyDatabase,
  validateBackup,
} from "../server/database-transfer.mjs";

const [command, filename, confirmation] = process.argv.slice(2);
if (
  !["export", "import", "verify"].includes(command) ||
  !filename ||
  (command === "import" && confirmation !== "--apply")
) {
  console.error(
    "Uso: npm run db:transfer -- export|verify arquivo; import arquivo --apply. Informe credenciais pelo arquivo de ambiente, nunca por argumentos.",
  );
  process.exit(1);
}
const root = path.resolve(".quality/backups");
const file = path.resolve(filename);
if (!file.startsWith(root + path.sep))
  throw Error("Guarde backups privados em .quality/backups/ (fora do Git).");
const raw = process.env.DATABASE_URL_UNPOOLED;
if (!raw) throw Error("Configure DATABASE_URL_UNPOOLED no arquivo de ambiente privado.");
if (command !== "export") {
  const url = new URL(raw);
  const ref = process.env.SUPABASE_PROJECT_REF;
  if (
    !ref ||
    !(
      url.hostname === `db.${ref}.supabase.co` ||
      (url.hostname.endsWith(".pooler.supabase.com") &&
        decodeURIComponent(url.username).endsWith(`.${ref}`))
    )
  )
    throw Error("Destino não corresponde ao SUPABASE_PROJECT_REF configurado.");
  if (url.port === "6543") throw Error("Use conexão direta ou Session pooler para transferência.");
}
const client = new pg.Client(postgresConnection(raw, { ca: process.env.DATABASE_SSL_CA }));
try {
  await client.connect();
  if (command === "export") {
    const backup = await exportDatabase(client);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(file, JSON.stringify(backup), { flag: "wx", mode: 0o600 });
    console.log(
      JSON.stringify({
        command,
        file: path.relative(process.cwd(), file),
        sha256: backup.sha256,
        bytes: Buffer.byteLength(JSON.stringify(backup)),
      }),
    );
  } else {
    const backup = JSON.parse(await fs.readFile(file, "utf8"));
    validateBackup(backup);
    const result = await (command === "import" ? importDatabase : verifyDatabase)(client, backup);
    console.log(JSON.stringify({ command, ...result }));
  }
} catch (error) {
  // Driver error messages can contain connection or query details. Keep logs private-data free.
  console.error(
    JSON.stringify({
      command,
      success: false,
      code: error.code || error.name,
      ...(error.code
        ? {}
        : { reason: error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[conexão privada]") }),
    }),
  );
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
