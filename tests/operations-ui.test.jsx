// @vitest-environment jsdom
import React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ApplicationProvider from "../src/components/ApplicationProvider";
import Storefront from "../src/pages/Storefront";
import Dashboard from "../src/pages/Dashboard";
import Tracking from "../src/pages/Tracking";
import Checkout from "../src/components/Checkout";
import { shippingRuleKey } from "../src/core/shipping.ts";
import { fixture, company, cartLine, checkout, product } from "./fixtures.ts";
import { pizzaProduct } from "./pizza-fixture.ts";
afterEach(cleanup);
it("PIZZA-MENU-01 catálogo mantém pizzas individuais e montador é uma chamada separada", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, {
    ...product,
    id: "calabresa",
    name: "Calabresa",
    category: "Pizza",
  });
  await f.services.saveProduct(company.id, {
    ...product,
    id: "mussarela",
    name: "Mussarela",
    category: "Pizza",
  });
  await f.services.saveProduct(company.id, {
    ...pizzaProduct,
    pizza: { ...pizzaProduct.pizza, menuPlacement: "builder" },
  });
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter initialEntries={["/store/demo"]}>
        <Routes>
          <Route path="/store/:storeId" element={<Storefront />} />
        </Routes>
      </MemoryRouter>
    </ApplicationProvider>,
  );
  expect(
    await screen.findByRole("heading", { name: "Calabresa", exact: true }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Mussarela", exact: true })).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Monte sua pizza", exact: true }),
  ).not.toBeInTheDocument();
  expect(screen.getByText("Quer mais de um sabor?")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Escolher Calabresa", exact: true }));
  expect(screen.queryByRole("region", { name: "Prévia da sua pizza" })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Fechar janela", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: "Monte sua pizza", exact: true }));
  expect(screen.getByRole("region", { name: "Prévia da sua pizza" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Voltar ao cardápio/ }));
  expect(
    screen.getByRole("button", { name: "Escolher Calabresa", exact: true }),
  ).toBeInTheDocument();
  await f.services.saveProduct(company.id, {
    ...pizzaProduct,
    status: "Indisponível",
    pizza: { ...pizzaProduct.pizza, menuPlacement: "builder" },
  });
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Monte sua pizza", exact: true }),
    ).not.toBeInTheDocument(),
  );
});
async function mount(path, element) {
  const f = await fixture();
  const app = { ...f, repository: f.repo };
  render(
    <ApplicationProvider runtime={app}>
      <MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>
    </ApplicationProvider>,
  );
  return app;
}
it("OPS-01 adicionar mostra confirmação e ícone da sacola com contador", async () => {
  const f = await mount(
    "/store/demo",
    <Routes>
      <Route path="/store/:storeId" element={<Storefront />} />
    </Routes>,
  );
  await userEvent.click(await screen.findByRole("button", { name: `Escolher ${product.name}` }));
  await userEvent.click(screen.getByRole("button", { name: /Adicionar/ }));
  const cart = await screen.findByRole("button", { name: "Abrir sacola com 1 item" });
  expect(cart).toHaveTextContent("1");
  expect(cart).not.toHaveTextContent(/Ver minha sacola|R\$/);
  expect(screen.getByText("Adicionado à sua sacola.")).toHaveAttribute("role", "status");
  await userEvent.click(cart);
  expect(await screen.findByRole("dialog")).toHaveTextContent("Coisa boa na sua sacola.");
  expect(f.repo.getSnapshot().tenants[company.id].cart.lines).toHaveLength(1);
});
it.each(["delivery", "pickup"])(
  "OPS-02 SIMPLE-ORDER-02 %s usa os botões de 30/10 sem alterar pagamento",
  async (fulfillment) => {
    const f = await fixture();
    await f.services.addToCart(company.id, cartLine);
    const order = await f.services.checkout(
      company.id,
      f.repo.getSnapshot().tenants[company.id].cart.requestId,
      { ...checkout, fulfillment, expectedTotalCents: fulfillment === "pickup" ? 6780 : 7280 },
    );
    render(
      <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
        <MemoryRouter initialEntries={["/dashboard?store=demo&tab=orders"]}>
          <Dashboard />
        </MemoryRouter>
      </ApplicationProvider>,
    );
    await userEvent.click(
      await screen.findByRole("button", { name: `Aceitar pedido ${order.number}` }),
    );
    await waitFor(() =>
      expect(f.repo.getSnapshot().tenants[company.id].orders[0].status).toBe("Aceito"),
    );
    expect(f.repo.getSnapshot().tenants[company.id].orders[0].paymentStatus).toBe("Pendente");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `Iniciar preparo ${order.number}` }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cozinha", exact: true })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: `Iniciar preparo ${order.number}` }));
    const readyAction = fulfillment === "pickup" ? "Pronto para retirada" : "Saiu para entrega";
    const readyStatus = fulfillment === "pickup" ? "Pronto para retirada" : "A caminho";
    await userEvent.click(
      await screen.findByRole("button", { name: `${readyAction} ${order.number}` }),
    );
    await waitFor(() =>
      expect(f.repo.getSnapshot().tenants[company.id].orders[0].status).toBe(readyStatus),
    );
    await userEvent.click(screen.getByRole("button", { name: readyStatus, exact: true }));
    expect(
      screen.getByRole("button", { name: `Detalhes do pedido ${order.number}` }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Todos", exact: true }));
    await userEvent.click(
      await screen.findByRole("button", { name: `Concluir entrega ${order.number}` }),
    );
    await waitFor(() =>
      expect(f.repo.getSnapshot().tenants[company.id].orders[0].status).toBe("Entregue"),
    );
    expect(f.repo.getSnapshot().tenants[company.id].orders[0].paymentStatus).toBe("Pendente");
    expect(screen.getByText("Entregue", { selector: ".tag" })).toBeInTheDocument();
  },
);

it("SIMPLE-ORDER-03 endereço antigo da cozinha abre Pedidos sem controles de produção", async () => {
  const f = await fixture();
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter initialEntries={["/dashboard?store=demo&tab=kitchen"]}>
        <Dashboard />
      </MemoryRouter>
    </ApplicationProvider>,
  );
  expect(
    await screen.findByRole("heading", { name: "Cada pedido, no seu tempo." }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Cozinha", exact: true })).not.toBeInTheDocument();
  expect(screen.queryByText("Cozinha em movimento.")).not.toBeInTheDocument();
});
it("OPS-03 acompanhamento não mostra status de pagamento, preservando o financeiro interno", async () => {
  const f = await fixture();
  await f.services.addToCart(company.id, cartLine);
  const order = await f.services.checkout(
    company.id,
    f.repo.getSnapshot().tenants[company.id].cart.requestId,
    checkout,
  );
  await f.services.changePayment(company.id, order.id, "Pago", "conferido");
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter initialEntries={["/pedido/" + order.trackingToken]}>
        <Routes>
          <Route path="/pedido/:token" element={<Tracking />} />
        </Routes>
      </MemoryRouter>
    </ApplicationProvider>,
  );
  expect(await screen.findByText(/acompanhe cada etapa/)).toBeInTheDocument();
  expect(screen.queryByText(/Pagamento: Pago/)).not.toBeInTheDocument();
  expect(f.repo.getSnapshot().tenants[company.id].orders[0].paymentStatus).toBe("Pago");
});
it("OPS-04 despesas ficam no financeiro e link antigo abre a aba correta", async () => {
  await mount("/dashboard?store=demo&tab=expenses", <Dashboard />);
  expect(
    await screen.findByRole("button", { name: "Registrar despesa", exact: true }),
  ).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Despesas" })).toHaveAttribute("aria-selected", "true");
  expect(
    within(screen.getByRole("navigation", { name: "Navegação do painel" })).queryByRole("button", {
      name: "Despesas",
    }),
  ).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("tab", { name: "Recebimentos" }));
  expect(await screen.findByText("Recebimentos da operação")).toBeInTheDocument();
});
it("OPS-05 módulo Frete salva taxa única decimal e permite entrega sem áreas", async () => {
  const f = await mount("/dashboard?store=demo&tab=shipping", <Dashboard />);
  await userEvent.click(await screen.findByLabelText(/Valor único/));
  const input = screen.getByLabelText(/^Taxa única/);
  await userEvent.clear(input);
  await userEvent.type(input, "7,50");
  await userEvent.click(screen.getByRole("button", { name: "Salvar frete", exact: true }));
  await waitFor(() =>
    expect(f.repo.getSnapshot().tenants[company.id].settings.shipping.fixedFeeCents).toBe(750),
  );
  expect(f.repo.getSnapshot().tenants[company.id].settings.shipping.mode).toBe("fixed");
});
it("OPS-06 checkout exige cotação, invalida ao mudar CEP e mantém retirada sem taxa", async () => {
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
  const onQuoteShipping = vi.fn(async (cep) => ({
    postalCode: cep,
    token: "signed-token",
    feeCents: 642,
    distanceMeters: 3210,
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    ruleKey: shippingRuleKey(tenant.settings),
    address: { street: "Rua de teste", neighborhood: "Centro", city: "Cidade", state: "SP" },
  }));
  render(
    <Checkout
      tenant={tenant}
      availability={{ open: true }}
      onQuantity={vi.fn()}
      onSubmit={vi.fn()}
      onQuoteShipping={onQuoteShipping}
    />,
  );
  const submit = screen.getByRole("button", { name: /Confirmar pedido local/ });
  expect(submit).toBeDisabled();
  await userEvent.type(screen.getByLabelText("CEP de entrega"), "01310100");
  await userEvent.click(screen.getByRole("button", { name: "Calcular frete pelo CEP" }));
  await waitFor(() => expect(submit).toBeEnabled());
  expect(screen.getByText(/3,21 km pelas ruas/)).toBeInTheDocument();
  await userEvent.clear(screen.getByLabelText("CEP de entrega"));
  expect(submit).toBeDisabled();
  await userEvent.click(screen.getByLabelText("Retirada"));
  expect(submit).toBeEnabled();
});
