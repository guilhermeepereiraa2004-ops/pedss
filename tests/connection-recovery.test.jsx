// @vitest-environment jsdom
import { it, expect, vi, afterEach } from "vitest";
import { remoteRead } from "../src/adapters/remoteRead.js";
import { loadPage } from "../src/application/pageLoading.js";
import { createRemoteRuntime } from "../src/application/remoteRuntime.js";
import { initial, storage } from "./fixtures.ts";
import { projectState } from "../server/projection.mjs";

afterEach(() => vi.useRealTimers());

it("RECOVERY-01 leituras recuperam falha de rede e 503, com somente uma repetição", async () => {
  const ok = { ok: true, status: 200 };
  for (const failure of [new TypeError("Failed to fetch"), { status: 503 }]) {
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() =>
        failure instanceof Error ? Promise.reject(failure) : Promise.resolve(failure),
      )
      .mockResolvedValueOnce(ok);
    expect(await remoteRead(fetcher, "/api/app", { method: "GET" }, { delay: 1 })).toBe(ok);
    expect(fetcher).toHaveBeenCalledTimes(2);
  }
  const denied = vi.fn().mockResolvedValue({ status: 401 });
  expect((await remoteRead(denied, "/api/app", { method: "GET" })).status).toBe(401);
  expect(denied).toHaveBeenCalledTimes(1);
});

it("RECOVERY-02 leitura travada é abortada e encerra após duas tentativas", async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn(
    (_, { signal }) =>
      new Promise((_, reject) =>
        signal.addEventListener("abort", () => reject(new DOMException("Timeout", "AbortError"))),
      ),
  );
  const result = remoteRead(fetcher, "/api/app", { method: "GET" }, { timeout: 100, delay: 10 });
  const assertion = expect(result).rejects.toThrow("Não foi possível conectar");
  await vi.advanceTimersByTimeAsync(220);
  await assertion;
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it("RECOVERY-03 falha de envio não repete gravação nem inventa confirmação", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: projectState(initial(), null), identity: null }),
    })
    .mockRejectedValueOnce(new TypeError("Failed to fetch"));
  const runtime = createRemoteRuntime({ storage: storage(), fetcher });
  await runtime.auth.ready;
  await expect(runtime.services.setOnline("store-one", false)).rejects.toThrow("Failed to fetch");
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(runtime.repository.getSnapshot().tenants["store-one"].online).toBe(true);
});

it("RECOVERY-04 carregamento de tela repete falha de importação mas não mascara erro de código", async () => {
  vi.useFakeTimers();
  const module = { default: () => null };
  const loader = vi
    .fn()
    .mockRejectedValueOnce(
      new TypeError("Failed to fetch dynamically imported module: /assets/route.js"),
    )
    .mockResolvedValueOnce(module);
  const result = loadPage(loader);
  await vi.advanceTimersByTimeAsync(750);
  expect(await result).toBe(module);
  expect(loader).toHaveBeenCalledTimes(2);
  const broken = vi.fn().mockRejectedValue(new Error("Render bug"));
  await expect(loadPage(broken)).rejects.toThrow("Render bug");
  expect(broken).toHaveBeenCalledTimes(1);
});
