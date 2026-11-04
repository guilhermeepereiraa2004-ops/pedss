// @vitest-environment jsdom
import React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import App from "../src/App";
import ApplicationProvider from "../src/components/ApplicationProvider";
import ErrorBoundary from "../src/components/ErrorBoundary";
import { createRemoteRuntime } from "../src/application/remoteRuntime.js";
import { initial, storage } from "./fixtures.ts";
import { scopeState } from "../server/read-model.mjs";
import { projectState } from "../server/projection.mjs";
import { orderFixture } from "./order-amendment-fixture.ts";

let runtime;
vi.mock("../src/application/runtime", () => ({ getRuntime: () => runtime }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

it.each(["button", "online"])(
  "RECOVERY-05 %s recupera inicialização sem recarregar a página ou iniciar sincronizações duplicadas",
  async (trigger) => {
    const state = initial(),
      stop = vi.fn();
    const refresh = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    const app = {
      repository: { getSnapshot: () => state, subscribe: () => () => {} },
      auth: { ready: Promise.resolve(), current: () => null, subscribe: () => () => {} },
      refresh,
      startSync: vi.fn(() => stop),
    };
    const page = render(
      <ApplicationProvider runtime={app}>
        <h1>Loja disponível</h1>
      </ApplicationProvider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar");
    if (trigger === "button")
      await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    else fireEvent(window, new Event("online"));
    expect(await screen.findByRole("heading", { name: "Loja disponível" })).toBeInTheDocument();
    fireEvent(window, new Event("focus"));
    expect(app.startSync).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(2);
    page.unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  },
);

it("RETURN-MENU-01 produção mantém a loja de origem ao acompanhar e voltar, mesmo com projeção de autenticação vazia", async () => {
  const source = initial();
  source.companies[0].slug = "cia-da-pizza";
  source.companies[0].name = "Cia da Pizza";
  const browser = storage(),
    scopes = [];
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState({}, "", "/store/cia-da-pizza");
  runtime = createRemoteRuntime({
    storage: browser,
    fetcher: vi.fn(async (_, options) => {
      const scope = JSON.parse(options.headers["X-Pedss-View"]);
      scopes.push(scope);
      return {
        ok: true,
        json: async () => ({
          state: projectState(
            scopeState(source, null, scope, scope.tracking),
            null,
            scope.tracking,
          ),
          identity: null,
        }),
      };
    }),
  });
  runtime.startSync = () => () => {};
  render(<App />);
  const tracking = await screen.findByRole(
    "link",
    { name: "Acompanhar pedido" },
    { timeout: 5000 },
  );
  expect(tracking).toHaveAttribute("href", "/acompanhar?store=cia-da-pizza");
  await userEvent.click(tracking);
  const back = await screen.findByRole("link", { name: "Voltar ao cardápio" });
  expect(runtime.repository.getSnapshot().companies).toEqual([]);
  expect(back).toHaveAttribute("href", "/store/cia-da-pizza");
  await userEvent.click(back);
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Acompanhar pedido" })).toBeInTheDocument(),
  );
  expect(screen.queryByText("Estabelecimento não encontrado.")).toBeNull();
  expect(scopes.some((s) => s.store === "demo")).toBe(false);
});

it("RETURN-MENU-02 acompanhamento sem origem leva ao início, sem inventar loja demo", async () => {
  const source = initial();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState({}, "", "/acompanhar");
  runtime = createRemoteRuntime({
    storage: storage(),
    fetcher: vi.fn(async () => ({
      ok: true,
      json: async () => ({
        state: projectState(scopeState(source, null, { kind: "auth" }), null),
        identity: null,
      }),
    })),
  });
  runtime.startSync = () => () => {};
  render(<App />);
  expect(await screen.findByRole("link", { name: "Voltar ao início" })).toHaveAttribute(
    "href",
    "/",
  );
  expect(screen.queryByRole("link", { name: "Voltar ao cardápio" })).toBeNull();
});

it("RETURN-MENU-03 pedido identificado retorna à sua própria loja, ignorando outra origem na URL", async () => {
  const f = await orderFixture();
  const source = structuredClone(f.repo.getSnapshot());
  source.companies[0].slug = "cia-da-pizza";
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState({}, "", `/pedido/${f.order.trackingToken}?store=outra-loja`);
  runtime = createRemoteRuntime({
    storage: storage(),
    fetcher: vi.fn(async (_, options) => {
      const scope = JSON.parse(options.headers["X-Pedss-View"]);
      return {
        ok: true,
        json: async () => ({
          state: projectState(
            scopeState(source, null, scope, scope.tracking),
            null,
            scope.tracking,
          ),
          identity: null,
        }),
      };
    }),
  });
  runtime.startSync = () => () => {};
  render(<App />);
  expect(await screen.findByRole("link", { name: "Voltar ao cardápio" })).toHaveAttribute(
    "href",
    "/store/cia-da-pizza",
  );
});

it("RECOVERY-06 falha de arquivo da tela informa recuperação de versão sem expor erro técnico", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  function Broken() {
    throw new TypeError("Failed to fetch dynamically imported module: /assets/private-path.js");
  }
  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>,
  );
  expect(screen.getByRole("button", { name: "Atualizar aplicação" })).toBeInTheDocument();
  expect(screen.getByText(/uma nova versão do site/)).toBeInTheDocument();
  expect(screen.queryByText(/private-path/)).toBeNull();
});
