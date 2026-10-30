// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ApplicationProvider from "../src/components/ApplicationProvider";
import TrialSignup from "../src/pages/TrialSignup";
import Landing from "../src/pages/Landing";
import Dashboard from "../src/pages/Dashboard";
import { createMemoryRepository } from "../src/adapters/memoryRepository.ts";
import { createLocalAuth } from "../src/adapters/localAuth.ts";
import { createServices } from "../src/application/services.ts";
import { newTrial } from "../src/core/trials.ts";
import { fixture, initial, storage, trialInput, company } from "./fixtures.ts";
afterEach(cleanup);

it("TRIAL-UI-01 landing inicia cadastro, cria loja de tipo escolhido e abre a configuração existente", async () => {
  const repository = createMemoryRepository(initial()),
    auth = createLocalAuth(repository, storage());
  await auth.ready;
  render(
    <ApplicationProvider runtime={{ repository, auth, services: createServices(repository, auth) }}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/cadastro" element={<TrialSignup />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    </ApplicationProvider>,
  );
  await userEvent.click(await screen.findByRole("link", { name: "Começar meus 7 dias" }));
  expect(screen.getByText(/Demonstração local: esta conta/)).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText("Seu nome"), trialInput.name);
  await userEvent.type(screen.getByLabelText("E-mail"), trialInput.email);
  await userEvent.type(screen.getByLabelText(/^Crie sua senha/), trialInput.password);
  await userEvent.type(screen.getByLabelText("Confirme a senha"), trialInput.password);
  await userEvent.click(screen.getByRole("button", { name: "Continuar", exact: true }));
  await userEvent.type(screen.getByLabelText("Nome da loja"), trialInput.storeName);
  await userEvent.selectOptions(screen.getByLabelText(/Tipo de estabelecimento/), "pastel");
  expect(screen.getByLabelText(/Endereço da loja/)).toHaveValue(trialInput.slug);
  await userEvent.clear(screen.getByLabelText("Cor da marca em hexadecimal"));
  await userEvent.type(
    screen.getByLabelText("Cor da marca em hexadecimal"),
    trialInput.primaryColor,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Criar conta e configurar minha loja" }),
  );
  // Real PBKDF2 can exceed Testing Library's 1s default when the full suite shares the CPU.
  expect(
    await screen.findByRole("heading", { name: "Tudo do seu jeito." }, { timeout: 5000 }),
  ).toBeInTheDocument();
  expect(screen.getByText("Sua loja está pronta para começar.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Salvar configuração/ })).toBeInTheDocument();
  const owner = auth.current(),
    tenant = repository.getSnapshot().tenants[owner.storeId];
  expect(owner.role).toBe("owner");
  expect(tenant.settings.heroSegment).toBe("pastel");
  expect(tenant.settings.description).toBe("");
  expect(repository.getSnapshot().companies.find((c) => c.id === owner.storeId)?.primaryColor).toBe(
    trialInput.primaryColor,
  );
  expect(tenant.products).toEqual([]);
  expect(tenant.orders).toEqual([]);
  expect(tenant.online).toBe(false);
});

it("TRIAL-UI-02 teste expirado exibe planos e preservação dos dados sem liberar gestão", async () => {
  const f = await fixture();
  await f.repo.transact((s) => {
    s.companies[0].trial = newTrial(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000));
  });
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter initialEntries={["/dashboard?store=demo&tab=menu"]}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    </ApplicationProvider>,
  );
  expect(
    await screen.findByRole("heading", { name: "Seus 7 dias de teste terminaram." }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Conhecer os planos/ })).toHaveAttribute(
    "href",
    "/#planos",
  );
  expect(screen.queryByRole("button", { name: /Novo produto/ })).not.toBeInTheDocument();
  expect(f.repo.getSnapshot().tenants[company.id].products).toHaveLength(1);
  expect(
    within(screen.getByRole("main")).queryByRole("button", { name: /Salvar configuração/ }),
  ).not.toBeInTheDocument();
});
