import { DomainError, emptyCart, finance } from "../core/domain.ts";
import { createServices } from "./services.ts";
import { cartStorage } from "../adapters/cartStorage.js";
import { cartSchema } from "../core/model.ts";
import { startLiveUpdates } from "./liveUpdates";
import { viewScope } from "./viewScope";

const CART_KEY = "pedss.carts.v1";
/** Only carts persist in this browser. All authoritative state comes from sanitized API projections. */
export function createRemoteRuntime({ storage = cartStorage(), fetcher = fetch } = {}) {
  let state = {
    version: 2,
    revision: 0,
    companies: [],
    tenants: {},
    users: [],
    invitations: [],
    sessions: [],
    resets: [],
    platform: { name: "Pedss", supportEmail: "", description: "" },
  };
  let identity = null,
    carts = {},
    warning = "",
    setupAvailable = false,
    generation = 0,
    serverOffset = 0,
    writeEpoch = 0,
    pendingWrites = 0,
    appliedSequence = 0,
    refreshAgain = false;
  const pendingReads = new Map();
  let cachedRead = null;
  const flushRefresh = () => {
    if (refreshAgain && !pendingWrites && !pendingReads.size) {
      refreshAgain = false;
      queueMicrotask(() => void refresh().catch(() => {}));
    }
  };
  const listeners = new Set(),
    authListeners = new Set();
  try {
    carts = JSON.parse(storage.getItem(CART_KEY) || "{}");
  } catch {
    carts = {};
  }
  carts = Object.fromEntries(
    Object.entries(carts && typeof carts === "object" ? carts : {}).flatMap(([id, value]) => {
      const parsed = cartSchema.safeParse(value);
      return parsed.success ? [[id, parsed.data]] : [];
    }),
  );
  const notify = () => {
    for (const fn of listeners) fn();
    for (const fn of authListeners) fn();
  };
  function persistCarts() {
    carts = {
      ...carts,
      ...Object.fromEntries(Object.entries(state.tenants).map(([id, t]) => [id, t.cart])),
    };
    try {
      storage.setItem(CART_KEY, JSON.stringify(carts));
    } catch {
      warning = "A sacola não pôde ser salva neste navegador.";
    }
  }
  function apply(payload) {
    if (Number.isFinite(Date.parse(payload.serverNow)))
      serverOffset = Date.parse(payload.serverNow) - Date.now();
    if (payload.notModified) state = { ...state, revision: payload.revision };
    else {
      const next = payload.state;
      if (payload.unchanged?.catalog) {
        next.companies = state.companies;
        next.platform = state.platform;
        for (const [id, tenant] of Object.entries(next.tenants)) {
          const previous = state.tenants[id];
          if (previous)
            for (const field of ["products", "settings", "online", "coupons"])
              tenant[field] = previous[field];
        }
      }
      if (payload.unchanged?.operations) {
        next.users = state.users;
        next.invitations = state.invitations;
        for (const [id, tenant] of Object.entries(next.tenants)) {
          const previous = state.tenants[id];
          if (previous) for (const field of ["orders", "expenses"]) tenant[field] = previous[field];
        }
      }
      state = next;
    }
    identity = payload.identity;
    setupAvailable = payload.setupAvailable;
    for (const [id, t] of Object.entries(state.tenants)) t.cart = carts[id] || emptyCart();
    warning = "";
    notify();
  }
  async function request(body) {
    const sequence = ++generation;
    if (body) {
      writeEpoch++;
      pendingWrites++;
    }
    const epoch = writeEpoch;
    const scope = viewScope();
    const scopeKey = JSON.stringify(scope);
    const tracking = window.location.pathname.match(/^\/pedido\/([a-f\d-]{36,100})$/i)?.[1];
    try {
      const response = await fetcher("/api/app", {
        method: body ? "POST" : "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "X-Pedss-Client": "web",
          "X-Pedss-View": scopeKey,
          ...(cachedRead?.scope === scopeKey
            ? {
                ...(!body && cachedRead.etag ? { "If-None-Match": cachedRead.etag } : {}),
                ...(cachedRead.catalog ? { "X-Pedss-Catalog": cachedRead.catalog } : {}),
                ...(cachedRead.operations ? { "X-Pedss-Operations": cachedRead.operations } : {}),
              }
            : {}),
          ...(tracking ? { "X-Pedss-Tracking": tracking } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (!body && response.status === 304) {
        if (scopeKey === JSON.stringify(viewScope())) {
          warning = "";
          notify();
        }
        return;
      }
      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new DomainError("O servidor não respondeu. Tente novamente.");
      }
      if (!response.ok)
        throw new DomainError(payload.error?.message || "Não foi possível concluir.");
      const currentTracking = window.location.pathname.match(
        /^\/pedido\/([a-f\d-]{36,100})$/i,
      )?.[1];
      if (
        sequence > appliedSequence &&
        (body ||
          (epoch === writeEpoch &&
            tracking === currentTracking &&
            scopeKey === JSON.stringify(viewScope())))
      ) {
        appliedSequence = sequence;
        const previousIdentity = JSON.stringify(identity);
        apply(payload);
        if (body && payload.unchanged?.catalog) refreshAgain = true;
        const etag = response.headers?.get("ETag");
        cachedRead =
          !body && etag
            ? { scope: scopeKey, etag, ...payload.versions }
            : body &&
                body.kind !== "auth" &&
                previousIdentity === JSON.stringify(identity) &&
                cachedRead?.scope === scopeKey
              ? { ...cachedRead, etag: null }
              : null;
      } else if (!body && epoch !== writeEpoch) refreshAgain = true;
      return payload.result;
    } finally {
      if (body) {
        pendingWrites--;
        flushRefresh();
      }
    }
  }
  const repository = {
    getSnapshot: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    get warning() {
      return warning;
    },
    async transact(work) {
      const next = structuredClone(state);
      const result = await work(next);
      state = next;
      persistCarts();
      notify();
      return result;
    },
  };
  const auth = {
    current: () => identity,
    identity: () => identity,
    get setupAvailable() {
      return setupAvailable;
    },
    subscribe(fn) {
      authListeners.add(fn);
      return () => authListeners.delete(fn);
    },
    signIn: (...args) => request({ kind: "auth", command: "signIn", args }),
    registerTrial: (input) => request({ kind: "auth", command: "registerTrial", args: [input] }),
    signOut: () => request({ kind: "auth", command: "signOut" }),
    setup: (...args) => request({ kind: "auth", command: "setup", args }),
    invite: (...args) => request({ kind: "auth", command: "invite", args }),
    acceptInvitation: (...args) => request({ kind: "auth", command: "acceptInvitation", args }),
    setUserActive: (...args) => request({ kind: "auth", command: "setUserActive", args }),
    requestReset: async () => {
      throw new DomainError(
        "A recuperação por e-mail ainda não está configurada. Entre em contato com o administrador.",
      );
    },
    reset: async () => {
      throw new DomainError("Use um link emitido pelo administrador.");
    },
  };
  const local = createServices(repository, auth);
  const services = {
    finance,
    addToCart: local.addToCart,
    changeCart: local.changeCart,
    clearCart: local.clearCart,
    updateCartLine: local.updateCartLine,
  };
  services.validateCoupon = (...args) => request({ kind: "coupon", command: "validate", args });
  services.quoteShipping = (...args) => request({ kind: "shipping", command: "quote", args });
  for (const command of [
    "saveCompany",
    "activatePlan",
    "archiveCompany",
    "restoreCompany",
    "saveProduct",
    "removeProduct",
    "exportCatalog",
    "importCatalog",
    "saveCoupon",
    "saveExpense",
    "voidExpense",
    "saveSettings",
    "saveShipping",
    "configureStore",
    "setOnline",
    "savePlatform",
    "changeOrder",
    "changePayment",
  ]) {
    services[command] = (...args) => request({ kind: "service", command, args });
  }
  services.checkout = async (id, requestId, input) => {
    const cart = state.tenants[id]?.cart;
    if (!cart || cart.requestId !== requestId)
      throw new DomainError("A sacola mudou. Confira os itens.");
    const result = await request({ kind: "checkout", command: "create", args: [id, cart, input] });
    await local.clearCart(id);
    return result;
  };
  async function refresh() {
    if (pendingWrites) {
      refreshAgain = true;
      return;
    }
    const key = JSON.stringify(viewScope());
    if (pendingReads.has(key)) return pendingReads.get(key);
    const operation = (async () => {
      try {
        await request();
      } catch (error) {
        warning = error.message || "Sem conexão. Tente novamente.";
        notify();
        throw error;
      }
    })();
    pendingReads.set(key, operation);
    try {
      return await operation;
    } finally {
      if (pendingReads.get(key) === operation) pendingReads.delete(key);
      flushRefresh();
    }
  }
  auth.ready = refresh();
  return {
    mode: "remote",
    repository,
    auth,
    services,
    refresh,
    startSync: () =>
      viewScope().kind === "auth"
        ? () => {}
        : startLiveUpdates({
            refresh,
            getRevision: () => state.revision,
            onRevision: () => {
              if (cachedRead) cachedRead.etag = null;
            },
            background: viewScope().kind === "dashboard",
          }),
    now: () => new Date(Date.now() + serverOffset),
  };
}
