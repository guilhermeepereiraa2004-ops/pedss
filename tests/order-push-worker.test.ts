import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

it("exibe push e abre o painel pelo aviso mesmo sem abas da loja abertas", async () => {
  const source = await readFile(
    new URL("../public/order-notifications.js", import.meta.url),
    "utf8",
  );
  const handlers = new Map<string, (event: any) => void>();
  const showNotification = vi.fn(async () => {});
  const openWindow = vi.fn(async () => {});
  runInNewContext(source, {
    URL,
    URLSearchParams,
    self: {
      location: { origin: "https://www.pedss.com.br" },
      addEventListener: (name: string, handler: (event: any) => void) =>
        handlers.set(name, handler),
      registration: { showNotification },
      clients: { matchAll: async () => [], openWindow },
    },
  });
  let work;
  const waitUntil = (promise: Promise<unknown>) => {
    work = promise;
  };
  handlers.get("push")!({
    waitUntil,
    data: {
      json: () => ({ kind: "pedss-order", tag: "store:order", store: "demo", body: "Novo pedido" }),
    },
  });
  await work;
  expect(showNotification).toHaveBeenCalledWith(
    "Novo pedido na Peds's",
    expect.objectContaining({ tag: "store:order", data: { store: "demo" } }),
  );
  handlers.get("notificationclick")!({
    waitUntil,
    notification: { close() {}, data: { store: "demo" } },
  });
  await work;
  expect(openWindow).toHaveBeenCalledWith(
    "https://www.pedss.com.br/dashboard?store=demo&tab=orders",
  );
});
