// @vitest-environment jsdom
import React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import RestaurantPanel from "../src/components/RestaurantPanel";
import CatalogOperations from "../src/components/CatalogOperations";
import ProductOptions from "../src/components/ProductOptions";
import PizzaConfigEditor from "../src/components/PizzaConfigEditor";
import { company, initial, product } from "./fixtures.ts";
import { pizzaProduct, pizzaConfig } from "./pizza-fixture.ts";
import { restaurantSchema } from "../src/core/restaurantModel.ts";
afterEach(cleanup);
const props = () => ({
  company,
  tenant: initial().tenants[company.id],
  services: {
    createStaffOrder: vi.fn(),
    saveInventoryItem: vi.fn(),
    saveScheduling: vi.fn(),
    openCash: vi.fn(),
  },
  now: new Date(),
  onDetail: vi.fn(),
});
it("REST-UI-01 caixa explica dinheiro e envia centavos, sem disparar pagamento", async () => {
  const p = props(),
    user = userEvent.setup();
  render(<RestaurantPanel {...p} view="cash" />);
  expect(screen.getByText(/Despesas do financeiro não saem automaticamente/)).toBeInTheDocument();
  await user.clear(screen.getByRole("textbox", { name: "Dinheiro inicial (R$)" }));
  await user.type(screen.getByRole("textbox", { name: "Dinheiro inicial (R$)" }), "100,00");
  await user.click(screen.getByRole("button", { name: "Abrir turno" }));
  expect(p.services.openCash).toHaveBeenCalledWith(company.id, 10000);
  expect(p.services.createStaffOrder).not.toHaveBeenCalled();
});
it("REST-UI-02 cadastro de estoque converte unidade de compra e mostra ficha", async () => {
  const p = props(),
    user = userEvent.setup();
  render(<CatalogOperations {...p} view="inventory" />);
  await user.type(screen.getByRole("textbox", { name: "Nome do ingrediente" }), "Queijo");
  await user.clear(screen.getByRole("spinbutton", { name: /Custo em R\$/ }));
  await user.type(screen.getByRole("spinbutton", { name: /Custo em R\$/ }), "0.04");
  await user.click(screen.getByRole("button", { name: "Salvar ingrediente" }));
  expect(p.services.saveInventoryItem).toHaveBeenCalledWith(
    company.id,
    expect.objectContaining({ name: "Queijo", costPerUnitCents: 4, unit: "g" }),
  );
  expect(screen.getByRole("heading", { name: "Ficha técnica" })).toBeInTheDocument();
});
it("REST-UI-03 combo exige cada grupo e envia somente escolhas identificadas", async () => {
  const user = userEvent.setup(),
    onAdd = vi.fn(),
    combo = {
      ...product,
      id: "combo",
      name: "Combo",
      extras: [],
      combo: {
        groups: [
          {
            id: "g",
            name: "Lanche",
            quantity: 1,
            options: [{ productId: product.id, surchargeCents: 200 }],
          },
        ],
      },
    };
  render(<ProductOptions product={combo} products={[combo, product]} onAdd={onAdd} />);
  expect(screen.getByRole("button", { name: /Adicionar combo/ })).toBeDisabled();
  await user.click(screen.getByRole("radio", { name: /Nome oficial/ }));
  await user.click(screen.getByRole("button", { name: /Adicionar combo/ }));
  expect(onAdd).toHaveBeenCalledWith(
    expect.objectContaining({ comboChoices: [{ groupId: "g", productId: product.id }] }),
  );
});
it("REST-UI-04 prévia fotográfica acompanha metade/quartos e adicional por sabor", async () => {
  const user = userEvent.setup();
  function Client() {
    const [p] = React.useState(() => ({
      ...pizzaProduct,
      pizza: {
        ...pizzaConfig,
        allowUnequalParts: true,
        flavors: pizzaConfig.flavors.map((f) => ({
          ...f,
          extras: [{ id: "extra", name: "Queijo extra", priceCents: 200, available: true }],
        })),
      },
    }));
    return <ProductOptions product={p} onAdd={() => {}} />;
  }
  render(<Client />);
  await user.click(screen.getByRole("radio", { name: /^Grande/ }));
  await user.click(screen.getByRole("radio", { name: "3 sabores", exact: true }));
  for (const name of ["Mussarela", "Calabresa", "Frango"])
    await user.click(screen.getByRole("checkbox", { name: new RegExp("^" + name) }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Divisão da pizza" }), "quarters");
  expect(screen.getByRole("img", { name: /Pizza Grande: 2\/4: Mussarela/ })).toBeInTheDocument();
  expect(screen.getAllByText(/Aplica somente à parte deste sabor/)).toHaveLength(3);
});
it("REST-UI-05 agendamento permite configurar capacidade sem acessar serviço externo", async () => {
  const p = props(),
    user = userEvent.setup();
  p.tenant.restaurant = restaurantSchema.parse({});
  render(<RestaurantPanel {...p} view="scheduling" />);
  await user.click(screen.getByRole("checkbox", { name: "Permitir agendamento" }));
  await user.clear(screen.getByRole("spinbutton", { name: "Pedidos por horário" }));
  await user.type(screen.getByRole("spinbutton", { name: "Pedidos por horário" }), "3");
  await user.click(screen.getByRole("button", { name: "Salvar agendamento" }));
  expect(p.services.saveScheduling).toHaveBeenCalledWith(
    company.id,
    expect.objectContaining({ enabled: true, capacity: 3 }),
  );
});
it("REST-UI-06 ingredientes e alergênicos aceitam listas sem perder vírgulas digitadas", async () => {
  const user = userEvent.setup(),
    onChange = vi.fn();
  render(
    <PizzaConfigEditor
      section="rules"
      product={{ ...pizzaProduct, pizza: { ...pizzaConfig, flavors: [pizzaConfig.flavors[0]] } }}
      onChange={onChange}
    />,
  );
  const input = screen.getByRole("textbox", { name: "Alergênicos informados pela loja" });
  await user.type(input, "Leite, trigo");
  expect(input).toHaveValue("Leite, trigo");
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({
      flavors: [expect.objectContaining({ allergens: ["Leite", "trigo"] })],
    }),
  );
});
