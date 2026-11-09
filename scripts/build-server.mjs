import { build } from "esbuild";
await build({
  entryPoints: ["server/entry.mjs"],
  outfile: ".server/app.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  external: ["pg", "@vercel/functions", "web-push"],
  sourcemap: false,
});
const { default: handler } = await import("../.server/app.mjs");
await build({
  entryPoints: ["server/updates.mjs"],
  outfile: ".server/updates.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  external: ["pg", "@vercel/functions"],
});
if (typeof handler !== "function") throw new Error("Handler da API inválido.");
console.log("API compilada e carregada com sucesso.");
