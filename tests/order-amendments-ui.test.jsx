// @vitest-environment jsdom
import React from "react";
import { afterEach, it, expect, vi } from "vitest";
import { cleanup, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import ApplicationProvider from "../src/components/ApplicationProvider";
import Dashboard from "../src/pages/Dashboard";
import CatalogOperations from "../src/components/CatalogOperations";
import OrderItemChange from "../src/components/OrderItemChange";
import { orderFixture, tenantOf } from "./order-amendment-fixture.ts";
import { company } from "./fixtures.ts";
afterEach(cleanup);
async function panel(f) {
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter initialEntries={["/dashboard?store=demo&tab=orders"]}>
        <Dashboard />
      </MemoryRouter>
    </ApplicationProvider>,
  );
  await userEvent.click(
    await screen.findByRole("button", { name: `Detalhes do pedido ${f.order.number}` }),
  );
}
it("AMEND-UI-01 painel edita quantidade, revisa diferença e mantém histórico ao confirmar", async () => {
  const f = await orderFixture();
  await panel(f);
  await userEvent.click(screen.getByRole("button", { name: "Editar item 1", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
  await userEvent.click(screen.getByRole("button", { name: /Revisar alteração/ }));
  const review = screen.getByRole("region", { name: "Revisão dos valores" });
  expect(within(review).getByText(/130,00/)).toBeInTheDocument();
  expect(tenantOf(f).orders[0].totalCents).toBe(10000);
  const save = screen.getByRole("button", { name: "Confirmar alteração do item" });
  expect(save).toBeDisabled();
  await userEvent.type(
    screen.getByLabelText("Motivo da alteração"),
    "Cliente pediu mais uma pizza",
  );
  await userEvent.click(save);
  await waitFor(() => expect(tenantOf(f).orders[0].totalCents).toBe(13000));
  expect(screen.getByRole("region", { name: "Alterações dos itens" })).toHaveTextContent(
    "Calabresa",
  );
  expect(tenantOf(f).orders[0].amendments[0].before.quantity).toBe(2);
});
it("AMEND-UI-02 cancelar item pago mostra saldo a devolver e registra estorno separado", async () => {
  const f = await orderFixture();
  await f.services.recordOrderPayment(company.id, f.order.id, {
    requestId: "paid",
    kind: "receipt",
    amountCents: 10000,
    method: "Dinheiro",
  });
  await panel(f);
  await userEvent.click(screen.getByRole("button", { name: "Cancelar item 1", exact: true }));
  expect(screen.getByRole("region", { name: "Revisão dos valores" })).toHaveTextContent(
    "Saldo a devolver:",
  );
  await userEvent.type(screen.getByLabelText("Motivo da alteração"), "Cliente retirou uma pizza");
  await userEvent.click(screen.getByRole("button", { name: "Confirmar cancelamento do item" }));
  await waitFor(() => expect(tenantOf(f).orders[0].totalCents).toBe(7000));
  expect(screen.getByText(/Saldo a devolver ao cliente/)).toHaveTextContent(/30,00/);
  expect(tenantOf(f).orders[0].payments).toHaveLength(1);
  expect(screen.getByLabelText("Valor devolvido ao cliente (R$)")).toBeInTheDocument();
});
it("AMEND-UI-03 revisão desatualizada exige reabrir e não troca o pedido silenciosamente", async () => {
  const f = await orderFixture(),
    onSave = vi.fn();
  const props = {
    order: f.order,
    tenant: tenantOf(f),
    lineIndex: 0,
    kind: "cancel",
    canFinance: true,
    onSave,
    onBack: () => {},
  };
  const view = render(<OrderItemChange {...props} />);
  await userEvent.type(screen.getByLabelText("Motivo da alteração"), "Cliente desistiu");
  view.rerender(
    <OrderItemChange {...props} order={{ ...f.order, updatedAt: "2099-01-01T00:00:00.000Z" }} />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("mudou durante a revisão");
  expect(screen.getByRole("button", { name: "Confirmar cancelamento do item" })).toBeDisabled();
  expect(onSave).not.toHaveBeenCalled();
});
it("COMBO-UI-01 cadastro distingue itens juntos de alternativas e só persiste ao salvar", async () => {
  const f = await orderFixture(),
    save = vi.fn(async () => {});
  const combo = {
    ...tenantOf(f).products[0],
    id: "combo",
    name: "Super Combo",
    priceCents: 18000,
    combo: {
      groups: [
        {
          id: "g",
          name: "Pizzas",
          quantity: 1,
          options: tenantOf(f).products.map((p) => ({ productId: p.id, surchargeCents: 0 })),
        },
      ],
    },
  };
  const tenant = { ...tenantOf(f), products: [...tenantOf(f).products, combo] };
  render(
    <CatalogOperations
      view="combos"
      company={company}
      tenant={tenant}
      services={{ ...f.services, saveProduct: save }}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Editar Super Combo" }));
  const preview = screen.getByRole("region", { name: "Prévia do combo antes de salvar" });
  expect(preview).toHaveTextContent("uma opção");
  await userEvent.selectOptions(screen.getByLabelText("Funcionamento do grupo 1"), "included");
  expect(preview).toHaveTextContent("Todos estes itens entram juntos");
  expect(within(preview).getByText("Calabresa")).toBeInTheDocument();
  expect(within(preview).getByText("Mussarela")).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Salvar combo", exact: true }));
  expect(save).toHaveBeenCalledWith(
    company.id,
    expect.objectContaining({
      priceCents: 18000,
      combo: {
        groups: [
          expect.objectContaining({
            mode: "included",
            options: [{ productId: "a", surchargeCents: 0 }],
          }),
          expect.objectContaining({
            mode: "included",
            options: [{ productId: "b", surchargeCents: 0 }],
          }),
        ],
      },
    }),
  );
});
