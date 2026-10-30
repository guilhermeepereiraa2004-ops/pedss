// @vitest-environment jsdom
import React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import ComboMenuCard, { ComboArtwork } from "../src/components/ComboPresentation";
import ProductOptions from "../src/components/ProductOptions";
import {
  comboGroups,
  comboArtworkItems,
  comboUnitsLabel,
} from "../src/application/comboPresentation";
import { pizzaProduct, pizzaConfig, pizzaSelection } from "./pizza-fixture.ts";
import { product } from "./fixtures.ts";
import { priceLine } from "../src/core/domain.ts";
import { comboLines } from "../src/core/restaurant.ts";
afterEach(cleanup);
const fixedPizza = (id, name) => ({
  ...pizzaProduct,
  id,
  name,
  pizza: { ...pizzaConfig, flavors: [{ ...pizzaConfig.flavors[0], name }] },
});
const cheese = fixedPizza("cheese-product", "Mussarela"),
  calabresa = fixedPizza("calabresa-product", "Calabresa");
const combo = {
  ...product,
  id: "combo",
  name: "Super Combo",
  priceCents: 18000,
  description: "Para compartilhar",
  extras: [],
  combo: {
    groups: [
      {
        id: "first",
        name: "Primeira pizza",
        quantity: 1,
        options: [{ productId: cheese.id, sizeId: "large", surchargeCents: 0 }],
      },
      {
        id: "second",
        name: "Segunda pizza",
        quantity: 2,
        options: [{ productId: calabresa.id, sizeId: "large", surchargeCents: 0 }],
      },
    ],
  },
};
const products = [combo, cheese, calabresa];
it("COMBO-VISUAL-04 três pizzas fixas entram juntas, sem obrigar a escolher apenas um sabor", async () => {
  const margherita = fixedPizza("margherita-product", "Margherita");
  const pizzas = [calabresa, cheese, margherita];
  const fixed = {
    ...combo,
    combo: {
      groups: pizzas.map((p, i) => ({
        id: `fixed-${i}`,
        name: p.name,
        quantity: 1,
        options: [{ productId: p.id, sizeId: "large", surchargeCents: 0 }],
      })),
    },
  };
  const catalog = [...pizzas, fixed],
    onAdd = vi.fn();
  render(<ProductOptions product={fixed} products={catalog} onAdd={onAdd} />);
  expect(screen.getByText("3 pizzas")).toBeInTheDocument();
  expect(screen.getByText("3 de 3 grupos escolhidos")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Adicionar combo/ }));
  const line = onAdd.mock.calls[0][0];
  expect(comboLines(line, catalog).map((c) => c.productId)).toEqual(pizzas.map((p) => p.id));
  expect(priceLine(line, catalog).totalCents).toBe(18000);
});
it("COMBO-VISUAL-05 alternativas não são escolhidas automaticamente nem confundidas com três itens inclusos", () => {
  const optional = {
    ...combo,
    combo: {
      groups: [
        {
          id: "choice",
          name: "Escolha sua pizza",
          quantity: 1,
          options: [cheese, calabresa].map((p) => ({
            productId: p.id,
            sizeId: "large",
            surchargeCents: 0,
          })),
        },
      ],
    },
  };
  render(
    <ProductOptions product={optional} products={[optional, cheese, calabresa]} onAdd={() => {}} />,
  );
  expect(screen.getByText("0 de 1 grupos escolhidos")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Adicionar combo/ })).toBeDisabled();
});
it("COMBO-VISUAL-01 card reúne pizzas, tamanhos, quantidade e preço sem alterar escolhas", async () => {
  const user = userEvent.setup(),
    onOpen = vi.fn();
  render(<ComboMenuCard product={combo} products={products} onOpen={onOpen} />);
  expect(screen.getByRole("heading", { name: "Super Combo" })).toBeInTheDocument();
  const contents = screen.getByRole("list", { name: "O que vem em Super Combo" });
  expect(within(contents).getByText("Mussarela")).toBeInTheDocument();
  expect(within(contents).getByText("Calabresa")).toBeInTheDocument();
  expect(screen.getByText("3 pizzas")).toBeInTheDocument();
  expect(screen.getAllByText("Grande · 35 cm")).toHaveLength(2);
  expect(screen.getByText(/180,00/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Escolher Super Combo" }));
  expect(onOpen).toHaveBeenCalledOnce();
  expect(combo.combo.groups[1].quantity).toBe(2);
});
it("COMBO-VISUAL-02 galeria usa produtos elegíveis e escolhas reais, respeitando foto própria e limite visual", () => {
  const off = { ...cheese, id: "off", status: "Indisponível" },
    own = { ...calabresa, cutoutImage: "/own-calabresa.png" };
  const c = {
    ...combo,
    combo: {
      groups: [
        {
          id: "g",
          name: "Pizzas",
          quantity: 6,
          options: [
            { productId: off.id, sizeId: "large", surchargeCents: 0 },
            { productId: own.id, sizeId: "large", surchargeCents: 0 },
          ],
        },
      ],
    },
  };
  const groups = comboGroups(c, [off, own]);
  expect(comboArtworkItems(groups, [off, own])).toHaveLength(4);
  expect(comboArtworkItems(groups, [off, own])[0].product.cutoutImage).toBe("/own-calabresa.png");
  expect(comboUnitsLabel(groups)).toBe("6 pizzas");
  const mixed = {
    ...c,
    combo: {
      groups: [
        {
          ...c.combo.groups[0],
          options: [...c.combo.groups[0].options, { productId: product.id, surchargeCents: 0 }],
        },
      ],
    },
  };
  expect(comboUnitsLabel(comboGroups(mixed, [off, own, product]))).toBe("6 itens no combo");
  render(
    <ComboMenuCard product={c} products={[off, own]} readOnly canOrder={false} onOpen={() => {}} />,
  );
  expect(screen.getByRole("button", { name: "Ver detalhes de Super Combo" })).toBeEnabled();
});
it("COMBO-VISUAL-03 resumo acompanha seleção de cada pizza e reabre composição montada", async () => {
  const user = userEvent.setup(),
    onAdd = vi.fn();
  render(<ProductOptions product={combo} products={products} onAdd={onAdd} />);
  const summary = screen.getByRole("complementary", { name: "Resumo do combo" });
  expect(within(summary).getByText("2 de 2 grupos escolhidos")).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Mussarela/ })).toBeChecked();
  expect(screen.getByRole("radio", { name: /Calabresa/ })).toBeChecked();
  expect(within(summary).getAllByLabelText("Escolhido")).toHaveLength(2);
  await user.click(screen.getByRole("button", { name: /Adicionar combo/ }));
  expect(onAdd).toHaveBeenCalledWith(
    expect.objectContaining({
      comboChoices: [
        { groupId: "first", productId: cheese.id },
        { groupId: "second", productId: calabresa.id },
      ],
    }),
  );
  cleanup();
  const mounted = {
    ...combo,
    combo: {
      groups: [
        {
          id: "g",
          name: "Pizza",
          quantity: 1,
          options: [
            {
              productId: pizzaProduct.id,
              sizeId: "medium",
              surchargeCents: 0,
              customizePizza: true,
            },
          ],
        },
      ],
    },
  };
  render(
    <ComboArtwork
      product={mounted}
      products={[pizzaProduct]}
      choices={[{ groupId: "g", productId: pizzaProduct.id, pizza: pizzaSelection }]}
    />,
  );
  expect(
    screen.getByRole("img", { name: /Pizza Média: 1\/2: Mussarela; 1\/2: Calabresa/ }),
  ).toBeInTheDocument();
});
