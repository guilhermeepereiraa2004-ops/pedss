// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import ApplicationProvider from "../src/components/ApplicationProvider";
import Dashboard from "../src/pages/Dashboard";
import { company, fixture } from "./fixtures.ts";
import { DomainError } from "../src/core/errors.ts";
afterEach(cleanup);
const mount = (f) =>
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter initialEntries={["/dashboard?store=demo"]}>
        <Dashboard />
      </MemoryRouter>
    </ApplicationProvider>,
  );
it("OPEN-UI-01 tentativa bloqueada explica, leva ao Frete, salva e abre sem recarregar", async () => {
  const f = await fixture();
  await f.repo.transact((state) => {
    const tenant = state.tenants[company.id];
    tenant.online = false;
    tenant.settings.pickupEnabled = false;
    tenant.settings.areas = [];
  });
  const toggle = vi.spyOn(f.services, "setOnline");
  mount(f);
  await userEvent.click(await screen.findByRole("button", { name: "Abrir loja" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog).toHaveTextContent("Ainda não é possível abrir a loja");
  expect(dialog).toHaveTextContent("não há áreas de entrega salvas");
  expect(toggle).not.toHaveBeenCalled();
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Configurar frete e retirada" }),
  );
  expect(await screen.findByText("O atendimento ainda não está configurado.")).toBeInTheDocument();
  expect(
    screen.getByText(/Os valores sugeridos abaixo só passam a valer depois de salvar/),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Salvar frete" }));
  await screen.findByText("Frete e atendimento salvos.");
  expect(f.repo.getSnapshot().tenants[company.id].settings.shipping.mode).toBe("fixed");
  await userEvent.click(screen.getByRole("button", { name: "Visão geral", exact: true }));
  expect(screen.queryByText("Falta configurar o atendimento")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Abrir loja" }));
  expect(await screen.findByRole("button", { name: "Loja aberta" })).toBeInTheDocument();
  expect(f.repo.getSnapshot().tenants[company.id].online).toBe(true);
});
it("OPEN-UI-02 erro ao salvar permanece visível e não apresenta loja aberta", async () => {
  const f = await fixture();
  await f.services.setOnline(company.id, false);
  vi.spyOn(f.services, "setOnline").mockRejectedValue(
    new DomainError("A central pausou este estabelecimento."),
  );
  mount(f);
  await userEvent.click(await screen.findByRole("button", { name: "Abrir loja" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "A central pausou este estabelecimento.",
  );
  expect(screen.queryByRole("button", { name: "Loja aberta" })).not.toBeInTheDocument();
  expect(f.repo.getSnapshot().tenants[company.id].online).toBe(false);
});
it("OPEN-UI-03 status programado não fecha atendimento silenciosamente ao clicar", async () => {
  const f = await fixture();
  await f.repo.transact((state) => {
    const settings = state.tenants[company.id].settings;
    settings.scheduleEnabled = true;
    settings.hours.forEach((hour) => (hour.enabled = false));
  });
  mount(f);
  await userEvent.click(await screen.findByRole("button", { name: "Atendimento programado" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog).toHaveTextContent("não abre a loja fora do horário");
  expect(f.repo.getSnapshot().tenants[company.id].online).toBe(true);
  await userEvent.click(within(dialog).getByRole("button", { name: "Revisar horários" }));
  expect(await screen.findByText("Horários — America/Bahia")).toBeInTheDocument();
});
