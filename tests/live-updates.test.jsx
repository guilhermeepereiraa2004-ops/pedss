// @vitest-environment jsdom
import { it, expect, vi, afterEach } from "vitest";
import { EventEmitter } from "node:events";
import { createRemoteRuntime } from "../src/application/remoteRuntime";
import { startLiveUpdates } from "../src/application/liveUpdates";
import { createUpdatesHandler } from "../server/updates.mjs";
import { initial, storage } from "./fixtures.ts";
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});
const payload = (online = true) => {
  const s = initial();
  s.tenants["store-one"].online = online;
  return { state: s, identity: null };
};
it("LIVE-01 eventos atualizam a projeção sem refresh, com recuperação por polling e limpeza", async () => {
  vi.useFakeTimers();
  let source;
  const refresh = vi.fn(async () => {});
  class Source {
    readyState = 1;
    handlers = {};
    close = vi.fn();
    constructor() {
      source = this;
    }
    addEventListener(name, fn) {
      this.handlers[name] = fn;
    }
  }
  const stop = startLiveUpdates({ refresh, getRevision: () => 1, EventSourceClass: Source });
  source.onopen();
  source.handlers.revision({ data: '{"revision":1}' });
  source.handlers.change({ data: '{"revision":2}' });
  await vi.advanceTimersByTimeAsync(0);
  expect(refresh).toHaveBeenCalledTimes(1);
  source.onerror();
  await vi.advanceTimersByTimeAsync(5000);
  expect(refresh).toHaveBeenCalledTimes(2);
  source.onopen();
  const count = refresh.mock.calls.length;
  await vi.advanceTimersByTimeAsync(5000);
  expect(refresh).toHaveBeenCalledTimes(count);
  window.dispatchEvent(new Event("focus"));
  expect(refresh).toHaveBeenCalledTimes(count + 1);
  stop();
  source.onerror();
  expect(vi.getTimerCount()).toBe(0);
  expect(source.close).toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(10000);
  expect(refresh).toHaveBeenCalledTimes(count + 1);
});
it("LIVE-02 leitura atrasada não desfaz uma gravação e atualização concorrente não descarta a confirmação", async () => {
  let releaseRead, releaseWrite;
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => payload() })
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          releaseRead = r;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          releaseWrite = r;
        }),
    )
    .mockResolvedValue({ ok: true, json: async () => payload(false) });
  const runtime = createRemoteRuntime({ fetcher, storage: storage() });
  await runtime.auth.ready;
  const read = runtime.refresh();
  const write = runtime.services.setOnline("store-one", false);
  await runtime.refresh();
  releaseWrite({ ok: true, json: async () => payload(false) });
  await write;
  releaseRead({ ok: true, json: async () => payload(true) });
  await read;
  await Promise.resolve();
  expect(runtime.repository.getSnapshot().tenants["store-one"].online).toBe(false);
  expect(fetcher).toHaveBeenCalledTimes(4);
});
it("LIVE-03 stream envia somente invalidação, sem pedidos, tokens ou dados pessoais", async () => {
  let calls = 0;
  const res = new EventEmitter();
  let text = "";
  res.setHeader = vi.fn();
  res.flushHeaders = () => {
    res.headersSent = true;
  };
  res.write = (s) => {
    text += s;
  };
  res.end = vi.fn();
  const handler = createUpdatesHandler({
    durationMs: 15,
    intervalMs: 2,
    getStore: () => ({ limit: async () => true, revision: async () => (++calls > 1 ? 2 : 1) }),
  });
  await handler({ method: "GET", headers: {}, socket: {} }, res);
  expect(text).toContain('event: revision\ndata: {"revision":1}');
  expect(text).toContain('event: change\ndata: {"revision":2}');
  expect(text).not.toMatch(/customer|trackingToken|paymentStatus/);
  expect(res.end).toHaveBeenCalled();
});
it("LIVE-04 snapshot atualizado por evento preserva a sacola local e deduplica leituras", async () => {
  let release;
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => payload() })
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          release = r;
        }),
    );
  const runtime = createRemoteRuntime({ fetcher, storage: storage() });
  await runtime.auth.ready;
  await runtime.services.addToCart("store-one", {
    productId: "burger",
    quantity: 1,
    extraIds: [],
    removedIngredients: [],
    notes: "",
  });
  const a = runtime.refresh(),
    b = runtime.refresh();
  release({ ok: true, json: async () => payload() });
  await Promise.all([a, b]);
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(runtime.repository.getSnapshot().tenants["store-one"].cart.lines).toHaveLength(1);
});

