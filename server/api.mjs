import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { createMemoryRepository } from "../src/adapters/memoryRepository.ts";
import { createLocalAuth } from "../src/adapters/localAuth.ts";
import { createServices } from "../src/application/services.ts";
import { cartSchema, checkoutSchema } from "../src/core/model.ts";
import { DomainError } from "../src/core/errors.ts";
import { quote } from "../src/core/domain.ts";
import { applyCoupon } from "../src/core/coupons.ts";
import { createShippingGateway } from "./shipping.mjs";
import { createPostgresStore } from "./database.mjs";
import { projectState, publicOrder } from "./projection.mjs";
import { requestScope, scopeState } from "./read-model.mjs";
import { remoteServiceCommands, operationCommands } from "../src/application/remoteCommands.js";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const ephemeralViewKey = randomBytes(32);
const versionTag = (value) =>
  createHmac("sha256", process.env.DATABASE_URL || ephemeralViewKey)
    .update(JSON.stringify(value))
    .digest("base64url");
const equalSecret = (a, b) =>
  typeof a === "string" &&
  typeof b === "string" &&
  a.length > 20 &&
  timingSafeEqual(Buffer.from(digest(a)), Buffer.from(digest(b)));
const commands = new Set(remoteServiceCommands);
const authCommands = new Set([
  "signIn",
  "registerTrial",
  "signOut",
  "setup",
  "invite",
  "acceptInvitation",
  "setUserActive",
]);
function cookie(req) {
  return (
    (req.headers.cookie || "")
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("pedss.session="))
      ?.slice(14) || null
  );
}
async function context(initial, token, shipping) {
  const repo = createMemoryRepository(initial);
  let nextToken = token;
  // The existing credential use cases run ONLY on the server; the browser never receives this repository.
  const auth = createLocalAuth(repo, {
    getItem: () => nextToken,
    setItem: (_, value) => {
      nextToken = value;
    },
    removeItem: () => {
      nextToken = null;
    },
  });
  await auth.ready;
  return { repo, auth, services: createServices(repo, auth, shipping), token: () => nextToken };
}
function httpError(message, status) {
  return Object.assign(new Error(message), { status });
}
async function bodyOf(req) {
  if (req.body !== undefined) {
    if (
      Buffer.byteLength(typeof req.body === "string" ? req.body : JSON.stringify(req.body)) >
      3_500_000
    )
      throw httpError("Conteúdo muito grande. Importe em lotes menores.", 413);
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 3_500_000) throw httpError("Conteúdo muito grande.", 413);
  }
  return JSON.parse(raw || "{}");
}

