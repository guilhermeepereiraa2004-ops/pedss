import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
const team = "diegos-projects-2f58d897";
const linked = JSON.parse(fs.readFileSync(".vercel/project.json", "utf8"));
if (
  linked.orgId !== "team_31LF1BKscdWn5gGQQgAxp4c1" ||
  linked.projectId !== "prj_wQ4WydtpnP5OS36ei515W9GpoVxV"
)
  throw new Error("Projeto divergente.");
const cli = path.join(process.env.APPDATA, "npm/node_modules/vercel/dist/vc.js");
function vc(args, value) {
  const result = spawnSync(process.execPath, [cli, ...args, "--scope", team, "--non-interactive"], {
    input: value,
    encoding: "utf8",
    env: { ...process.env, NO_UPDATE_NOTIFIER: "1", VERCEL_ENABLE_AGENTS: "0" },
  });
  if (result.status !== 0) throw new Error(`Falha na configuração de ${args[2]}: ${result.stderr}`);
  console.log(`Configurado: ${args[2]} (${args[3]})`);
}
fs.mkdirSync(".quality", { recursive: true });
const secretFile = ".quality/pedss-setup-token.local";
const token = fs.existsSync(secretFile)
  ? fs.readFileSync(secretFile, "utf8").trim()
  : randomBytes(32).toString("base64url");
fs.writeFileSync(secretFile, token);
for (const target of ["production,preview", "development"])
  vc(["env", "add", "PEDSS_SETUP_TOKEN", target, "--yes"], token);
vc(
  [
    "env",
    "add",
    "VITE_RUNTIME_MODE",
    "production,preview,development",
    "--yes",
    "--type",
    "config",
  ],
  "remote",
);
let env = fs.readFileSync(".env.local", "utf8");
for (const [key, value] of Object.entries({
  PEDSS_SETUP_TOKEN: token,
  VITE_RUNTIME_MODE: "remote",
})) {
  env = env.replace(new RegExp(`^${key}=.*\\r?\\n?`, "gm"), "");
  env += `\n${key}=${value}\n`;
}
fs.writeFileSync(".env.local", env);
linked.projectName = "pedss";
fs.writeFileSync(".vercel/project.json", JSON.stringify(linked));
fs.writeFileSync(
  ".quality/primeiro-acesso-pedss.local.txt",
  `Pedss — primeiro acesso\n\nAbra a URL de produção e acrescente /configurar-acesso#${token}\n\nCódigo privado: ${token}\n\nEsse código só funciona até criar a primeira conta administrativa. Não compartilhe.\n`,
);
console.log(
  "Código e instruções guardados em .quality/primeiro-acesso-pedss.local.txt; valor não exibido.",
);
