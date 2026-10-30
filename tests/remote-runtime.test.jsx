// @vitest-environment jsdom
import { it, expect, vi } from "vitest";
import { createRemoteRuntime } from "../src/application/remoteRuntime.js";
import { projectState } from "../server/projection.mjs";
import { initial, storage, cartLine, checkout } from "./fixtures.ts";
import { restaurantSchema } from "../src/core/restaurantModel.ts";

it("modo remoto mantém apenas a sacola no navegador e envia checkout sem confiar no preço do cliente", async () => {
  const browser = storage();
  browser.setItem("brasa.workspace.v2", "legado preservado");
  const calls = [];
  const fetcher = vi.fn(async (_, options) => {
    const body = options.body && JSON.parse(options.body);
    calls.push(body);
    return {
      ok: true,
      json: async () => ({
        state: projectState(initial(), null),
        identity: null,
        setupAvailable: true,
        result:
          body?.kind === "checkout" ? { id: "new-order", trackingToken: "opaque" } : undefined,
      }),
    };
  });
  const runtime = createRemoteRuntime({ storage: browser, fetcher });
  await runtime.auth.ready;
  await runtime.services.addToCart("store-one", cartLine);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(runtime.repository.getSnapshot().tenants["store-one"].cart.lines).toHaveLength(1);
  expect(browser.getItem("brasa.workspace.v2")).toBe("legado preservado");
  expect([...browser.values.keys()].sort()).toEqual(["brasa.workspace.v2", "pedss.carts.v1"]);
  const cart = runtime.repository.getSnapshot().tenants["store-one"].cart;
  await runtime.services.checkout("store-one", cart.requestId, checkout);
  expect(calls[1].kind).toBe("checkout");
  expect(calls[1].args[1].lines[0]).not.toHaveProperty("priceCents");
  expect(runtime.repository.getSnapshot().tenants["store-one"].cart.lines).toEqual([]);
});

it("modo remoto rejeita erro HTTP e não inventa confirmação de gravação", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: projectState(initial(), null), identity: null }),
    })
    .mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Sem acesso à loja." } }),
    });
  const runtime = createRemoteRuntime({ storage: storage(), fetcher });
  await runtime.auth.ready;
  await expect(runtime.services.setOnline("store-one", false)).rejects.toThrow(
    "Sem acesso à loja.",
  );
  expect(runtime.repository.getSnapshot().tenants["store-one"].online).toBe(true);
});

it("remote partial reads retain scheduling, stock and photos in their independent cache partitions", async () => {
  const identity = { id: "owner", role: "owner", storeId: "store-one" };
  const source = initial();
  source.tenants["store-one"].products[0].image = "/retain-photo.webp";
  source.tenants["store-one"].restaurant = restaurantSchema.parse({
    scheduling: { enabled: true, leadMinutes: 120, slotMinutes: 30, capacity: 5, days: 7 },
    inventory: [
      { id: "ingredient", name: "Massa", unit: "g", stock: 10, minimum: 1, costPerUnitCents: 2 },
    ],
  });
  const full = projectState(source, identity);
  const operations = structuredClone(full);
  operations.tenants["store-one"].products = [];
  operations.tenants["store-one"].restaurant.inventory[0].stock = 8;
  operations.tenants["store-one"].restaurant.scheduling = restaurantSchema.parse({}).scheduling;
  const catalog = structuredClone(full);
  catalog.tenants["store-one"].restaurant = restaurantSchema.parse({
    scheduling: { enabled: true, leadMinutes: 180, slotMinutes: 30, capacity: 5, days: 7 },
  });
  const payloads = [
    { state: full },
    { state: operations, unchanged: { catalog: true, operations: false } },
    { state: catalog, unchanged: { catalog: false, operations: true } },
  ];
  const fetcher = vi.fn(async () => ({
    ok: true,
    json: async () => ({ ...payloads.shift(), identity }),
  }));
  const runtime = createRemoteRuntime({ storage: storage(), fetcher });
  await runtime.auth.ready;
  await runtime.refresh();
  const read = () => runtime.repository.getSnapshot().tenants["store-one"];
  expect(read().restaurant.scheduling.leadMinutes).toBe(120);
  expect(read().restaurant.inventory[0].stock).toBe(8);
  expect(read().products[0].image).toBe("/retain-photo.webp");
  await runtime.refresh();
  expect(read().restaurant.scheduling.leadMinutes).toBe(180);
  expect(read().restaurant.inventory[0].stock).toBe(8);
});

it("repeat order sends its opaque token to the server and stores only the returned cart locally", async () => {
  const browser = storage(),
    calls = [];
  const fetcher = vi.fn(async (_, options) => {
    const body = options.body && JSON.parse(options.body);
    calls.push(body);
    return {
      ok: true,
      json: async () => ({
        state: projectState(initial(), null),
        identity: null,
        result: body ? [{ ...cartLine, key: "reordered-line" }] : undefined,
      }),
    };
  });
  const runtime = createRemoteRuntime({ storage: browser, fetcher });
  await runtime.auth.ready;
  await runtime.services.repeatOrder("store-one", "opaque-order-token");
  expect(calls[1]).toEqual({
    kind: "cart",
    command: "repeatOrder",
    args: ["store-one", "opaque-order-token"],
  });
  expect(runtime.repository.getSnapshot().tenants["store-one"].cart.lines).toHaveLength(1);
  expect([...browser.values.keys()]).toEqual(["pedss.carts.v1"]);
});
