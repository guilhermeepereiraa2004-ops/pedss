import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";
import { localRuntimeMode } from "./scripts/local-runtime.mjs";

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => ({
  ...(command === "serve"
    ? {
        define: {
          "import.meta.env.VITE_RUNTIME_MODE": JSON.stringify(
            localRuntimeMode(loadEnv(mode, process.cwd(), "")),
          ),
        },
      }
    : {}),
  optimizeDeps: { include: ["onnxruntime-web/wasm"] },
  plugins: [
    react(),
    {
      name: "pedss-local-api",
      async configureServer(server) {
        const env = loadEnv(mode, process.cwd(), "");
        for (const name of ["OPENROUTESERVICE_API_KEY", "PEDSS_QUOTE_SECRET"])
          if (env[name]) process.env[name] = env[name];
        const { createPostalRouting } = await import("./server/routing.mjs");
        const route = createPostalRouting();
        server.middlewares.use("/api/route", async (req, res) => {
          res.setHeader("Cache-Control", "no-store");
          res.setHeader("Content-Type", "application/json");
          try {
            if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)
              throw Error("Invalid origin");
            if (!String(req.headers["content-type"] || "").startsWith("application/json"))
              throw Error("Invalid content type");
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: "Use POST." }));
              return;
            }
            let raw = "";
            for await (const chunk of req) {
              raw += chunk;
              if (raw.length > 500) throw Error("Invalid body");
            }
            const { origin, destination } = JSON.parse(raw);
            res.end(JSON.stringify(await route(origin, destination)));
          } catch (error) {
            res.statusCode = 400;
            res.end(
              JSON.stringify({
                error:
                  error.name === "DomainError"
                    ? error.message
                    : "Não foi possível calcular o percurso.",
              }),
            );
          }
        });
        if (localRuntimeMode(env) !== "remote") {
          if (env.VITE_RUNTIME_MODE === "remote")
            server.config.logger.info(
              "Demonstração local: conexão PostgreSQL remota desativada. Para acesso remoto intencional, configure PEDSS_ALLOW_REMOTE_DATABASE=true.",
            );
          return;
        }
        for (const name of [
          "DATABASE_URL", "DATABASE_SSL_CA", "PEDSS_SETUP_TOKEN",
          "PEDSS_PUSH_PUBLIC_KEY", "PEDSS_PUSH_PRIVATE_KEY", "PEDSS_PUSH_SUBJECT",
        ])
          if (env[name]) process.env[name] = env[name];
        const { createHandler } = await import("./server/api.mjs");
        const handler = createHandler();
        const { createUpdatesHandler } = await import("./server/updates.mjs");
        server.middlewares.use("/api/updates", createUpdatesHandler());
        server.middlewares.use("/api/app", (req, res) => {
          res.status = (value) => {
            res.statusCode = value;
            return res;
          };
          res.json = (value) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(value));
          };
          handler(req, res);
        });
      },
    },
  ],
}));
