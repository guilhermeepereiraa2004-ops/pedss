// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { viewScope } from "../src/application/viewScope";
import { storeHref, publishedMenuUrl } from "../src/application/storeAddress";
import Dashboard from "../src/pages/Dashboard";
import DigitalMenu from "../src/pages/DigitalMenu";
import ApplicationProvider from "../src/components/ApplicationProvider";
import { fixture, company } from "./fixtures.ts";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("SUBDOMAIN-04 rotas de loja/menu/painel resolvem o hostname e preservam caminhos legados", () => {
  const base = { hostname: "ciadapizza.pedss.com.br", pathname: "/", search: "" };
  expect(viewScope(base)).toEqual({ kind: "store", store: "ciadapizza" });
  expect(viewScope({ ...base, pathname: "/menu" })).toEqual({ kind: "store", store: "ciadapizza" });
  expect(viewScope({ ...base, pathname: "/dashboard", search: "?store=outra" })).toEqual({
    kind: "dashboard",
    store: "ciadapizza",
  });
  expect(
    viewScope({
      ...base,
      hostname: "www.pedss.com.br",
      pathname: "/dashboard",
      search: "?store=cia-da-pizza",
    }),
  ).toEqual({ kind: "dashboard", store: "cia-da-pizza" });
  expect(
    viewScope({ ...base, hostname: "www.pedss.com.br", pathname: "/store/cia-da-pizza" }),
  ).toEqual({ kind: "store", store: "cia-da-pizza" });
  expect(viewScope({ ...base, pathname: "/pedido/token" })).toEqual({
    kind: "tracking",
    tracking: "token",
  });
  expect(storeHref("cia-da-pizza", "dashboard", base)).toBe(
    "https://ciadapizza.pedss.com.br/dashboard",
  );
  expect(publishedMenuUrl("https://www.pedss.com.br", "cia-da-pizza")).toBe(
    "https://www.pedss.com.br/menu/cia-da-pizza",
  );
  vi.stubEnv("VITE_PUBLIC_STORE_SLUGS", "cia-da-pizza");
  expect(publishedMenuUrl("https://www.pedss.com.br", "cia-da-pizza")).toBe(
    "https://ciadapizza.pedss.com.br/menu",
  );
  expect(storeHref("cia-da-pizza", "dashboard", { hostname: "127.0.0.1" })).toBe(
    "/dashboard?store=cia-da-pizza",
  );
  expect(storeHref("cia-da-pizza", "menu", { hostname: "ciadapizza.localhost" })).toBe("/menu");
});

function LocationProof() {
  const location = useLocation();
  return <output aria-label="Endereço atual">{location.pathname + location.search}</output>;
}
it("SUBDOMAIN-05 painel seleciona a loja do host sem query e navega sem recolocar store", async () => {
  vi.stubGlobal("location", { ...window.location, hostname: "ciadapizza.pedss.com.br" });
  // Dashboard reads window.location, which must keep its other browser properties.
  const f = await fixture("admin");
  await f.repo.transact((s) => {
    s.companies[0].slug = "cia-da-pizza";
    s.companies[0].name = "Cia da Pizza";
  });
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter initialEntries={["/dashboard?store=outra"]}>
        <Dashboard />
        <LocationProof />
      </MemoryRouter>
    </ApplicationProvider>,
  );
  expect(await screen.findByText("Vamos acompanhar a Cia da Pizza.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Financeiro", exact: true }));
  expect(screen.getByLabelText("Endereço atual")).toHaveTextContent("/dashboard?tab=finance");
  expect(screen.getByRole("link", { name: "Ver minha loja" })).toHaveAttribute(
    "href",
    "https://ciadapizza.pedss.com.br/",
  );
});

it("SUBDOMAIN-06 cardápio presencial abre por alias sem sacola ou pedido", async () => {
  const f = await fixture();
  await f.repo.transact((s) => {
    s.companies[0].slug = "cia-da-pizza";
  });
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter>
        <DigitalMenu manualStoreId="ciadapizza" />
      </MemoryRouter>
    </ApplicationProvider>,
  );
  expect(await screen.findByRole("heading", { name: "O cardápio da casa." })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /sacola/i })).not.toBeInTheDocument();
  expect(f.repo.getSnapshot().companies[0].id).toBe(company.id);
});
