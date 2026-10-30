import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
fs.mkdirSync(".quality", { recursive: true });
const npm = process.env.npm_execpath;
if (!npm) throw new Error("Execute o gate com npm run check.");
const steps = [
  ["Lint", npm, "run", "lint"],
  ["Tipos", npm, "run", "typecheck"],
  ["Camadas", "scripts/check-layers.mjs"],
  [
    "Testes",
    "node_modules/vitest/vitest.mjs",
    "run",
    "--reporter=default",
    "--reporter=json",
    "--outputFile=.quality/test-results.json",
  ],
  ["Aceitação", "scripts/acceptance.mjs"],
  ["Build", npm, "run", "build"],
];
for (const [name, ...args] of steps) {
  process.stdout.write(`\n${name}\n`);
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    cwd: path.resolve("."),
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