it("LIVE-05 abrir/reabrir o stream sem mudança não recarrega o catálogo", async () => {
  vi.useFakeTimers();
  let source;
  class Source {
    handlers = {};
    close = vi.fn();
    constructor() {
      source = this;
    }
    addEventListener(name, fn) {
      this.handlers[name] = fn;
    }
  }
  const refresh = vi.fn(async () => {});
  const stop = startLiveUpdates({ refresh, getRevision: () => 7, EventSourceClass: Source });
  for (let n = 0; n < 100; n++) {
    source.onopen();
    source.handlers.revision({ data: '{"revision":7}' });
  }
  await vi.advanceTimersByTimeAsync(120_000);
  expect(refresh).not.toHaveBeenCalled();
  stop();
});

it("LIVE-06 abas de catálogo ocultas desconectam e retomam; painel mantém avisos em segundo plano", async () => {
  vi.useFakeTimers();
  let source;
  class Source {
    close = vi.fn();
    constructor() {
      source = this;
    }
    addEventListener() {}
  }
  const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  const refresh = vi.fn(async () => {});
  const stop = startLiveUpdates({ refresh, EventSourceClass: Source });
  const first = source;
  visibility.mockReturnValue("hidden");
  document.dispatchEvent(new Event("visibilitychange"));
  expect(first.close).toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(120_000);
  expect(refresh).not.toHaveBeenCalled();
  visibility.mockReturnValue("visible");
  document.dispatchEvent(new Event("visibilitychange"));
  expect(source).not.toBe(first);
  expect(refresh).toHaveBeenCalledTimes(1);
  stop();
  const stopDashboard = startLiveUpdates({ refresh, EventSourceClass: Source, background: true });
  const dashboardSource = source;
  visibility.mockReturnValue("hidden");
  document.dispatchEvent(new Event("visibilitychange"));
  expect(dashboardSource.close).not.toHaveBeenCalled();
  stopDashboard();
});

it("LIVE-07 erro prolongado tem backoff, não mantém polling e SSE concorrentes", async () => {
  vi.useFakeTimers();
  let source;
  const refresh = vi.fn(async () => {
    throw Error("503");
  });
  class Source {
    close = vi.fn();
    constructor() {
      source = this;
      queueMicrotask(() => this.onerror());
    }
    addEventListener() {}
  }
  const stop = startLiveUpdates({ refresh, EventSourceClass: Source });
  await vi.advanceTimersByTimeAsync(120_000);
  expect(refresh.mock.calls.length).toBeLessThan(8);
  expect(source.close).toHaveBeenCalled();
  stop();
  expect(vi.getTimerCount()).toBe(0);
});

