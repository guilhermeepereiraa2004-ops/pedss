// @vitest-environment jsdom
import React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { webcrypto } from "node:crypto";
import ProductOptions from "../src/components/ProductOptions";
import PizzaManagement from "../src/components/PizzaManagement";
import OrderPrint from "../src/components/OrderPrint";
import { pizzaProduct } from "./pizza-fixture.ts";
import { orderFixture } from "./order-amendment-fixture.ts";
import { company } from "./fixtures.ts";
vi.stubGlobal("crypto", webcrypto);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("PIZZA-LAUNCH-UI-01 flavor search/filter retain chosen flavors and show an empty-state without resetting the pizza", async () => {
  const p = structuredClone(pizzaProduct);
  p.pizza.flavors.push({
    id: "sweet",
    name: "Chocolate",
    kind: "sweet",
    available: true,
    prices: { medium: 4000, large: 5000 },
  });
  render(<ProductOptions product={p} onAdd={vi.fn()} />);
  await userEvent.click(screen.getByRole("radio", { name: "2 sabores", exact: true }));
  await userEvent.click(screen.getByRole("checkbox", { name: /^Mussarela/ }));
  await userEvent.type(screen.getByRole("searchbox", { name: "Buscar sabor" }), "calabresa");
  expect(screen.queryByRole("checkbox", { name: /^Mussarela/ })).toBeNull();
  expect(screen.getByText("Selecionados: Mussarela")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("checkbox", { name: /^Calabresa/ }));
  expect(screen.getByRole("img", { name: /Pizza Média/ })).toHaveAccessibleName(
    /Mussarela.*Calabresa/,
  );
  await userEvent.clear(screen.getByRole("searchbox", { name: "Buscar sabor" }));
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Tipo de sabor" }), "sweet");
  expect(screen.getByRole("checkbox", { name: /Chocolate/ })).toBeDisabled();
  await userEvent.type(screen.getByRole("searchbox", { name: "Buscar sabor" }), "inexistente");
  expect(screen.getByRole("status")).toHaveTextContent("Nenhum sabor encontrado");
  expect(screen.getByRole("button", { name: /Adicionar/ })).toBeEnabled();
});

it("PIZZA-LAUNCH-UI-02 price breakdown accounts for quantity, dough and edge without changing the submitted selection", async () => {
  const add = vi.fn();
  render(<ProductOptions product={pizzaProduct} onAdd={add} />);
  await userEvent.click(screen.getByRole("radio", { name: "2 sabores", exact: true }));
  await userEvent.click(screen.getByRole("checkbox", { name: /^Mussarela/ }));
  await userEvent.click(screen.getByRole("checkbox", { name: /^Calabresa/ }));
  await userEvent.click(screen.getByRole("radio", { name: /^Fina/ }));
  await userEvent.click(screen.getByRole("radio", { name: /^Requeijão/ }));
  await userEvent.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
  await userEvent.click(screen.getByText("Como chegamos ao preço"));
  const price = screen.getByLabelText("Composição do preço");
  expect(price).toHaveTextContent("R$ 100,02");
  expect(price).toHaveTextContent("R$ 8,00");
  await userEvent.click(screen.getByRole("button", { name: /Adicionar/ }));
  expect(add).toHaveBeenCalledWith(
    expect.objectContaining({
      quantity: 2,
      pizza: expect.objectContaining({ edgeId: "cream", doughId: "thin" }),
    }),
  );
});

it("PIZZA-LAUNCH-UI-03 guided editing and the simulator do not save on Enter or create orders", async () => {
  const save = vi.fn(),
    staff = vi.fn();
  render(
    <PizzaManagement
      company={company}
      products={[pizzaProduct]}
      services={{ saveProduct: save, createStaffOrder: staff }}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Configurar passo a passo" }));
  expect(screen.getByRole("status")).toHaveTextContent("Passo 1 de 6");
  await userEvent.click(screen.getByRole("button", { name: "Próxima etapa" }));
  expect(screen.getByRole("status")).toHaveTextContent("Tamanhos e fatias");
  await userEvent.click(screen.getByRole("button", { name: "Simular uma compra" }));
  const dialog = screen.getByRole("dialog", { name: "Simular uma compra" });
  await userEvent.click(within(dialog).getByRole("radio", { name: "2 sabores", exact: true }));
  await userEvent.click(within(dialog).getByRole("checkbox", { name: /^Mussarela/ }));
  await userEvent.click(within(dialog).getByRole("checkbox", { name: /^Calabresa/ }));
  await userEvent.type(
    within(dialog).getByRole("searchbox", { name: "Buscar sabor" }),
    "calabresa{Enter}",
  );
  expect(within(dialog).getByLabelText("Composição do preço")).toHaveTextContent("R$ 40,01");
  expect(save).not.toHaveBeenCalled();
  expect(staff).not.toHaveBeenCalled();
  await userEvent.click(within(dialog).getByRole("button", { name: "Fechar janela" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("PIZZA-LAUNCH-UI-04 thermal copies show customer/delivery totals and use the selected width", async () => {
  const f = await orderFixture(),
    print = vi.spyOn(window, "print").mockImplementation(() => {});
  const { container } = render(<OrderPrint order={f.order} storeName="Cia de teste" />);
  const receipt = container.querySelector(".thermal-ticket");
  expect(receipt).toHaveTextContent("CLIENTE");
  expect(receipt).toHaveTextContent("R$");
  expect(screen.queryByRole("option", { name: "Cozinha" })).not.toBeInTheDocument();
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Via da impressão" }),
    "delivery",
  );
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Papel térmico" }), "58");
  expect(receipt).toHaveTextContent("ENTREGA");
  expect(receipt).toHaveTextContent("Saldo: R$ 100,00");
  expect(receipt.style.getPropertyValue("--receipt-width")).toBe("58mm");
  fireEvent.click(screen.getByRole("button", { name: "Imprimir pedido" }));
  expect(print).toHaveBeenCalledOnce();
});
