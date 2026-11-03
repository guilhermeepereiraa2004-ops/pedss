import { beforeAll, afterAll, beforeEach, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { createPostgresStore } from "../server/database.mjs";
import { createHandler } from "../server/api.mjs";
import { fixture, cartLine, checkout } from "./fixtures.ts";
import { tokenDigest } from "../src/adapters/localAuth.ts";
import { isDeepStrictEqual } from "node:util";
import { pizzaProduct, pizzaLine } from "./pizza-fixture.ts";
import { orderFixture, changeInput } from "./order-amendment-fixture.ts";

// Execute the real SQL in PostgreSQL/WASM. Never load .env or contact Neon.
let db: PGlite, store: ReturnType<typeof createPostgresStore>, seed: any, token: string, order: any;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    "CREATE SCHEMA pedss; CREATE TABLE pedss.workspace (id int PRIMARY KEY, data jsonb, updated_at timestamptz DEFAULT now()); CREATE TABLE pedss.rate_limits (key text PRIMARY KEY, hits int, expires_at timestamptz);",
  );
  const f = await fixture();
  await f.services.addToCart("store-one", cartLine);
  order = await f.services.checkout(
    "store-one",
    f.repo.getSnapshot().tenants["store-one"].cart.requestId,
    checkout,
  );
  token = f.auth.getToken()!;
  seed = structuredClone(f.repo.getSnapshot());
  const other = { ...seed.companies[0], id: "store-two", slug: "outra", name: "Outra loja" };
  seed.companies.push(other);
  seed.tenants[other.id] = structuredClone(seed.tenants["store-one"]);
  seed.tenants[other.id].products[0].image = "data:image/png;base64," + "A".repeat(300_000);
  seed.tenants[other.id].orders[0].trackingToken = "other-tracking-token";
  seed.tenants[other.id].orders[0].customer.name = "Cliente privado da outra loja";
  seed.users.push({
    ...seed.users[0],
    id: "other-owner",
    storeId: other.id,
    email: "other@example.com",
    passwordHash: "never-transfer-secret",
  });
  seed.users.push({
    ...seed.users[0],
    id: "master",
    role: "admin",
    storeId: null,
    email: "master@example.com",
  });
  seed.sessions.push({
    ...seed.sessions[0],
    userId: "master",
    tokenHash: await tokenDigest("master-test-token"),
  });
  store = createPostgresStore({
    query: (...args: Parameters<PGlite["query"]>) => db.query(...args),
    connect: async () => ({
      query: (...args: Parameters<PGlite["query"]>) => db.query(...args),
      release() {},
    }),
  });
}, 30_000);
beforeEach(async () => {
  await db.query(
    "INSERT INTO pedss.workspace (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = $1",
    [JSON.stringify(seed)],
  );
});
afterAll(async () => {
  await db?.close();
});

it("SUBDOMAIN-07 PostgreSQL resolve alias sem hífen com o mesmo isolamento de sessão", async () => {
  const state = structuredClone(seed);
  state.companies[0].slug = "cia-da-pizza";
  state.revision++;
  await db.query("UPDATE pedss.workspace SET data=$1 WHERE id=1", [JSON.stringify(state)]);
  const publicView = await request({ kind: "store", store: "ciadapizza" });
  expect(publicView.statusCode).toBe(200);
  expect(publicView.body.state.companies.map((c: any) => c.slug)).toEqual(["cia-da-pizza"]);
  expect(publicView.body.state.tenants["store-one"].orders).toEqual([]);
  expect(publicView.body.state.users).toEqual([]);
  const ownView = await request({ kind: "dashboard", store: "ciadapizza" }, token);
  expect(ownView.body.state.tenants["store-one"].orders).toHaveLength(1);
  expect(JSON.stringify(ownView.body)).not.toContain("Cliente privado da outra loja");
  const foreign = await request({ kind: "dashboard", store: "outra" }, token);
  expect(foreign.body.state.tenants["store-two"].orders).toEqual([]);
});

