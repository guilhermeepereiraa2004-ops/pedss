import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
const allowed = {
  core: ["core"],
  adapters: ["core", "adapters"],
  application: ["core", "adapters", "application", "lib"],
  hooks: ["core", "application", "hooks"],
  components: ["core", "application", "hooks", "components", "lib"],
  pages: ["core", "application", "hooks", "components", "pages", "lib"],
  lib: ["lib"],
};
export function violationsFor(file, code) {
  const normalized = file.replaceAll("\\", "/"),
    layer = normalized.split("/")[1],
    violations = [];
  const source = parse(code, {
    sourceType: "module",
    plugins: file.endsWith(".ts") ? ["typescript"] : ["jsx"],
  });
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    let specifier;
    if (
      [
        "ImportDeclaration",
        "ExportNamedDeclaration",
        "ExportAllDeclaration",
        "ImportExpression",
      ].includes(node.type)
    )
      specifier = node.source?.value;
    if (node.type === "CallExpression" && node.callee?.type === "Import")
      specifier = node.arguments[0]?.value;
    if (specifier?.startsWith(".")) {
      const target = path.posix.normalize(
        path.posix.join(path.posix.dirname(normalized), specifier),
      );
      const targetLayer = target.split("/")[1];
      if (
        allowed[layer] &&
        !allowed[layer].includes(targetLayer) &&
        !/\.(css|png|svg|jpg)$/.test(specifier)
      )
        violations.push(`${file}: ${layer} não pode importar ${targetLayer} (${specifier})`);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object" && "type" in value) visit(value);
    }
  };
  visit(source);
  if (
    !["adapters", "application"].includes(layer) &&
    /\b(localStorage|sessionStorage)\b/.test(code)
  )
    violations.push(`${file}: armazenamento deve ficar em adaptadores`);
  return violations;
}
export function check(root = "src") {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(js|jsx|ts)$/.test(file)) files.push(file);
    }
  };
  walk(root);
  return files.flatMap((file) => violationsFor(file, fs.readFileSync(file, "utf8")));
}
if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  const violations = process.argv.includes("--fixture-violation")
    ? violationsFor("src/core/fixture.ts", "import UI from '../pages/Dashboard';")
    : check();
  if (violations.length) {
    process.stderr.write(violations.join("\n") + "\n");
    process.exitCode = 1;
  } else process.stdout.write("Dependências entre camadas verificadas.\n");
}
