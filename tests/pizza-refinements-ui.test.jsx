// @vitest-environment jsdom
import React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import ProductOptions from "../src/components/ProductOptions";
import Checkout from "../src/components/Checkout";
import PaymentReceipt from "../src/components/PaymentReceipt";
import CatalogOperations from "../src/components/CatalogOperations";
import { initial, product, company } from "./fixtures.ts";
import { pizzaProduct, pizzaSelection, pizzaLine } from "./pizza-fixture.ts";
afterEach(cleanup);
it("REFINE-UI-01 edição recupera montagem, quantidade e observações e salva nova seleção", async () => {
  const user = userEvent.setup(),
    onAdd = vi.fn();
  render(
    <ProductOptions
      product={pizzaProduct}
      initialLine={{ ...pizzaLine, quantity: 2, notes: "Bem assada" }}
      onAdd={onAdd}
    />,
  );
  expect(screen.getByRole("radio", { name: /^Média/ })).toBeChecked();
  expect(screen.getByRole("radio", { name: "2 sabores", exact: true })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: /^Calabresa/ })).toBeChecked();
  expect(screen.getByRole("textbox", { name: "Observações deste item" })).toHaveValue("Bem assada");
  await user.click(screen.getByRole("radio", { name: /^Sem recheio/ }));
  await user.click(screen.getByRole("button", { name: /Salvar alterações/ }));
  expect(onAdd).toHaveBeenCalledWith(
    expect.objectContaining({
      quantity: 2,
      notes: "Bem assada",
      pizza: expect.objectContaining({ edgeId: "plain" }),
    }),
  );
});
it("REFINE-UI-02 checkout presencial permite telefone vazio e oferece editar a linha", async () => {
  const user = userEvent.setup(),
    t = initial().tenants[company.id],
    onSubmit = vi.fn(),
    onEditLine = vi.fn();
  t.settings.deliveryEnabled = false;
  t.cart.lines = [
    {
      key: "x",
      productId: product.id,
      quantity: 1,
      extraIds: [],
      removedIngredients: [],
      notes: "",
    },
  ];
  render(
    <Checkout
      tenant={t}
      availability={{ open: true }}
      customerOptional
      onSubmit={onSubmit}
      onQuantity={() => {}}
      onEditLine={onEditLine}
    />,
  );
  expect(screen.getByRole("textbox", { name: /Telefone.*opcional/ })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: `Editar ${product.name}` }));
  expect(onEditLine).toHaveBeenCalledWith("x");
  await user.click(screen.getByRole("button", { name: "Confirmar pedido local" }));
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "",
        phone: "",
        fulfillment: "pickup",
        expectedTotalCents: 2990,
      }),
    ),
  );
});
it("REFINE-UI-03 combo abre montador, inclui sabores e mantém escolha ao editar", async () => {
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
            name: "Pizza",
            quantity: 1,
            options: [
              { productId: "pizza", sizeId: "medium", surchargeCents: 0, customizePizza: true },
            ],
          },
        ],
      },
    };
  render(
    <ProductOptions
      product={combo}
      products={[combo, pizzaProduct]}
      initialLine={{
        ...pizzaLine,
        productId: "combo",
        comboChoices: [
          { groupId: "g", productId: "pizza", pizza: { ...pizzaSelection, flavorCount: 2 } },
        ],
      }}
      onAdd={onAdd}
    />,
  );
  await user.click(screen.getByRole("button", { name: /Editar montagem/ }));
  expect(screen.getAllByText("Incluído no combo")).toHaveLength(2);
  expect(screen.getByRole("checkbox", { name: /^Calabresa/ })).toBeChecked();
  await user.click(screen.getByRole("radio", { name: /^Sem recheio/ }));
  await user.click(screen.getByRole("button", { name: /Usar esta montagem/ }));
  await user.click(screen.getByRole("button", { name: /Salvar alterações/ }));
  expect(onAdd).toHaveBeenCalledWith(
    expect.objectContaining({
      comboChoices: [
        expect.objectContaining({ pizza: expect.objectContaining({ edgeId: "plain" }) }),
      ],
    }),
  );
});
it("REFINE-UI-04 recibo conserva token após falha e impede valor maior que o saldo", async () => {
  const user = userEvent.setup(),
    onSubmit = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce(true);
  render(<PaymentReceipt maximum={2000} methods={["Dinheiro", "Pix"]} onSubmit={onSubmit} />);
  const input = screen.getByRole("textbox", { name: "Valor recebido (R$)" });
  await user.clear(input);
  await user.type(input, "30,00");
  expect(screen.getByRole("button", { name: "Registrar pagamento parcial" })).toBeDisabled();
  await user.clear(input);
  await user.type(input, "10,00");
  await user.selectOptions(screen.getByRole("combobox", { name: "Forma de pagamento" }), "Pix");
  await user.click(screen.getByRole("button", { name: "Registrar pagamento parcial" }));
  await user.click(screen.getByRole("button", { name: "Registrar pagamento parcial" }));
  expect(onSubmit).toHaveBeenCalledTimes(2);
  expect(onSubmit.mock.calls[0][0]).toMatchObject({
    requestId: onSubmit.mock.calls[1][0].requestId,
    amountCents: 1000,
    method: "Pix",
  });
});
it("REFINE-UI-05 estoque permite escolher ficha de adicional comum", async () => {
  const user = userEvent.setup(),
    tenant = initial().tenants[company.id];
  render(
    <CatalogOperations
      view="inventory"
      company={company}
      tenant={tenant}
      services={{ createStaffOrder: vi.fn(), saveRecipe: vi.fn() }}
    />,
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Parte da ficha" }),
    "extra:cheese",
  );
  expect(screen.getByRole("option", { name: "Adicional do produto: Queijo" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Salvar ficha técnica" })).toBeInTheDocument();
});
