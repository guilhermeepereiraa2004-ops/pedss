// @vitest-environment jsdom
import React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ApplicationProvider from "../src/components/ApplicationProvider";
import Storefront from "../src/pages/Storefront";
import Tracking from "../src/pages/Tracking";
import ProductOptions from "../src/components/ProductOptions";
import Checkout from "../src/components/Checkout";
import { fixture, company, cartLine, checkout } from "./fixtures.ts";
import { pizzaProduct, pizzaLine } from "./pizza-fixture.ts";
import { shippingRuleKey } from "../src/core/shipping.ts";

afterEach(cleanup);
function site(f, path = "/store/demo") {
  return render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/store/:storeId" element={<Storefront />} />
          <Route path="/pedido/:token" element={<Tracking />} />
        </Routes>
      </MemoryRouter>
    </ApplicationProvider>,
  );
}

it("AUDIT-FIX-01 edição, cancelamento e reabertura da sacola preservam o preenchimento e retirada sem frete", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, pizzaProduct);
  await f.services.addToCart(company.id, pizzaLine);
  site(f);
  await userEvent.click(await screen.findByRole("button", { name: "Abrir sacola com 1 item" }));
  await userEvent.click(screen.getByLabelText("Retirada", { exact: true }));
  await userEvent.type(screen.getByLabelText(/Como podemos chamar/), "Cliente Teste");
  await userEvent.type(screen.getByLabelText(/Telefone com DDD/), "11900000000");
  await userEvent.selectOptions(screen.getByLabelText(/Forma de pagamento/), "Pix");
  await userEvent.type(screen.getByLabelText("Observações do pedido"), "Vou buscar pessoalmente");
  await userEvent.type(screen.getByLabelText("Cupom de desconto"), "TESTE");
  await userEvent.click(screen.getByRole("button", { name: "Editar Monte sua pizza" }));
  await userEvent.click(screen.getByRole("button", { name: "Aumentar quantidade", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: /Salvar alterações/ }));
  const verify = () => {
    expect(screen.getByLabelText(/Como podemos chamar/)).toHaveValue("Cliente Teste");
    expect(screen.getByLabelText(/Telefone com DDD/)).toHaveValue("11900000000");
    expect(screen.getByLabelText("Retirada", { exact: true })).toBeChecked();
    expect(screen.getByLabelText(/Forma de pagamento/)).toHaveValue("Pix");
    expect(screen.getByLabelText("Observações do pedido")).toHaveValue("Vou buscar pessoalmente");
    expect(screen.getByLabelText("Cupom de desconto")).toHaveValue("TESTE");
    expect(screen.getByText("Total").parentElement).toHaveTextContent("R$ 100,02");
  };
  await waitFor(verify);
  await userEvent.click(screen.getByRole("button", { name: "Editar Monte sua pizza" }));
  await userEvent.click(screen.getByRole("button", { name: /Voltar ao cardápio/ }));
  verify();
  await userEvent.click(screen.getByRole("button", { name: "Fechar janela" }));
  await userEvent.click(screen.getByRole("button", { name: "Abrir sacola com 2 itens" }));
  verify();
  expect(f.repo.getSnapshot().tenants[company.id].orders).toHaveLength(0);
});

