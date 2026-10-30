// @vitest-environment jsdom
import React from "react";
import { afterEach, it, expect, vi } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import App from "../src/App";
import { localRuntimeMode } from "../scripts/local-runtime.mjs";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  window.history.replaceState({}, "", "/");
});
it("DATA-10 landing opens with API offline and starts no database requests or live subscription", async () => {
  vi.stubEnv("VITE_RUNTIME_MODE", "remote");
  const fetcher = vi.fn(async () => {
    throw Error("offline");
  });
  const source = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  vi.stubGlobal("EventSource", source);
  vi.stubGlobal("scrollTo", vi.fn());
  window.history.replaceState({}, "", "/");
  render(<App />);
  expect(screen.getByRole("heading", { level: 1, name: /Seu negócio/ })).toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalled();
  expect(source).not.toHaveBeenCalled();
  await userEvent.click(
    within(screen.getByRole("navigation", { name: "Navegação principal" })).getByRole("link", {
      name: "Acessar painel",
    }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar");
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(source).not.toHaveBeenCalled();
});
it("DATA-11 local development requires explicit opt-in to use a remote database", () => {
  expect(localRuntimeMode({ VITE_RUNTIME_MODE: "remote" })).toBe("local");
  expect(
    localRuntimeMode({ VITE_RUNTIME_MODE: "remote", PEDSS_ALLOW_REMOTE_DATABASE: "false" }),
  ).toBe("local");
  expect(
    localRuntimeMode({ VITE_RUNTIME_MODE: "remote", PEDSS_ALLOW_REMOTE_DATABASE: "true" }),
  ).toBe("remote");
  expect(
    localRuntimeMode({ VITE_RUNTIME_MODE: "local", PEDSS_ALLOW_REMOTE_DATABASE: "true" }),
  ).toBe("local");
});
