import { createHash } from "node:crypto";
import { createPostgresStore } from "./database.mjs";
export function createUpdatesHandler({
  getStore = () => createPostgresStore(),
  durationMs = 24_000,
  intervalMs = 1500,
} = {}) {
  return async function updates(req, res) {
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.setHeader("Allow", "GET");
      res.end();
      return;
    }
    if (req.headers["sec-fetch-site"] === "cross-site") {
      res.statusCode = 403;
      res.end();
      return;
    }
    if (req.url && new URL(req.url, "http://internal").searchParams.get("v") !== "2") {
      res.statusCode = 409;
      res.end();
      return;
    }
    let closed = false;
    const close = () => {
      closed = true;
    };
    res.on("close", close);
    try {
      const store = getStore(),
        ip = String(req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown");
      if (!(await store.limit("updates:" + createHash("sha256").update(ip).digest("hex"), 60))) {
        res.statusCode = 429;
        res.end();
        return;
      }
      const revision = () =>
        store.revision ? store.revision() : store.read().then((s) => s.revision);
      let previous = await revision();
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-store, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders?.();
      res.write("retry: 1500\n: connected\n\n");
      const until = Date.now() + durationMs;
      res.write(`event: revision\ndata: ${JSON.stringify({ revision: previous })}\n\n`);
      while (!closed && Date.now() < until) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        if (closed) break;
        const next = await revision();
        if (next !== previous) {
          res.write(`event: change\ndata: ${JSON.stringify({ revision: next })}\n\n`);
          previous = next;
        } else res.write(": heartbeat\n\n");
      }
    } catch {
      if (!res.headersSent) res.statusCode = 503;
    } finally {
      res.off("close", close);
      if (!closed) res.end();
    }
  };
}
export default createUpdatesHandler();