it("SUBDOMAIN-08 PostgreSQL e projeção rejeitam alias ambíguo e priorizam slug exato", async () => {
  const state = structuredClone(seed);
  state.companies[0].slug = "cia-da-pizza";
  state.companies[1].slug = "ciadapizz-a";
  state.revision++;
  await db.query("UPDATE pedss.workspace SET data=$1 WHERE id=1", [JSON.stringify(state)]);
  const ambiguous = await store.readScoped({
    identity: null,
    scope: { kind: "store", store: "ciadapizza" },
  });
  expect(ambiguous.companies).toEqual([]);
  state.companies[1].slug = "ciadapizza";
  state.revision++;
  await db.query("UPDATE pedss.workspace SET data=$1 WHERE id=1", [JSON.stringify(state)]);
  const exact = await store.readScoped({
    identity: null,
    scope: { kind: "store", store: "ciadapizza" },
  });
  expect(exact.companies.map((c: any) => c.id)).toEqual(["store-two"]);
});

async function request(
  scope: object,
  cookie = "",
  etag = "",
  selectedStore = store,
  body?: unknown,
  extras = {},
  handlerExtras = {},
) {
  const result: any = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(value: unknown) {
      this.body = value;
      return this;
    },
    end() {},
  };
  await createHandler({ getStore: () => selectedStore, ...handlerExtras })(
    {
      method: body ? "POST" : "GET",
      body,
      headers: {
        host: "pedss.test",
        origin: "https://pedss.test",
        "x-pedss-client": "web",
        "content-type": "application/json",
        "x-pedss-view": JSON.stringify(scope),
        "if-none-match": etag,
        cookie: cookie ? `pedss.session=${cookie}` : "",
        ...extras,
      },
    },
    result,
  );
  return result;
}

it("DATA-01 PostgreSQL returns only the selected shop; public reads exclude all order history", async () => {
  const access = await store.access("");
  expect(access.identity).toBeNull();
  expect(JSON.stringify(access)).not.toMatch(/password|salt|Cliente|image/);
  const scoped = await store.readScoped({
    identity: null,
    scope: { kind: "store", store: "demo" },
  });
  expect(scoped.companies.map((c: any) => c.id)).toEqual(["store-one"]);
  expect(scoped.tenants["store-one"].orders).toEqual([]);
  expect(JSON.stringify(scoped).length).toBeLessThan(JSON.stringify(seed).length / 20);
  expect(JSON.stringify(scoped)).not.toContain("never-transfer-secret");
});
it("DATA-02 unchanged GET validates access and returns 304 without loading a workspace or tenant", async () => {
  const readScoped = vi.spyOn(store, "readScoped"),
    read = vi.spyOn(store, "read");
  const first = await request({ kind: "dashboard", store: "demo" }, token);
  expect(first.statusCode).toBe(200);
  expect(first.body.identity.role).toBe("owner");
  expect(first.body.state.tenants["store-one"].orders).toHaveLength(1);
  const calls = readScoped.mock.calls.length;
  for (let n = 0; n < 100; n++) {
    const unchanged = await request(
      { kind: "dashboard", store: "demo" },
      token,
      first.headers.ETag,
    );
    expect(unchanged.statusCode).toBe(304);
    expect(unchanged.body).toBeUndefined();
  }
  expect(readScoped).toHaveBeenCalledTimes(calls);
  expect(read).not.toHaveBeenCalled();
  readScoped.mockRestore();
  read.mockRestore();
});
it("DATA-03 view selectors and ETags cannot give an owner another shop's orders or secrets", async () => {
  const own = await request({ kind: "dashboard", store: "demo" }, token);
  const other = await request({ kind: "dashboard", store: "outra" }, token, own.headers.ETag);
  expect(other.statusCode).toBe(200);
  expect(other.body.state.tenants["store-two"].orders).toEqual([]);
  expect(other.body.state.tenants["store-two"].expenses).toEqual([]);
  expect(other.body.state.users).toEqual([]);
  expect(JSON.stringify(other.body)).not.toMatch(/never-transfer-secret|Cliente privado/);
  const unauthenticated = await request({ kind: "central" });
  expect(unauthenticated.body.state.companies).toEqual([]);
});
it("DATA-04 central lists establishments and team without downloading catalogs or order archives", async () => {
  const result = await request({ kind: "central" }, "master-test-token");
  expect(result.body.state.companies).toHaveLength(2);
  expect(result.body.state.users).toHaveLength(3);
  for (const tenant of Object.values(result.body.state.tenants) as any[]) {
    expect(tenant.products).toEqual([]);
    expect(tenant.orders).toEqual([]);
    expect(tenant.settings.heroSegment).toBe("burger");
  }
  expect(JSON.stringify(result.body)).not.toContain("never-transfer-secret");
});
it("DATA-05 tracking reads just the matching order and session expiry defeats a previous ETag", async () => {
  const result = await request({ kind: "tracking", tracking: order.trackingToken });
  expect(result.body.state.companies).toHaveLength(1);
  expect(result.body.state.tenants["store-one"].orders).toHaveLength(1);
  expect(result.body.state.tenants["store-one"].products).toEqual([]);
  expect(JSON.stringify(result.body)).not.toContain("Cliente privado");
  const before = await request({ kind: "dashboard", store: "demo" }, token);
  const expired = structuredClone(seed);
  expired.sessions[0].expiresAt = "2000-01-01T00:00:00Z";
  await db.query("UPDATE pedss.workspace SET data = $1 WHERE id = 1", [JSON.stringify(expired)]);
  const after = await request({ kind: "dashboard", store: "demo" }, token, before.headers.ETag);
  expect(after.statusCode).toBe(200);
  expect(after.body.identity).toBeNull();
  expect(after.body.state.tenants["store-one"].orders).toEqual([]);
});
it("DATA-06 a committed change invalidates the conditional view and returns the updated order", async () => {
  const before = await request({ kind: "dashboard", store: "demo" }, token);
  const changed = structuredClone(seed);
  changed.revision++;
  changed.tenants["store-one"].orders[0].status = "Preparando";
  await db.query("UPDATE pedss.workspace SET data = $1 WHERE id = 1", [JSON.stringify(changed)]);
  const after = await request({ kind: "dashboard", store: "demo" }, token, before.headers.ETag);
  expect(after.statusCode).toBe(200);
  expect(after.headers.ETag).not.toBe(before.headers.ETag);
  expect(after.body.state.tenants["store-one"].orders[0].status).toBe("Preparando");
});

