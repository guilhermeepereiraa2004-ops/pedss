// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { webcrypto } from "node:crypto";
import PizzaManagement from "../src/components/PizzaManagement";
import ProductOptions from "../src/components/ProductOptions";
import { pizzaFormatPrices, pricePizza } from "../src/core/pizza.ts";
import { comboOptionState } from "../src/core/restaurant.ts";
import { fixture, company } from "./fixtures.ts";
import { pizzaProduct, pizzaConfig, pizzaSelection } from "./pizza-fixture.ts";
vi.stubGlobal("crypto", webcrypto);
afterEach(cleanup);
it("PIZZA-ADMIN-04 três regras acessíveis e preço fixo por tamanho salvo no serviço", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, pizzaProduct);
  const user = userEvent.setup();
  render(<PizzaManagement company={company} products={[pizzaProduct]} services={f.services} />);
  expect(screen.getByRole("radio", { name: /^Média dos sabores/ })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /^Sabor mais caro/ })).toBeChecked();
  await user.click(screen.getByRole("radio", { name: /^Preço fixo/ }));
  await user.type(screen.getByRole("textbox", { name: "Preço fixo em Média" }), "39,90");
  await user.type(screen.getByRole("textbox", { name: "Preço fixo em Grande" }), "49,90");
  await user.click(screen.getByRole("tab", { name: "Preços por tamanho" }));
  expect(screen.getByRole("checkbox", { name: "Oferecer Mussarela em Grande" })).toBeChecked();
  expect(
    screen.queryByRole("textbox", { name: "Preço de Mussarela em Grande" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Salvar tamanhos e preços" }));
  expect(await screen.findByRole("status")).toHaveTextContent("salvos");
  const config = f.repo
    .getSnapshot()
    .tenants[company.id].products.find((p) => p.id === pizzaProduct.id).pizza;
  expect(config.pricing).toBe("fixed");
  expect(config.sizes.map((s) => s.fixedPriceCents)).toEqual([3990, 4990]);
});

it("PIZZA-ADMIN-05 cliente paga o fixo do tamanho ao combinar sabores sem preços individuais", async () => {
  const user = userEvent.setup();
  render(
    <ProductOptions
      product={{
        ...pizzaProduct,
        pizza: {
          ...pizzaConfig,
          pricing: "fixed",
          sizes: pizzaConfig.sizes.map((s) => ({ ...s, fixedPriceCents: 4990 })),
          flavors: pizzaConfig.flavors.map((f) => ({ ...f, prices: {} })),
        },
      }}
      onAdd={() => {}}
    />,
  );
  await user.click(screen.getByRole("radio", { name: "2 sabores", exact: true }));
  await user.click(screen.getByRole("checkbox", { name: /Mussarela/ }));
  await user.click(screen.getByRole("checkbox", { name: /Calabresa/ }));
  expect(screen.getByRole("button", { name: /Adicionar/ })).toHaveTextContent(/49,90/);
  await user.click(screen.getByRole("radio", { name: /Requeijão/ }));
  expect(screen.getByRole("button", { name: /Adicionar/ })).toHaveTextContent(/57,90/);
});

it("PIZZA-ADMIN-01 administrador salva tamanhos de 3/4 fatias e valores para 3/4 sabores", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, pizzaProduct);
  const user = userEvent.setup();
  render(<PizzaManagement company={company} products={[pizzaProduct]} services={f.services} />);
  await user.click(screen.getByRole("tab", { name: "Tamanhos e fatias" }));
  const slices = screen.getAllByRole("spinbutton", { name: "Fatias" });
  await user.clear(slices[0]);
  await user.type(slices[0], "3");
  await user.clear(slices[1]);
  await user.type(slices[1], "4");
  await user.click(screen.getByRole("tab", { name: "Preços por sabores" }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Cobrança por quantidade em Grande" }),
    "fixed",
  );
  await user.type(
    screen.getByRole("textbox", { name: "Preço fixo de 3 sabores em Grande" }),
    "65,90",
  );
  await user.type(
    screen.getByRole("textbox", { name: "Preço fixo de 4 sabores em Grande" }),
    "75,90",
  );
  await user.click(screen.getByRole("button", { name: "Salvar tamanhos e preços" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Tamanhos e preços salvos");
  const product = f.repo
    .getSnapshot()
    .tenants[company.id].products.find((p) => p.id === pizzaProduct.id);
  expect(product.pizza.sizes.map((s) => s.slices)).toEqual([3, 4]);
  expect(product.pizza.sizes[1].flavorCountPricing).toEqual({
    mode: "fixed",
    prices: { 3: 6590, 4: 7590 },
  });
});

it("PIZZA-ADMIN-02 descarte recupera campos monetários e não altera o catálogo", async () => {
  const f = await fixture();
  const save = vi.spyOn(f.services, "saveProduct");
  const user = userEvent.setup();
  render(<PizzaManagement company={company} products={[pizzaProduct]} services={f.services} />);
  await user.click(screen.getByRole("tab", { name: "Preços por tamanho" }));
  const field = screen.getByRole("textbox", { name: "Preço de Mussarela em Média" });
  await user.clear(field);
  await user.type(field, "99");
  expect(
    screen.getByRole("combobox", { name: "Qual produto você quer configurar?" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Descartar alterações" }));
  expect(screen.getByRole("textbox", { name: "Preço de Mussarela em Média" })).toHaveValue("30");
  expect(save).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Novo montador" }));
  await user.click(screen.getByRole("button", { name: "Descartar alterações" }));
  expect(screen.getByRole("textbox", { name: "Nome da pizza ou montador" })).toHaveValue(
    pizzaProduct.name,
  );
});

it("PIZZA-ADMIN formatos por tamanho preservam os preços e limitam cardápio, pedidos e combos", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, pizzaProduct);
  await f.services.linkPizzaCatalog(company.id, pizzaProduct.id);
  const readProducts = () => f.repo.getSnapshot().tenants[company.id].products;
  const user = userEvent.setup();
  render(<PizzaManagement company={company} products={readProducts()} services={f.services} />);
  await user.click(screen.getByRole("tab", { name: "Tamanhos e fatias" }));
  const medium = within(screen.getByRole("group", { name: "Formatos de Média" }));
  await user.click(medium.getByRole("checkbox", { name: "Inteira" }));
  expect(medium.getByRole("checkbox", { name: "Meio a meio" })).toBeDisabled();
  const large = within(screen.getByRole("group", { name: "Formatos de Grande" }));
  await user.click(large.getByRole("checkbox", { name: "Meio a meio" }));
  await user.click(large.getByRole("checkbox", { name: "4 sabores" }));
  await user.click(screen.getByRole("tab", { name: "Preços por sabores" }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Cobrança por quantidade em Média" }),
    "fixed",
  );
  expect(screen.queryByRole("textbox", { name: "Preço fixo de 1 sabor em Média" })).toBeNull();
  await user.type(
    screen.getByRole("textbox", { name: "Preço fixo de 2 sabores em Média" }),
    "65,00",
  );
  await user.click(screen.getByRole("button", { name: "Salvar tamanhos e preços" }));
  expect(await screen.findByRole("status")).toHaveTextContent("salvos");

  const products = readProducts();
  const saved = products.find((item) => item.id === pizzaProduct.id);
  expect(
    pizzaFormatPrices(saved.pizza).map(({ formats }) => formats.map(({ count }) => count)),
  ).toEqual([[2], [1, 3]]);
  expect(pricePizza(saved.pizza, pizzaSelection).priceCents).toBe(7500);
  expect(() => pricePizza(saved.pizza, { ...pizzaSelection, flavorIds: ["cheese"] })).toThrow(
    /não é oferecido/,
  );
  const combo = comboOptionState(
    { productId: saved.id, sizeId: "medium", customizePizza: true, surchargeCents: 0 },
    products,
  );
  expect(combo.initialPizza?.flavorCount).toBe(2);
  expect(combo.minimumExtraCents).toBe(0);
  const cheese = products.find((item) => item.id === saved.pizza.flavors[0].sourceProductId);
  expect(pizzaFormatPrices(cheese.pizza)[0].formats[0].count).toBe(1);
});

it("PIZZA-ADMIN-03 cliente vê preço da quantidade escolhida e soma massa/borda uma vez", async () => {
  const user = userEvent.setup();
  const onAdd = vi.fn();
  const product = {
    ...pizzaProduct,
    pizza: {
      ...pizzaConfig,
      sizes: [
        pizzaConfig.sizes[0],
        {
          ...pizzaConfig.sizes[1],
          slices: 4,
          flavorCountPricing: { mode: "fixed", prices: { 3: 6500, 4: 7500 } },
        },
      ],
    },
  };
  render(<ProductOptions product={product} onAdd={onAdd} />);
  await user.click(screen.getByRole("radio", { name: /Grande/ }));
  await user.click(screen.getByRole("radio", { name: /^3 sabores/ }));
  await user.click(screen.getByRole("checkbox", { name: /Mussarela/ }));
  await user.click(screen.getByRole("checkbox", { name: /Calabresa/ }));
  await user.click(screen.getByRole("checkbox", { name: /Frango/ }));
  expect(screen.getByText(/Preço fixo da pizza: R\$.*65,00/)).toBeInTheDocument();
  await user.click(screen.getByRole("radio", { name: /Fina/ }));
  await user.click(screen.getByRole("radio", { name: /Requeijão/ }));
  expect(screen.getByRole("button", { name: /Adicionar/ })).toHaveTextContent(/75,00/);
  await user.click(screen.getByRole("button", { name: /Adicionar/ }));
  await waitFor(() =>
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        pizza: expect.objectContaining({ flavorCount: 3, sizeId: "large" }),
      }),
    ),
  );
});
