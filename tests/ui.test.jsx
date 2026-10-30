// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ApplicationProvider from "../src/components/ApplicationProvider";
import Dashboard from "../src/pages/Dashboard";
import Storefront from "../src/pages/Storefront";
import Checkout from "../src/components/Checkout";
import FoodImage from "../src/components/FoodImage";
import App from "../src/App";
import * as runtimeModule from "../src/application/runtime";
import MoneyInput from "../src/components/MoneyInput";
import Tracking from "../src/pages/Tracking";
import SettingsEditor from "../src/components/SettingsEditor";
import SuperAdmin from "../src/pages/SuperAdmin";
import { fixture, company, product, cartLine, checkout } from "./fixtures.ts";
import { webcrypto } from "node:crypto";
vi.stubGlobal("crypto", webcrypto);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
async function runtime(role = "owner") {
  const f = await fixture(role);
  return { ...f, repository: f.repo };
}
describe("interfaces da operação", () => {
  it("UI-TYPE-01 central exige tipo, cria com modelo correto e mantém escolha ao editar", async () => {
    const app = await runtime("admin");
    const view = render(
      <ApplicationProvider runtime={app}>
        <MemoryRouter>
          <SuperAdmin />
        </MemoryRouter>
      </ApplicationProvider>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Novo estabelecimento" }));
    await userEvent.type(screen.getByLabelText("Nome do estabelecimento"), "Sorveteria Aurora");
    await userEvent.type(screen.getByLabelText("E-mail de contato"), "aurora@example.com");
    const type = screen.getByRole("combobox", { name: "Tipo de estabelecimento" });
    expect(type).toBeRequired();
    expect(type).toHaveValue("");
    await userEvent.click(screen.getByRole("button", { name: "Salvar estabelecimento" }));
    expect(app.repo.getSnapshot().companies).toHaveLength(1);
    await userEvent.selectOptions(type, "icecream");
    expect(screen.getByRole("img", { name: "Modelo de sorveteria" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Salvar estabelecimento" }));
    await waitFor(() => expect(app.repo.getSnapshot().companies).toHaveLength(2));
    const created = app.repo.getSnapshot().companies.find((c) => c.name === "Sorveteria Aurora");
    expect(app.repo.getSnapshot().tenants[created.id].settings.heroSegment).toBe("icecream");
    expect(screen.getByRole("row", { name: /Sorveteria Aurora/ })).toHaveTextContent("Sorveteria");
    await userEvent.click(screen.getByRole("button", { name: "Editar Sorveteria Aurora" }));
    expect(screen.getByRole("combobox", { name: "Tipo de estabelecimento" })).toHaveValue(
      "icecream",
    );
    await userEvent.click(screen.getByRole("button", { name: "Salvar estabelecimento" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    view.unmount();
    render(
      <ApplicationProvider runtime={app}>
        <MemoryRouter>
          <Storefront manualStoreId={created.slug} />
        </MemoryRouter>
      </ApplicationProvider>,
    );
    expect(await screen.findByRole("heading", { name: "Deu calor?" })).toBeInTheDocument();
  });
  it("UI-07 aplicação completa abre em StrictMode mesmo se scrollTo retornar Promise", async () => {
    const app = await runtime("admin");
    vi.spyOn(runtimeModule, "getRuntime").mockReturnValue(app);
    vi.spyOn(window, "scrollTo").mockImplementation(() => Promise.resolve());
    render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: /Seu negócio/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Vamos retomar daqui.")).not.toBeInTheDocument();
  });
  it("UI-08 moeda aceita vírgula e preserva centavos durante edição", async () => {
    const changed = vi.fn();
    render(<MoneyInput aria-label="Preço de teste" cents={500} onChange={changed} />);
    const input = screen.getByLabelText("Preço de teste");
    await userEvent.clear(input);
    await userEvent.type(input, "12,90");
    expect(input).toHaveValue("12,90");
    expect(changed).toHaveBeenLastCalledWith(1290);
  });
  it("UI-09 configuração salva identidade e WhatsApp sem editar o frete", async () => {
    const app = await runtime();
    const saved = vi.fn();
    const settings = app.repo.getSnapshot().tenants[company.id].settings;
    render(
      <SettingsEditor company={company} settings={settings} onSave={saved} busy={false} error="" />,
    );
    const name = screen.getByLabelText("Nome da loja");
    await userEvent.clear(name);
    await userEvent.type(name, "Nova Marca");
    await userEvent.type(screen.getByLabelText(/^WhatsApp da loja/), "55 71 99999-9999");
    expect(screen.queryByLabelText("Taxa (R$)")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Salvar configuração" }));
    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        whatsapp: "5571999999999",
        areas: settings.areas,
      }),
      expect.objectContaining({ name: "Nova Marca" }),
    );
  });
  it("UI-10 acompanhamento mostra somente o pedido do token e reage ao painel", async () => {
    const app = await runtime();
    await app.services.addToCart(company.id, cartLine);
    const order = await app.services.checkout(
      company.id,
      app.repo.getSnapshot().tenants[company.id].cart.requestId,
      checkout,
    );
    render(
      <ApplicationProvider runtime={app}>
        <MemoryRouter initialEntries={["/pedido/" + order.trackingToken]}>
          <Routes>
            <Route path="/pedido/:token" element={<Tracking />} />
          </Routes>
        </MemoryRouter>
      </ApplicationProvider>,
    );
    expect(
      await screen.findByRole("heading", { name: "Já está no painel da loja." }),
    ).toBeInTheDocument();
    await app.services.changeOrder(company.id, order.id, "Aceito");
    expect(
      await screen.findByRole("heading", { name: "Seu pedido está andando." }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aceitar pedido" })).not.toBeInTheDocument();
  });
  it("UI-01 logo cadastrado é usado na loja e sacola permite personalizar", async () => {
    const app = await runtime("admin");
    await app.services.saveCompany({ ...company, logo: "https://example.com/logo.png" });
    render(
      <ApplicationProvider runtime={app}>
        <MemoryRouter initialEntries={["/store/demo"]}>
          <Routes>
            <Route path="/store/:storeId" element={<Storefront />} />
          </Routes>
        </MemoryRouter>
      </ApplicationProvider>,
    );
    expect(await screen.findByAltText("Logo de Loja de teste")).toHaveAttribute(
      "src",
      "https://example.com/logo.png",
    );
    await userEvent.click(screen.getByRole("button", { name: "Escolher Nome oficial" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Queijo")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: /^Sem Cebola/ }));
    await userEvent.click(screen.getByRole("button", { name: /Adicionar ·/ }));
    await waitFor(() =>
      expect(app.repo.getSnapshot().tenants[company.id].cart.lines).toHaveLength(1),
    );
    expect(app.repo.getSnapshot().tenants[company.id].cart.lines[0].removedIngredients).toEqual([
      "Cebola",
    ]);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Abrir sacola com 1 item/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Meu pedido 1/ }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Nome oficial");
    expect(app.repo.getSnapshot().tenants[company.id].cart.lines).toHaveLength(1);
  });
  it("UI-02 corrigir foto inválida remove fallback sem recarregar", () => {
    const { rerender } = render(
      <FoodImage product={{ ...product, image: "https://example.com/bad.png" }} />,
    );
    fireEvent.error(screen.getByAltText("Nome oficial"));
    expect(screen.queryByAltText("Nome oficial")).not.toBeInTheDocument();
    rerender(<FoodImage product={{ ...product, image: "https://example.com/good.png" }} />);
    expect(screen.getByAltText("Nome oficial")).toHaveAttribute(
      "src",
      "https://example.com/good.png",
    );
  });
  it("UI-03 atendente não recebe controles de catálogo, equipe ou financeiro", async () => {
    const app = await runtime("attendant");
    render(
      <ApplicationProvider runtime={app}>
        <MemoryRouter initialEntries={["/dashboard?store=demo"]}>
          <Dashboard />
        </MemoryRouter>
      </ApplicationProvider>,
    );
    await screen.findByText("Bom movimento por aqui.");
    expect(
      screen.queryByRole("button", { name: "Financeiro", exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Configurações", exact: true }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Novo produto" })).not.toBeInTheDocument();
  });
  it("UI-04 pausa pela central aparece no painel e bloqueia reabertura", async () => {
    const app = await runtime("admin");
    await app.services.saveCompany({ ...company, status: "Pausado" });
    render(
      <ApplicationProvider runtime={app}>
        <MemoryRouter initialEntries={["/dashboard?store=demo"]}>
          <Dashboard />
        </MemoryRouter>
      </ApplicationProvider>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Pausada pela central" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "A central precisa reativar o estabelecimento",
    );
    expect(app.repo.getSnapshot().companies[0].status).toBe("Pausado");
  });
  it("UI-05 checkout informa validação e retirada altera taxa e endereço", async () => {
    const app = await runtime();
    await app.services.addToCart(company.id, cartLine);
    const tenant = app.repo.getSnapshot().tenants[company.id];
    const onSubmit = vi.fn();
    render(
      <Checkout
        tenant={tenant}
        availability={{ open: true, reason: "" }}
        onQuantity={vi.fn()}
        onSubmit={onSubmit}
        busy={false}
        error=""
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Confirmar pedido local/ }));
    expect(await screen.findByText("Informe seu nome.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.click(screen.getByLabelText("Retirada"));
    expect(screen.getByText(/Balcão da loja/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^Como podemos chamar você/), "Cliente Fictício");
    await userEvent.type(screen.getByLabelText(/^Telefone com DDD/), "71 99999-9999");
    await userEvent.click(screen.getByRole("button", { name: /Confirmar pedido local/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      fulfillment: "pickup",
      phone: "71999999999",
      expectedTotalCents: 6780,
    });
  });
  it("UI-06 usuário muda status e pagamento pelos detalhes do pedido", async () => {
    const app = await runtime();
    await app.services.addToCart(company.id, cartLine);
    await app.services.checkout(
      company.id,
      app.repo.getSnapshot().tenants[company.id].cart.requestId,
      checkout,
    );
    render(
      <ApplicationProvider runtime={app}>
        <MemoryRouter initialEntries={["/dashboard?store=demo&tab=orders"]}>
          <Dashboard />
        </MemoryRouter>
      </ApplicationProvider>,
    );
    await userEvent.click(await screen.findByRole("button", { name: /Detalhes do pedido/ }));
    await userEvent.click(screen.getByRole("button", { name: "Aceitar pedido" }));
    await waitFor(() =>
      expect(app.repo.getSnapshot().tenants[company.id].orders[0].status).toBe("Aceito"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Registrar recebimento" }));
    await waitFor(() =>
      expect(app.repo.getSnapshot().tenants[company.id].orders[0].paymentStatus).toBe("Pago"),
    );
    expect(screen.getByText("Histórico do pedido")).toBeInTheDocument();
  });
});