it("DATA-07 scoped transaction updates an order and preserves unloaded shops byte-for-byte", async () => {
  const scope = { kind: "dashboard", store: "demo" };
  const result = await request(scope, token, "", store, {
    kind: "service",
    command: "changeOrder",
    args: ["store-one", order.id, "Aceito"],
  });
  expect(result.statusCode).toBe(200);
  const saved: any = (await db.query("SELECT data FROM pedss.workspace WHERE id = 1")).rows[0].data;
  expect(saved.tenants["store-one"].orders[0].status).toBe("Aceito");
  expect(saved.tenants["store-two"]).toEqual(seed.tenants["store-two"]);
  expect(result.body.state.revision).toBe(saved.revision);
  expect(result.body.state.tenants).not.toHaveProperty("store-two");
});
it("DATA-08 refused transaction rolls back and a new trial preserves all legacy catalogs", async () => {
  const denied = await request({ kind: "dashboard", store: "outra" }, token, "", store, {
    kind: "service",
    command: "setOnline",
    args: ["store-two", false],
  });
  expect(denied.statusCode).not.toBe(200);
  expect((await db.query("SELECT data FROM pedss.workspace WHERE id = 1")).rows[0].data).toEqual(
    seed,
  );
  const { trialInput } = await import("./fixtures.ts");
  const trial = await request({ kind: "auth" }, "", "", store, {
    kind: "auth",
    command: "registerTrial",
    args: [trialInput],
  });
  expect(trial.statusCode).toBe(200);
  const saved: any = (await db.query("SELECT data FROM pedss.workspace WHERE id = 1")).rows[0].data;
  expect(saved.tenants["store-one"]).toEqual(seed.tenants["store-one"]);
  expect(saved.tenants["store-two"]).toEqual(seed.tenants["store-two"]);
  expect(saved.tenants[trial.body.result.storeId]).toBeDefined();
});
it("DATA-09 checkout via scoped SQL is idempotent and refuses client prices", async () => {
  const cart = { requestId: "sql-checkout-1", lines: [{ ...cartLine, key: "line" }] };
  const command = { kind: "checkout", command: "create", args: ["store-one", cart, checkout] };
  const result = await request({ kind: "store", store: "demo" }, "", "", store, command);
  expect(result.statusCode).toBe(200);
  const repeat = await request({ kind: "store", store: "demo" }, "", "", store, command);
  expect(repeat.body.result.id).toBe(result.body.result.id);
  const saved: any = (await db.query("SELECT data FROM pedss.workspace WHERE id = 1")).rows[0].data;
  expect(saved.tenants["store-one"].orders).toHaveLength(2);
  expect(saved.tenants["store-two"]).toEqual(seed.tenants["store-two"]);
  const changed = {
    ...command,
    args: [
      "store-one",
      { ...cart, requestId: "sql-checkout-2" },
      { ...checkout, expectedTotalCents: 1 },
    ],
  };
  expect((await request({ kind: "store", store: "demo" }, "", "", store, changed)).statusCode).toBe(
    400,
  );
});