it("LIVE-08 abas compartilham só revisões e elegem outro stream ao fechar a líder", async () => {
  const peers = new Set();
  const messages = [];
  class Channel {
    constructor() {
      peers.add(this);
    }
    postMessage(data) {
      messages.push(data);
      for (const p of peers) if (p !== this) p.onmessage?.({ data });
    }
    close() {
      peers.delete(this);
    }
  }
  let held = false;
  const queue = [];
  const pump = () => {
    if (!held && queue.length) queue.shift()();
  };
  const locks = {
    request: (_name, { signal }, work) =>
      new Promise((resolve, reject) => {
        const run = async () => {
          if (signal.aborted) {
            reject(Error("aborted"));
            pump();
            return;
          }
          held = true;
          try {
            await work();
            resolve();
          } finally {
            held = false;
            pump();
          }
        };
        queue.push(run);
        pump();
      }),
  };
  const sources = [];
  class Source {
    handlers = {};
    close = vi.fn();
    constructor() {
      sources.push(this);
    }
    addEventListener(name, fn) {
      this.handlers[name] = fn;
    }
  }
  const a = vi.fn(async () => {}),
    b = vi.fn(async () => {});
  const options = {
    getRevision: () => 1,
    locks,
    BroadcastChannelClass: Channel,
    EventSourceClass: Source,
  };
  const stopA = startLiveUpdates({ ...options, refresh: a });
  const stopB = startLiveUpdates({ ...options, refresh: b });
  expect(sources).toHaveLength(1);
  sources[0].handlers.change({ data: '{"revision":2}' });
  expect(a).toHaveBeenCalledTimes(1);
  expect(b).toHaveBeenCalledTimes(1);
  expect(messages).toEqual([{ revision: 2 }]);
  stopA();
  await Promise.resolve();
  await Promise.resolve();
  expect(sources).toHaveLength(2);
  stopB();
  expect(peers.size).toBe(0);
});

it("LIVE-09 resposta 304 preserva estado e sacolas; seletor muda ao navegar entre lojas", async () => {
  window.history.replaceState({}, "", "/store/demo");
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ ETag: '"one"' }),
      json: async () => payload(),
    })
    .mockResolvedValueOnce({
      status: 304,
      json: vi.fn(() => {
        throw Error("304 não possui JSON");
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ ETag: '"two"' }),
      json: async () => payload(),
    });
  const runtime = createRemoteRuntime({ fetcher, storage: storage() });
  await runtime.auth.ready;
  await runtime.services.addToCart("store-one", {
    productId: "burger",
    quantity: 1,
    extraIds: [],
    removedIngredients: [],
    notes: "",
  });
  const before = runtime.repository.getSnapshot();
  await runtime.refresh();
  expect(runtime.repository.getSnapshot()).toBe(before);
  expect(fetcher.mock.calls[1][1].headers["If-None-Match"]).toBe('"one"');
  window.history.replaceState({}, "", "/store/outra");
  await runtime.refresh();
  expect(fetcher.mock.calls[2][1].headers["If-None-Match"]).toBeUndefined();
  expect(JSON.parse(fetcher.mock.calls[2][1].headers["X-Pedss-View"])).toEqual({
    kind: "store",
    store: "outra",
  });
});

it("LIVE-10 updates only orders, retaining photos, theme and cart; unrelated revisions retain the view", async () => {
  const first = payload();
  first.state.tenants["store-one"].products[0].image = "/own-photo.webp";
  first.versions = { catalog: "catalog-one", operations: "orders-one" };
  const changed = payload();
  changed.state.revision = 2;
  changed.state.tenants["store-one"].products = [];
  changed.state.tenants["store-one"].online = false;
  changed.unchanged = { catalog: true, operations: false };
  changed.versions = { catalog: "catalog-one", operations: "orders-two" };
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ ETag: '"one"' }),
      json: async () => first,
    })
    .mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ ETag: '"two"' }),
      json: async () => changed,
    })
    .mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ ETag: '"three"' }),
      json: async () => ({
        notModified: true,
        revision: 3,
        identity: null,
        versions: changed.versions,
      }),
    });
  const runtime = createRemoteRuntime({ fetcher, storage: storage() });
  await runtime.auth.ready;
  await runtime.services.addToCart("store-one", {
    productId: "burger",
    quantity: 1,
    extraIds: [],
    removedIngredients: [],
    notes: "",
  });
  await runtime.refresh();
  expect(fetcher.mock.calls[1][1].headers["X-Pedss-Catalog"]).toBe("catalog-one");
  const tenant = runtime.repository.getSnapshot().tenants["store-one"];
  expect(tenant.products[0].image).toBe("/own-photo.webp");
  expect(tenant.online).toBe(true);
  expect(tenant.cart.lines).toHaveLength(1);
  await runtime.refresh();
  expect(runtime.repository.getSnapshot().tenants["store-one"]).toBe(tenant);
  expect(runtime.repository.getSnapshot().revision).toBe(3);
});
