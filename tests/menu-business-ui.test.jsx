// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { webcrypto } from "node:crypto";
import ApplicationProvider from "../src/components/ApplicationProvider";
import DigitalMenu from "../src/pages/DigitalMenu";
import MenuQrPanel from "../src/components/MenuQrPanel";
import Dashboard from "../src/pages/Dashboard";
import Checkout from "../src/components/Checkout";
import ExpensePanel from "../src/components/ExpensePanel";
import BusinessOverview from "../src/components/BusinessOverview";
import CouponOffers from "../src/components/CouponOffers";
import { fixture, company, product, cartLine, checkout } from "./fixtures.ts";
import { menuUrl } from "../src/lib/menu";
vi.stubGlobal("crypto", webcrypto);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
async function appRuntime(role = "owner") {
  const f = await fixture(role);
  return { ...f, repository: f.repo };
}
it.each(["Hamburguer", "Porção", "Bebida", "Sobremesa"])(
  "MENU-01 %s: presencial funciona com delivery fechado e exibe recorte sem sacola",
  async (category) => {
    const app = await appRuntime();
    await app.services.setOnline(company.id, false);
    await app.services.saveProduct(company.id, {
      ...product,
      category,
      cutoutImage: "/burger-da-loja.png",
    });
    await app.services.saveProduct(company.id, {
      ...product,
      id: "hidden",
      name: "Oculto",
      status: "Indisponível",
    });
    const beforeBrowsing = JSON.stringify(app.repo.getSnapshot());
    render(
      <ApplicationProvider runtime={app}>
        <MemoryRouter initialEntries={["/menu/demo"]}>
          <Routes>
            <Route path="/menu/:storeId" element={<DigitalMenu />} />
          </Routes>
        </MemoryRouter>
      </ApplicationProvider>,
    );
    expect(await screen.findByRole("heading", { name: "O cardápio da casa." })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /sacola|adicionar|finalizar|comprar/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Oculto")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ver detalhes de Nome oficial" }));
    expect(
      within(screen.getByRole("dialog")).getByRole("img", { name: "Foto de Nome oficial" }),
    ).toHaveAttribute("src", "/burger-da-loja.png");
    expect(screen.getByText("Adicionais disponíveis")).toBeInTheDocument();
    expect(screen.getByText("Queijo")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /adicionar|finalizar|comprar|sacola/i }),
    ).not.toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).queryByRole("checkbox")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Continuar escolhendo" }));
    await userEvent.type(screen.getByLabelText("Buscar no cardápio presencial"), "INEXISTENTE");
    expect(screen.getByText("Não encontramos esse sabor.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ver todas as opções" }));
    expect(
      screen.getByRole("button", { name: "Ver detalhes de Nome oficial" }),
    ).toBeInTheDocument();
    expect(JSON.stringify(app.repo.getSnapshot())).toBe(beforeBrowsing);
  },
);
it("MENU-02 loja inexistente não mostra o catálogo de outro estabelecimento", async () => {
  const app = await appRuntime();
  render(
    <ApplicationProvider runtime={app}>
      <MemoryRouter initialEntries={["/menu/outra"]}>
        <Routes>
          <Route path="/menu/:storeId" element={<DigitalMenu />} />
        </Routes>
      </MemoryRouter>
    </ApplicationProvider>,
  );
  expect(await screen.findByText("Cardápio não encontrado.")).toBeInTheDocument();
  expect(screen.queryByText("Nome oficial")).not.toBeInTheDocument();
});
it("QR-01 link e QR pertencem à loja e exportação SVG cria arquivo vetorial", async () => {
  vi.stubEnv("VITE_PUBLIC_MENU_ORIGIN", "https://cardapio.example.com");
  const blobs = [],
    downloaded = [];
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn((blob) => {
      blobs.push(blob);
      return "blob:test";
    }),
  });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
    downloaded.push(this.download);
  });
  render(
    <MemoryRouter>
      <MenuQrPanel company={{ ...company, slug: "outra-loja" }} />
    </MemoryRouter>,
  );
  expect(screen.getByLabelText("Link do cardápio presencial")).toHaveValue(
    "https://cardapio.example.com/menu/outra-loja",
  );
  expect(
    within(screen.getByLabelText("Link do cardápio presencial").closest("section"))
      .getByTitle("QR code do cardápio de Loja de teste")
      .closest("svg")
      .querySelectorAll("path").length,
  ).toBeGreaterThan(0);
  await userEvent.click(screen.getByRole("button", { name: "SVG", exact: true }));
  await waitFor(() => expect(downloaded).toEqual(["cardapio-outra-loja.svg"]));
  expect(blobs[0].type).toContain("image/svg+xml");
  expect(blobs[0].size).toBeGreaterThan(500);
  expect(() => menuUrl("javascript:alert(1)", "demo")).toThrow();
});
it("QR-02 prévia local informa limite de acesso e permite pedir impressão da placa", async () => {
  vi.stubEnv("VITE_PUBLIC_MENU_ORIGIN", "http://localhost:5174");
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  render(
    <MemoryRouter>
      <MenuQrPanel company={company} />
    </MemoryRouter>,
  );
  expect(screen.getByText(/não abre no celular de um cliente/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Imprimir placa" }));
  expect(print).toHaveBeenCalledOnce();
});
it("COUPON-UI-01 gestor cadastra oferta, cliente a aplica e checkout envia total com desconto", async () => {
  const app = await appRuntime();
  const view = render(
    <ApplicationProvider runtime={app}>
      <MemoryRouter initialEntries={["/dashboard?store=demo&tab=coupons"]}>
        <Dashboard />
      </MemoryRouter>
    </ApplicationProvider>,
  );
  await userEvent.click(await screen.findByRole("button", { name: "Novo cupom" }));
  await userEvent.type(screen.getByLabelText(/^Código do cupom/), "BRASA10");
  await userEvent.click(screen.getByLabelText("Divulgar na vitrine de delivery"));
  await userEvent.click(screen.getByRole("button", { name: "Salvar cupom" }));
  await waitFor(() => expect(app.repo.getSnapshot().tenants[company.id].coupons).toHaveLength(1));
  view.unmount();
  await app.services.addToCart(company.id, cartLine);
  const tenant = app.repo.getSnapshot().tenants[company.id],
    submit = vi.fn();
  render(
    <>
      <CouponOffers tenant={tenant} now={new Date()} />
      <Checkout
        tenant={tenant}
        availability={{ open: true, reason: "" }}
        onSubmit={submit}
        onQuantity={vi.fn()}
        busy={false}
        error=""
      />
    </>,
  );
  expect(screen.getByRole("button", { name: "Copiar BRASA10" })).toBeInTheDocument();
  await userEvent.click(screen.getByLabelText("Retirada"));
  await userEvent.type(screen.getByLabelText(/^Como podemos chamar/), "Cliente de teste");
  await userEvent.type(screen.getByLabelText(/^Telefone com DDD/), "71999999999");
  await userEvent.type(screen.getByLabelText("Cupom de desconto"), "brasa10");
  await userEvent.click(screen.getByRole("button", { name: "Aplicar cupom" }));
  expect(await screen.findByText(/BRASA10 aplicado/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Confirmar pedido local/ }));
  await waitFor(() =>
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ couponCode: "BRASA10", expectedTotalCents: 6102 }),
    ),
  );
});
it("EXPENSE-UI-01 lançamento pela tela atualiza despesa e arquivo pode ser restaurado", async () => {
  const app = await appRuntime();
  function View() {
    const [tenant, setTenant] = React.useState(app.repo.getSnapshot().tenants[company.id]);
    React.useEffect(
      () => app.repo.subscribe(() => setTenant(app.repo.getSnapshot().tenants[company.id])),
      [],
    );
    return (
      <ExpensePanel company={company} tenant={tenant} services={app.services} now={new Date()} />
    );
  }
  render(<View />);
  await userEvent.click(screen.getByRole("button", { name: "Registrar despesa" }));
  await userEvent.type(screen.getByLabelText("Descrição da despesa"), "Compra de pães");
  const amount = screen.getByLabelText("Valor pago (R$)");
  await userEvent.clear(amount);
  await userEvent.type(amount, "12,90");
  await userEvent.click(screen.getByRole("button", { name: "Salvar despesa" }));
  expect(await screen.findByText("Compra de pães")).toBeInTheDocument();
  expect(app.repo.getSnapshot().tenants[company.id].expenses[0].amountCents).toBe(1290);
  await userEvent.click(screen.getByRole("button", { name: "Arquivar despesa Compra de pães" }));
  await waitFor(() => expect(screen.queryByText("Compra de pães")).not.toBeInTheDocument());
  await userEvent.click(screen.getByLabelText("Mostrar arquivadas"));
  await userEvent.click(screen.getByRole("button", { name: "Restaurar despesa Compra de pães" }));
  await waitFor(() =>
    expect(app.repo.getSnapshot().tenants[company.id].expenses[0].voided).toBe(false),
  );
});
it("BUSINESS-UI-01 visão geral exibe receita real, ticket, rankings e histórico", async () => {
  const app = await appRuntime();
  await app.services.addToCart(company.id, cartLine);
  const order = await app.services.checkout(
    company.id,
    app.repo.getSnapshot().tenants[company.id].cart.requestId,
    checkout,
  );
  await app.services.changePayment(company.id, order.id, "Pago");
  render(
    <BusinessOverview
      company={company}
      tenant={app.repo.getSnapshot().tenants[company.id]}
      now={new Date()}
      onExpenses={vi.fn()}
      onCatalog={vi.fn()}
    />,
  );
  expect(
    within(screen.getByText("Receita do mês").closest("article")).getByText(/72,80/),
  ).toBeInTheDocument();
  expect(screen.getByText("Custos incompletos")).toBeInTheDocument();
  expect(screen.getByText("Comparação de faturamento mensal")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /saldo R\$/ })).toHaveLength(7);
  expect(screen.getByText("Produto mais vendido")).toBeInTheDocument();
});