it("DATA-12 status changes neither fetch nor overwrite product media, and subsequent reads omit unchanged photos", async () => {
  const image = "data:image/png;base64," + "B".repeat(300_000);
  const large = structuredClone(seed);
  large.tenants["store-one"].products[0].image = image;
  large.tenants["store-one"].products[0].cutoutImage = image;
  large.tenants["store-one"].settings.banner = image;
  large.companies[0].logo = image;
  await db.query("UPDATE pedss.workspace SET data = $1 WHERE id = 1", [JSON.stringify(large)]);
  const scope = { kind: "dashboard", store: "demo" };
  const first = await request(scope, token);
  const known = {
    "x-pedss-catalog": first.body.versions.catalog,
    "x-pedss-operations": first.body.versions.operations,
  };
  const write = await request(
    scope,
    token,
    "",
    store,
    { kind: "service", command: "changeOrder", args: ["store-one", order.id, "Aceito"] },
    known,
  );
  expect(write.statusCode).toBe(200);
  expect(write.body.unchanged.catalog).toBe(true);
  expect(JSON.stringify(write.body).length).toBeLessThan(20_000);
  const saved: any = (await db.query("SELECT data FROM pedss.workspace WHERE id = 1")).rows[0].data;
  expect(
    isDeepStrictEqual(saved.tenants["store-one"].products, large.tenants["store-one"].products),
  ).toBe(true);
  expect(saved.tenants["store-one"].settings.banner === image).toBe(true);
  expect(saved.companies[0].logo === image).toBe(true);
  const next = await request(scope, token, first.headers.ETag, store, undefined, known);
  expect(next.statusCode).toBe(200);
  expect(next.body.unchanged).toEqual({ catalog: true, operations: false });
  expect(next.body.state.tenants["store-one"].products).toEqual([]);
  expect(next.body.state.tenants["store-one"].orders[0].status).toBe("Aceito");
  expect(JSON.stringify(next.body).length).toBeLessThan(20_000);
});

it("DATA-13 changes in another shop return only a small revision acknowledgement", async () => {
  const scope = { kind: "store", store: "demo" };
  const first = await request(scope);
  const changed = structuredClone(seed);
  changed.revision++;
  changed.tenants["store-two"].online = false;
  await db.query("UPDATE pedss.workspace SET data = $1 WHERE id = 1", [JSON.stringify(changed)]);
  const read = vi.spyOn(store, "readScoped");
  const next = await request(scope, "", first.headers.ETag, store, undefined, {
    "x-pedss-catalog": first.body.versions.catalog,
    "x-pedss-operations": first.body.versions.operations,
  });
  expect(next.body.notModified).toBe(true);
  expect(next.body.state).toBeUndefined();
  expect(JSON.stringify(next.body).length).toBeLessThan(1000);
  expect(read).not.toHaveBeenCalled();
  read.mockRestore();
});

it("DATA-14 old pages cannot keep triggering full workspace reads", async () => {
  const access = vi.spyOn(store, "access"),
    read = vi.spyOn(store, "read");
  const response = await request(undefined as any);
  expect(response.statusCode).toBe(409);
  expect(response.body.error.message).toContain("Atualize a página");
  expect(access).not.toHaveBeenCalled();
  expect(read).not.toHaveBeenCalled();
  access.mockRestore();
  read.mockRestore();
});