export function createHandler({
  getStore = () => createPostgresStore(),
  setupToken = () => process.env.PEDSS_SETUP_TOKEN,
  shipping = createShippingGateway(),
} = {}) {
  return async function handler(req, res) {
    const requestId = randomUUID();
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Request-Id", requestId);
    try {
      const store = getStore();
      const token = cookie(req);
      const scope = requestScope(req);
      if (req.method === "GET" && scope.kind === "legacy" && store.access) {
        throw httpError("Uma nova versão está disponível. Atualize a página para continuar.", 409);
      }
      const ip = req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
      if (!(await store.limit(`read:${digest(String(ip))}`, 180)))
        throw httpError("Aguarde um minuto e tente novamente.", 429);
      const tracking =
        scope.tracking ||
        (typeof req.headers["x-pedss-tracking"] === "string"
          ? req.headers["x-pedss-tracking"]
          : "");
      let omitCatalog = false;
      const view = (ctx) => ({
        ...(omitCatalog ? { unchanged: { catalog: true, operations: false } } : {}),
        serverNow: new Date().toISOString(),
        state: projectState(
          scopeState(ctx.repo.getSnapshot(), ctx.auth.current(), scope, tracking),
          ctx.auth.current(),
          tracking,
        ),
        identity: ctx.auth.current(),
        setupAvailable: !ctx.repo.getSnapshot().users.some((u) => u.role === "admin"),
      });
      if (req.method === "GET") {
        if (store.access && store.readScoped) {
          for (let attempt = 0; attempt < 3; attempt++) {
            const access = await store.access(token ? digest(token) : "");
            const tag = (revision) =>
              '"' + digest(JSON.stringify([revision, access.identity, scope, tracking])) + '"';
            res.setHeader("Vary", "Cookie, X-Pedss-View, X-Pedss-Tracking");
            res.setHeader("Cache-Control", "private, no-store");
            res.setHeader("ETag", tag(access.revision));
            if (req.headers["if-none-match"] === tag(access.revision)) {
              res.statusCode = 304;
              res.end();
              return;
            }
            const selected = { identity: access.identity, scope, tracking };
            const manifest = store.manifest ? await store.manifest(selected) : null;
            if (manifest && manifest.revision !== access.revision) continue;
            const versions = manifest && {
              catalog: versionTag([access.identity, scope, tracking, "catalog", manifest.catalog]),
              operations: versionTag([
                access.identity,
                scope,
                tracking,
                "operations",
                manifest.operations,
              ]),
            };
            const unchanged = {
              catalog: !!versions && req.headers["x-pedss-catalog"] === versions.catalog,
              operations: !!versions && req.headers["x-pedss-operations"] === versions.operations,
            };
            const meta = {
              serverNow: new Date().toISOString(),
              identity: access.identity,
              setupAvailable: access.setupAvailable,
              versions,
              unchanged,
            };
            if (unchanged.catalog && unchanged.operations)
              return res
                .status(200)
                .json({ ...meta, notModified: true, revision: access.revision });
            const state = await store.readScoped({
              ...selected,
              catalog: !unchanged.catalog,
              operations: !unchanged.operations,
              expectedRevision: access.revision,
            });
            if (!state) continue;
            res.setHeader("ETag", tag(state.revision));
            return res.status(200).json({
              ...meta,
              state: projectState(state, access.identity, tracking),
            });
          }
          throw httpError("Os dados estão sendo atualizados. Tente novamente em um instante.", 409);
        }
        const ctx = await context(await store.read(), token, shipping);
        return res.status(200).json(view(ctx));
      }
      if (req.method !== "POST") {
        res.setHeader("Allow", "GET, POST");
        throw httpError("Método não permitido.", 405);
      }
      const origin = req.headers.origin;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      if (!origin || new URL(origin).host !== host || req.headers["x-pedss-client"] !== "web")
        throw httpError("Origem não autorizada.", 403);
      if (!String(req.headers["content-type"] || "").startsWith("application/json"))
        throw httpError("Use application/json.", 415);
      const { kind, command, args = [] } = await bodyOf(req);
      omitCatalog =
        scope.kind !== "legacy" &&
        !!req.headers["x-pedss-catalog"] &&
        (kind === "checkout" ||
          kind === "shipping" ||
          kind === "coupon" ||
          (kind === "service" && operationCommands.includes(command)));
      if (!Array.isArray(args) || args.length > 6) throw httpError("Comando inválido.", 400);
      if (!(await store.limit(`write:${digest(String(ip))}`, 90)))
        throw httpError("Muitas solicitações. Aguarde.", 429);
      if (kind === "auth" && !(await store.limit(`auth:${digest(String(ip))}`, 15, 300)))
        throw httpError("Muitas tentativas. Aguarde cinco minutos.", 429);
      if (
        kind === "auth" &&
        command === "registerTrial" &&
        !(await store.limit(`signup:${digest(String(ip))}`, 5, 3600))
      )
        throw httpError("Limite de cadastros atingido. Tente novamente mais tarde.", 429);
      let updatedToken = token;
      if (kind === "shipping" && command === "quote") {
        if (!(await store.limit(`shipping:${digest(String(ip))}`, 20, 60)))
          throw httpError("Aguarde um momento antes de calcular outro frete.", 429);
        if (typeof args[0] !== "string" || typeof args[1] !== "string" || !/^\d{8}$/.test(args[1]))
          throw httpError("Informe um CEP válido.", 400);
        const ctx = await context(
          omitCatalog && store.readCommand ? await store.readCommand(args[0]) : await store.read(),
          token,
          shipping,
        );
        return res
          .status(200)
          .json({ ...view(ctx), result: await ctx.services.quoteShipping(args[0], args[1]) });
      }
      const payload = await store.transact(
        async (draft) => {
          const ctx = await context(draft, token, shipping);
          let result;
          if (kind === "auth") {
            if (!authCommands.has(command)) throw httpError("Ação de acesso indisponível.", 400);
            if (command === "setup" && !equalSecret(args[3], setupToken()))
              throw httpError("Código de configuração inválido.", 403);
            result = await ctx.auth[command](...args.slice(0, command === "setup" ? 3 : 6));
            updatedToken = ctx.token();
          } else if (kind === "coupon" && command === "validate") {
            const [storeId, cartInput, code, phone] = args;
            if (
              typeof code !== "string" ||
              code.length > 24 ||
              typeof phone !== "string" ||
              phone.length > 30
            )
              throw httpError("Revise o cupom e o telefone.", 400);
            const tenant = ctx.repo.getSnapshot().tenants[storeId];
            if (!tenant) throw httpError("Estabelecimento não encontrado.", 404);
            result = applyCoupon(
              tenant,
              code,
              quote(cartSchema.parse(cartInput), tenant.products).subtotalCents,
              phone,
            );
          } else if (kind === "service" && commands.has(command)) {
            if (!ctx.auth.current()) throw httpError("Entre na sua conta para continuar.", 401);
            result = await ctx.services[command](...args);
            if (
              result?.trackingToken &&
              result?.lines &&
              !["admin", "owner"].includes(ctx.auth.current().role)
            )
              result = publicOrder(result);
          } else if (kind === "cart" && command === "repeatOrder") {
            if (typeof args[0] !== "string" || typeof args[1] !== "string" || args[1].length > 100)
              throw httpError("Pedido inválido.", 400);
            await ctx.services.repeatOrder(args[0], args[1]);
            result = ctx.repo.getSnapshot().tenants[args[0]].cart.lines;
          } else if (kind === "checkout" && command === "create") {
            const [storeId, cartInput, customer] = args;
            const cart = cartSchema.parse(cartInput);
            if (!cart.lines.length || cart.lines.length > 100)
              throw httpError("Revise a sacola.", 400);
            checkoutSchema.parse(customer);
            const state = ctx.repo.getSnapshot();
            const tenant = state.tenants[storeId];
            if (!tenant) throw httpError("Estabelecimento não encontrado.", 404);
            const fingerprint = digest(JSON.stringify([cart.lines, customer]));
            // Persist content fingerprint with the idempotency key, never trust the requested total.
            const existing = tenant.orders.find((o) => o.requestId === cart.requestId);
            const saved = draft.checkoutRequests?.[`${storeId}:${cart.requestId}`];
            if (existing) {
              if (saved !== fingerprint)
                throw httpError("Chave de pedido já usada com outros dados.", 409);
              result = publicOrder(existing);
            } else {
              tenant.cart = cart;
              result = publicOrder(await ctx.services.checkout(storeId, cart.requestId, customer));
              ctx.repo.getSnapshot().checkoutRequests[`${storeId}:${cart.requestId}`] = fingerprint;
            }
          } else throw httpError("Comando não encontrado.", 400);
          const next = ctx.repo.getSnapshot();
          Object.assign(draft, next);
          // Carts are client-owned and must never be shared between visitors.
          for (const tenant of Object.values(draft.tenants)) tenant.cart.lines = [];
          return { ...view(ctx), result };
        },
        scope.kind === "legacy"
          ? undefined
          : {
              omitMedia: omitCatalog,
              storeId:
                kind === "service" && command === "saveCompany"
                  ? args[0]?.id
                  : kind === "auth"
                    ? null
                    : typeof args[0] === "string"
                      ? args[0]
                      : null,
            },
      );
      if (updatedToken !== token) {
        const secure = process.env.VERCEL || req.headers["x-forwarded-proto"] === "https";
        res.setHeader(
          "Set-Cookie",
          `pedss.session=${updatedToken || ""}; Path=/; HttpOnly; SameSite=Strict; ${secure ? "Secure; " : ""}Max-Age=${updatedToken ? 28800 : 0}`,
        );
      }
      return res.status(200).json(payload);
    } catch (error) {
      const validation = error.name === "ZodError" || error instanceof SyntaxError;
      const status = error.status || (error.name === "DomainError" || validation ? 400 : 503);
      // Log identifiers and class only, never payloads, tokens, emails or connection strings.
      if (status >= 500) console.error(JSON.stringify({ requestId, error: error.name }));
      return res.status(status).json({
        error: {
          code:
            status === 401
              ? "UNAUTHENTICATED"
              : status === 403
                ? "FORBIDDEN"
                : status === 409
                  ? "CONFLICT"
                  : "UNAVAILABLE",
          message:
            status >= 500
              ? "Serviço temporariamente indisponível. Tente novamente."
              : validation
                ? "Revise os dados enviados."
                : error instanceof DomainError || error.status
                  ? error.message
                  : "Solicitação inválida.",
          requestId,
        },
      });
    }
  };
}
