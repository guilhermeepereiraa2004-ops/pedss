// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import ApplicationProvider from "../src/components/ApplicationProvider";
import Dashboard from "../src/pages/Dashboard";
import ProfitabilityPanel from "../src/components/ProfitabilityPanel";
import { orderFixture } from "./order-amendment-fixture.ts";
import { fixture, company } from "./fixtures.ts";

afterEach(cleanup);
it("MARGIN-05 financeiro mostra margem, filtra período e abre o pedido sem alterar dados", async () => {
  const f = await orderFixture();
  await f.repo.transact((state) => {
    const order = state.tenants[company.id].orders[0];
    order.paymentStatus = "Pago";
    order.createdAt = "2026-11-03T15:00:00Z";
  });
  const before = JSON.stringify(f.repo.getSnapshot());
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter initialEntries={["/dashboard?store=demo&tab=finance"]}>
        <Dashboard />
      </MemoryRouter>
    </ApplicationProvider>,
  );
  await userEvent.click(await screen.findByRole("tab", { name: "Custos e margem" }));
  const panel = screen.getByRole("region", { name: "Custos e margem" });
  expect(within(panel).getAllByText("R$ 65,00")).toHaveLength(2);
  expect(within(panel).getAllByText("65%")).toHaveLength(2);
  await userEvent.type(within(panel).getByLabelText("De"), "2026-11-04");
  expect(within(panel).getByText("Ainda sem vendas pagas neste período.")).toBeInTheDocument();
  await userEvent.clear(within(panel).getByLabelText("De"));
  await userEvent.click(
    within(panel).getByRole("button", { name: `Detalhes do pedido ${f.order.number}` }),
  );
  expect(await screen.findByRole("dialog")).toBeInTheDocument();
  expect(JSON.stringify(f.repo.getSnapshot())).toBe(before);
});

it("MARGIN-06 apuração incompleta avisa cobertura e não exibe margem falsa", async () => {
  const f = await orderFixture();
  const order = {
    ...f.order,
    paymentStatus: "Pago",
    lines: f.order.lines.map((line) => ({ ...line, unitCostCents: null })),
  };
  const onCatalog = vi.fn();
  render(
    <ProfitabilityPanel
      orders={[order]}
      from=""
      to=""
      onFrom={() => {}}
      onTo={() => {}}
      onCatalog={onCatalog}
      onOrder={() => {}}
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent("1 venda sem custo completo");
  expect(screen.getAllByText("Não apurado").length).toBeGreaterThan(0);
  expect(screen.getByText("Custo incompleto")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Configurar custos" }));
  expect(onCatalog).toHaveBeenCalledOnce();
});

it("MARGIN-07 atendente não acessa custos pelo endereço do financeiro", async () => {
  const f = await fixture("attendant");
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter initialEntries={["/dashboard?store=demo&tab=finance"]}>
        <Dashboard />
      </MemoryRouter>
    </ApplicationProvider>,
  );
  await screen.findByText("Bom movimento por aqui.");
  expect(screen.queryByRole("tab", { name: "Custos e margem" })).not.toBeInTheDocument();
});