it("DATA-15 lightweight checkout preserves legacy photos and creates a missing idempotency map", async () => {
  const legacy = structuredClone(seed);
  delete legacy.checkoutRequests;
  delete legacy.tenants["store-one"].products[0].model3dUrl;
  delete legacy.tenants["store-one"].products[0].cutoutImage;
  delete legacy.tenants["store-one"].settings.heroSegment;
  delete legacy.companies[0].archived;
  legacy.tenants["store-one"].products[0].image = "/legacy-photo.png";
  await db.query("UPDATE pedss.workspace SET data = $1 WHERE id = 1", [JSON.stringify(legacy)]);
  const scope = { kind: "store", store: "demo" };
  const first = await request(scope);
  const owner = await request({ kind: "dashboard", store: "demo" }, token);
  expect(owner.body.identity?.role).toBe("owner");
  const central = await request({ kind: "central" }, "master-test-token");
  expect(central.body.state.tenants["store-one"].settings.heroSegment).toBe("burger");
  const cart = { requestId: "legacy-checkout-1", lines: [{ ...cartLine, key: "line" }] };
  const result = await request(
    scope,
    "",
    "",
    store,
    { kind: "checkout", command: "create", args: ["store-one", cart, checkout] },
    { "x-pedss-catalog": first.body.versions.catalog },
  );
  expect(result.statusCode).toBe(200);
  const saved: any = (await db.query("SELECT data FROM pedss.workspace WHERE id = 1")).rows[0].data;
  expect(saved.tenants["store-one"].products[0].image).toBe("/legacy-photo.png");
  expect(saved.checkoutRequests["store-one:legacy-checkout-1"]).toBeTruthy();
  expect(isDeepStrictEqual(saved.tenants["store-two"], seed.tenants["store-two"])).toBe(true);
});

it("DATA-16 concurrent revocation during a manifest read revalidates access before returning data", async () => {
  const manifest = store.manifest;
  let revoked = false;
  const spy = vi.spyOn(store, "manifest").mockImplementation(async (view) => {
    if (!revoked) {
      revoked = true;
      const next = structuredClone(seed);
      next.revision++;
      next.users[0].active = false;
      await db.query("UPDATE pedss.workspace SET data = $1 WHERE id = 1", [JSON.stringify(next)]);
    }
    return manifest(view);
  });
  const result = await request({ kind: "dashboard", store: "demo" }, token);
  expect(result.statusCode).toBe(200);
  expect(spy).toHaveBeenCalledTimes(2);
  expect(result.body.identity).toBeNull();
  expect(result.body.state.tenants["store-one"].orders).toEqual([]);
  spy.mockRestore();
});