it("AUDIT-FIX-02 pizza individual migra retiradas antigas sem duplicar controles e mantém opcionais gerais", async () => {
  const p = structuredClone(pizzaProduct);
  p.pizza.flavors = [{ ...p.pizza.flavors[1], ingredients: ["Cebola", "Orégano"] }];
  p.ingredients = ["Cebola", "Orégano", "Molho extra"];
  const add = vi.fn();
  render(
    <ProductOptions
      product={p}
      onAdd={add}
      initialLine={{
        quantity: 1,
        extraIds: [],
        removedIngredients: ["Cebola", "Molho extra"],
        notes: "Manter observação",
      }}
    />,
  );
  expect(screen.getAllByRole("checkbox", { name: "Sem Cebola", exact: true })).toHaveLength(1);
  expect(screen.getByRole("checkbox", { name: "Sem Cebola", exact: true })).toBeChecked();
  await userEvent.click(screen.getByRole("radio", { name: /^Grande/ }));
  expect(screen.getByRole("checkbox", { name: /^Calabresa/ })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Sem Cebola", exact: true })).toBeChecked();
  await userEvent.click(screen.getByRole("checkbox", { name: "Sem Orégano", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: /Salvar alterações/ }));
  expect(add).toHaveBeenCalledWith(
    expect.objectContaining({
      removedIngredients: ["Molho extra"],
      notes: "Manter observação",
      pizza: expect.objectContaining({
        flavorIds: ["pepper"],
        customizations: [
          expect.objectContaining({
            flavorId: "pepper",
            removedIngredients: ["Cebola", "Orégano"],
          }),
        ],
      }),
    }),
  );
});

it("AUDIT-FIX-03 pedir novamente abre a sacola da loja correta sem enviar outro pedido", async () => {
  const f = await fixture();
  await f.services.addToCart(company.id, cartLine);
  const order = await f.services.checkout(
    company.id,
    f.repo.getSnapshot().tenants[company.id].cart.requestId,
    { ...checkout, fulfillment: "pickup", expectedTotalCents: 6780 },
  );
  site(f, `/pedido/${order.trackingToken}`);
  expect((await screen.findByText("Retirada", { exact: true })).parentElement).toHaveTextContent(
    "R$ 0,00",
  );
  await userEvent.click(screen.getByRole("button", { name: "Pedir novamente" }));
  const dialog = await screen.findByRole("dialog", { name: "Coisa boa na sua sacola." });
  expect(
    within(dialog).getByRole("button", { name: /Confirmar pedido local/ }),
  ).toBeInTheDocument();
  expect(f.repo.getSnapshot().tenants[company.id].orders).toHaveLength(1);
});

it("AUDIT-FIX-04 rascunho restaurado não reutiliza cupom de outra sacola nem frete vencido", async () => {
  const f = await fixture();
  await f.services.addToCart(company.id, cartLine);
  const tenant = structuredClone(f.repo.getSnapshot().tenants[company.id]);
  tenant.settings.shipping = {
    mode: "distance",
    originPostalCode: "01001000",
    fixedFeeCents: 0,
    baseFeeCents: 0,
    perKmCents: 200,
    minimumFeeCents: 0,
    maxDistanceKm: 10,
  };
  const oldKey = JSON.stringify(["TESTE", tenant.cart.lines, "11900000000"]);
  tenant.cart.lines[0].quantity++;
  render(
    <Checkout
      tenant={tenant}
      availability={{ open: true }}
      mode="remote"
      onQuantity={vi.fn()}
      onSubmit={vi.fn()}
      now={new Date("2026-11-04T17:00:00Z")}
      initialDraft={{
        values: {
          name: "Cliente",
          phone: "11900000000",
          postalCode: "01310100",
          fulfillment: "delivery",
        },
        couponText: "TESTE",
        couponCode: "TESTE",
        remoteCoupon: { key: oldKey, value: { code: "TESTE", discountCents: 100 } },
        shippingQuote: {
          postalCode: "01310100",
          feeCents: 500,
          token: "expired",
          expiresAt: "2026-11-04T16:00:00Z",
          ruleKey: shippingRuleKey(tenant.settings),
        },
      }}
    />,
  );
  expect(
    screen.getByText("A sacola ou o telefone mudou. Aplique o cupom novamente."),
  ).toBeInTheDocument();
  expect(screen.getByText("Calcule pelo CEP")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Confirmar pedido" })).toBeDisabled();
  expect(screen.getByLabelText(/Como podemos chamar/)).toHaveValue("Cliente");
});
