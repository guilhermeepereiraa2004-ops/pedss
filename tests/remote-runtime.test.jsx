// @vitest-environment jsdom
import { it, expect, vi } from "vitest";
import { createRemoteRuntime } from "../src/application/remoteRuntime.js";
import { projectState } from "../server/projection.mjs";
import { initial, storage, cartLine, checkout } from "./fixtures.ts";

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