it("DATA-17 simultaneous streams share a pending revision read and cache failures never stick", async () => {
  let resolve;
  const query = vi.fn(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const isolated = createPostgresStore({ query });
  const a = isolated.revision(),
    b = isolated.revision();
  expect(query).toHaveBeenCalledTimes(1);
  resolve({ rows: [{ revision: 42 }] });
  expect(await a).toBe(42);
  expect(await b).toBe(42);
  expect(await isolated.revision()).toBe(42);
  expect(query).toHaveBeenCalledTimes(1);
  const failed = vi
    .fn()
    .mockRejectedValueOnce(Error("offline"))
    .mockResolvedValueOnce({ rows: [{ revision: 43 }] });
  const retry = createPostgresStore({ query: failed });
  await expect(retry.revision()).rejects.toThrow("offline");
  expect(await retry.revision()).toBe(43);
});

it("DATA-18 shipping quotes omit media without clearing the customer's catalog", async () => {
  const configured = structuredClone(seed);
  configured.tenants["store-one"].products[0].image = "/photo-to-retain.webp";
  configured.tenants["store-one"].settings.shipping = {
    mode: "distance",
    originPostalCode: "01001000",
    fixedFeeCents: 0,
    perKmCents: 200,
    baseFeeCents: 300,
    minimumFeeCents: 800,
    maxDistanceKm: 20,
  };
  await db.query("UPDATE pedss.workspace SET data = $1 WHERE id = 1", [JSON.stringify(configured)]);
  const scope = { kind: "store", store: "demo" };
  const first = await request(scope);
  const result = await request(
    scope,
    "",
    "",
    store,
    { kind: "shipping", command: "quote", args: ["store-one", "01310100"] },
    { "x-pedss-catalog": first.body.versions.catalog },
    {
      shipping: {
        quote: async () => ({ feeCents: 800, distanceMeters: 2500, token: "fixture-only" }),
      },
    },
  );
  expect(result.statusCode).toBe(200);
  expect(result.body.result.feeCents).toBe(800);
  expect(result.body.unchanged.catalog).toBe(true);
  const saved: any = (await db.query("SELECT data FROM pedss.workspace WHERE id = 1")).rows[0].data;
  expect(saved.tenants["store-one"].products[0].image).toBe("/photo-to-retain.webp");
});

it("REMOTE-PIZZA-01 HTTP persists sizes, prices and linked flavors through scoped PostgreSQL reads", async () => {
  const scope = { kind: "dashboard", store: "demo" };
  for (const [command, args] of [
    ["saveProduct", ["store-one", pizzaProduct]],
    ["linkPizzaCatalog", ["store-one", pizzaProduct.id]],
  ] as const) {
    const saved = await request(scope, token, "", store, { kind: "service", command, args });
    expect(saved.statusCode, saved.body.error?.message).toBe(200);
  }
  const owner = await request(scope, token);
  const builder = owner.body.state.tenants["store-one"].products.find((p: any) => p.id === "pizza");
  expect(builder.pizza.sizes).toHaveLength(2);
  expect(builder.pizza.flavors.every((f: any) => f.sourceProductId)).toBe(true);
  expect(builder.pizza.flavors[1].prices.medium).toBe(4001);
  const saved: any = (await db.query("SELECT data FROM pedss.workspace WHERE id = 1")).rows[0].data;
  expect(saved.tenants["store-two"]).toEqual(seed.tenants["store-two"]);
});

it("REMOTE-PIZZA-02 stock and cash updates refresh operations without retransmitting catalog photos", async () => {
  const scope = { kind: "dashboard", store: "demo" };
  const item = {
    id: "flour",
    name: "Farinha privada",
    unit: "g",
    stock: 1000,
    costPerUnitCents: 2,
    minimum: 10,
  };
  expect(
    (
      await request(scope, token, "", store, {
        kind: "service",
        command: "saveInventoryItem",
        args: ["store-one", item],
      })
    ).statusCode,
  ).toBe(200);
  const first = await request(scope, token);
  const known = {
    "x-pedss-catalog": first.body.versions.catalog,
    "x-pedss-operations": first.body.versions.operations,
  };
  for (const [command, args] of [
    ["adjustStock", ["store-one", "flour", -100, "Conferência"]],
    ["openCash", ["store-one", 10000]],
    ["moveCash", ["store-one", { kind: "withdrawal", amountCents: 1000, reason: "Sangria" }]],
  ]) {
    const result = await request(
      scope,
      token,
      "",
      store,
      { kind: "service", command, args },
      known,
    );
    expect(result.statusCode, result.body.error?.message).toBe(200);
  }
  const next = await request(scope, token, first.headers.ETag, store, undefined, known);
  expect(next.body.unchanged).toEqual({ catalog: true, operations: false });
  expect(next.body.state.tenants["store-one"].products).toEqual([]);
  expect(next.body.state.tenants["store-one"].restaurant.inventory[0].stock).toBe(900);
  expect(
    next.body.state.tenants["store-one"].restaurant.cashSessions[0].movements[0].amountCents,
  ).toBe(1000);
  const publicView = await request({ kind: "store", store: "demo" });
  expect(JSON.stringify(publicView.body)).not.toMatch(
    /Farinha privada|costPerUnitCents|cashSessions/,
  );
  const unrelated = await request({ kind: "dashboard", store: "demo" }, "other-owner-token");
  expect(JSON.stringify(unrelated.body)).not.toContain("Farinha privada");
  const saved: any = (await db.query("SELECT data FROM pedss.workspace WHERE id = 1")).rows[0].data;
  expect(saved.tenants["store-two"]).toEqual(seed.tenants["store-two"]);
});

it("REMOTE-PIZZA-03 scheduling is public, private operations are isolated and cross-store writes roll back", async () => {
  const scope = { kind: "dashboard", store: "demo" };
  const config = {
    enabled: true,
    leadMinutes: 90,
    slotMinutes: 30,
    capacity: 4,
    days: 7,
    pizzaCapacity: 8,
  };
  const save = await request(scope, token, "", store, {
    kind: "service",
    command: "saveScheduling",
    args: ["store-one", config],
  });
  expect(save.statusCode).toBe(200);
  const publicView = await request({ kind: "store", store: "demo" });
  expect(publicView.body.state.tenants["store-one"].restaurant).toEqual({ scheduling: config });
  const before = (await db.query("SELECT data FROM pedss.workspace WHERE id = 1")).rows[0].data;
  for (const cookie of ["", token]) {
    const denied = await request({ kind: "dashboard", store: "outra" }, cookie, "", store, {
      kind: "service",
      command: "openCash",
      args: ["store-two", 1],
    });
    expect(denied.statusCode).not.toBe(200);
  }
  expect((await db.query("SELECT data FROM pedss.workspace WHERE id = 1")).rows[0].data).toEqual(
    before,
  );
});

it("REMOTE-PIZZA-04 table orders and payments use server prices and survive a fresh read", async () => {
  const scope = { kind: "dashboard", store: "demo" };
  const call = async (command: string, args: any[]) => {
    const result = await request(scope, token, "", store, { kind: "service", command, args });
    expect(result.statusCode, result.body.error?.message).toBe(200);
    return result.body.result;
  };
  await call("saveTable", ["store-one", { id: "table-1", name: "Mesa 1", enabled: true }]);
  const tab = await call("openTab", ["store-one", "table-1", "Cliente de teste"]);
  await call("openCash", ["store-one", 0]);
  const input = {
    requestId: "staff-http-test",
    channel: "table",
    tabId: tab.id,
    lines: [{ ...cartLine, key: "staff-line" }],
    checkout: { ...checkout, fulfillment: "pickup", expectedTotalCents: 6780 },
  };
  const staffOrder = await call("createStaffOrder", ["store-one", input]);
  expect(staffOrder.totalCents).toBe(6780);
  expect(staffOrder.paymentStatus).toBe("Pendente");
  expect((await call("createStaffOrder", ["store-one", input])).id).toBe(staffOrder.id);
  await call("payTab", [
    "store-one",
    tab.id,
    { requestId: "tab-payment", amountCents: 6780, method: "Dinheiro" },
  ]);
  const fresh = await request(scope, token);
  const tenant = fresh.body.state.tenants["store-one"];
  expect(tenant.restaurant.tabs[0].id).toBe(tab.id);
  expect(tenant.orders.find((o: any) => o.id === staffOrder.id).paymentStatus).toBe("Pago");
  expect(tenant.orders.filter((o: any) => o.requestId === input.requestId)).toHaveLength(1);
});

it("REMOTE-PIZZA-05 repeat order requires its token, returns selections without private data and never persists a shared cart", async () => {
  const scope = { kind: "tracking", tracking: order.trackingToken };
  const result = await request(scope, "", "", store, {
    kind: "cart",
    command: "repeatOrder",
    args: ["store-one", order.trackingToken],
  });
  expect(result.statusCode).toBe(200);
  expect(result.body.result[0].productId).toBe("burger");
  expect(result.body.result[0]).not.toHaveProperty("unitPriceCents");
  expect(result.body.state.tenants["store-one"].products).toEqual([]);
  expect(result.body.state.tenants["store-one"].cart.lines).toEqual([]);
  const saved: any = (await db.query("SELECT data FROM pedss.workspace WHERE id = 1")).rows[0].data;
  expect(saved.tenants["store-one"].cart.lines).toEqual([]);
  expect(saved.tenants["store-one"].orders).toEqual(seed.tenants["store-one"].orders);
  const denied = await request(scope, "", "", store, {
    kind: "cart",
    command: "repeatOrder",
    args: ["store-one", "wrong-token"],
  });
  expect(denied.statusCode).not.toBe(200);
});

it("REMOTE-PIZZA-06 item amendments persist their audit and historical stock return atomically", async () => {
  const f = await orderFixture();
  await db.query("UPDATE pedss.workspace SET data = $1 WHERE id = 1", [
    JSON.stringify(f.repo.getSnapshot()),
  ]);
  const scope = { kind: "dashboard", store: "demo" },
    cookie = f.auth.getToken()!;
  const command = {
    kind: "service",
    command: "amendOrderItem",
    args: ["store-one", f.order.id, changeInput(f.order)],
  };
  const changed = await request(scope, cookie, "", store, command);
  expect(changed.statusCode, changed.body.error?.message).toBe(200);
  expect(changed.body.result.totalCents).toBe(7000);
  const again = await request(scope, cookie, "", store, command);
  expect(again.statusCode).toBe(200);
  const fresh = await request(scope, cookie),
    tenant = fresh.body.state.tenants["store-one"];
  expect(tenant.orders[0].amendments).toHaveLength(1);
  expect(tenant.restaurant.inventory[0].stock).toBe(750);
  const tracking = await request({ kind: "tracking", tracking: f.order.trackingToken });
  expect(tracking.body.state.tenants["store-one"].orders[0]).not.toHaveProperty("amendments");
});

it("PIZZA-LAUNCH-HTTP-01 purchases survive partial SQL reads and cannot cross the public boundary", async () => {
  const scope = { kind: "dashboard", store: "demo" };
  const call = async (command: string, args: any[], extras = {}) => {
    const r = await request(scope, token, "", store, { kind: "service", command, args }, extras);
    expect(r.statusCode, r.body.error?.message).toBe(200);
    return r;
  };
  await call("saveInventoryItem", [
    "store-one",
    { id: "flour", name: "Farinha", unit: "g", stock: 0, costPerUnitCents: 0, minimum: 0 },
  ]);
  await call("saveSupplier", ["store-one", { id: "supplier", name: "Fornecedor reservado" }]);
  const first = await request(scope, token);
  const known = {
    "x-pedss-catalog": first.body.versions.catalog,
    "x-pedss-operations": first.body.versions.operations,
  };
  const { localDay } = await import("../src/core/calendar.ts");
  const purchase = {
    requestId: "sql-purchase",
    supplierId: "supplier",
    invoice: "NF77",
    receivedOn: localDay(new Date()),
    lines: [
      {
        ingredientId: "flour",
        quantity: 100,
        totalCents: 2000,
        batch: "LOTE77",
        expiresOn: "2099-01-01",
      },
    ],
  };
  await call("receivePurchase", ["store-one", purchase], known);
  await call("receivePurchase", ["store-one", purchase], known);
  const refreshed = await request(scope, token, first.headers.ETag, store, undefined, known);
  expect(refreshed.body.unchanged).toEqual({ catalog: true, operations: false });
  expect(refreshed.body.state.tenants["store-one"].restaurant.purchases).toHaveLength(1);
  expect(refreshed.body.state.tenants["store-one"].restaurant.inventory[0].stock).toBe(100);
  const publicRead = await request({ kind: "store", store: "demo" });
  expect(JSON.stringify(publicRead.body)).not.toMatch(/Fornecedor reservado|NF77|LOTE77/);
  const saved: any = (await db.query("SELECT data FROM pedss.workspace WHERE id=1")).rows[0].data;
  expect(saved.tenants["store-two"]).toEqual(seed.tenants["store-two"]);
});

it("PIZZA-LAUNCH-HTTP-02 individual pizza production persists through the API with optimistic concurrency", async () => {
  const scope = { kind: "dashboard", store: "demo" };
  const call = async (command: string, args: any[]) => {
    const r = await request(scope, token, "", store, { kind: "service", command, args });
    expect(r.statusCode, r.body.error?.message).toBe(200);
    return r.body.result;
  };
  await call("saveProduct", ["store-one", pizzaProduct]);
  let o = await call("createStaffOrder", [
    "store-one",
    {
      requestId: "individual-http",
      channel: "counter",
      lines: [pizzaLine],
      checkout: { ...checkout, fulfillment: "pickup", expectedTotalCents: 5001 },
    },
  ]);
  expect(o.lines[0].pizzaDetails[0].flavors.map((f: any) => f.name)).toEqual([
    "Mussarela",
    "Calabresa",
  ]);
  o = await call("changeOrder", ["store-one", o.id, "Aceito"]);
  const { pizzaWorkItems } = await import("../src/core/pizzeriaOperations.ts");
  const item = pizzaWorkItems(o)[0];
  const start = {
    key: item.key,
    requestId: "pizza-start",
    expectedUpdatedAt: o.updatedAt,
    stage: "preparing",
  };
  o = await call("changePizzaProduction", ["store-one", o.id, start]);
  await call("changePizzaProduction", ["store-one", o.id, start]);
  const conflict = await request(scope, token, "", store, {
    kind: "service",
    command: "changePizzaProduction",
    args: ["store-one", o.id, { ...start, requestId: "stale", stage: "baking" }],
  });
  expect(conflict.statusCode).not.toBe(200);
  const fresh = await request(scope, token);
  expect(
    fresh.body.state.tenants["store-one"].orders.find((v: any) => v.id === o.id).production,
  ).toHaveLength(1);
  const publicRead = await request({ kind: "tracking", tracking: o.trackingToken });
  const tracked = publicRead.body.state.tenants["store-one"].orders[0];
  expect(tracked.production[0].stage).toBe("preparing");
  expect(tracked.production[0]).not.toHaveProperty("actor");
});
