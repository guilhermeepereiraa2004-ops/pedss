// @vitest-environment jsdom
import React from "react";
import { afterEach, it, expect, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import ApplicationProvider from "../src/components/ApplicationProvider";
import Dashboard from "../src/pages/Dashboard";
import CatalogImport from "../src/components/CatalogImport";
import * as transfer from "../src/application/catalogTransfer";
import { PRODUCT_COLUMNS } from "../src/core/catalogImport.ts";
import { fixture, company, product } from "./fixtures.ts";
import { DomainError } from "../src/core/errors.ts";
const doc = (price = 25) => ({
  sheets: [
    {
      name: "Produtos",
      rows: [
        { line: 1, cells: PRODUCT_COLUMNS },
        { line: 2, cells: ["NOVO", "Novo sabor", "Hamburguer", price] },
      ],
    },
  ],
  issues: [],
});
const file = () =>
  new File(["test"], "cardapio.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("UI-EXPORT-01 exporta a loja inteira com busca ativa e informa falha para tentar novamente", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, {
    ...product,
    id: "other",
    name: "Outro produto",
    sku: "OUTRO",
  });
  const app = { ...f, repository: f.repo };
  const download = vi
    .spyOn(transfer, "downloadCurrentCatalog")
    .mockRejectedValueOnce(new DomainError("Falha ao exportar. Tente novamente."))
    .mockResolvedValueOnce({ parts: 1, codesAssigned: 0 });
  render(
    <ApplicationProvider runtime={app}>
      <MemoryRouter initialEntries={["/dashboard?store=demo&tab=menu"]}>
        <Dashboard />
      </MemoryRouter>
    </ApplicationProvider>,
  );
  const button = await screen.findByRole("button", { name: "Exportar cardápio" });
  await userEvent.type(screen.getByLabelText("Buscar produto"), product.name);
  expect(screen.queryByRole("heading", { name: "Outro produto" })).not.toBeInTheDocument();
  await userEvent.click(button);
  expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao exportar");
  await userEvent.click(button);
  await waitFor(() => expect(download).toHaveBeenCalledTimes(2));
  expect(download).toHaveBeenLastCalledWith(f.services, company.id, expect.any(AbortSignal));
  expect(f.repo.getSnapshot().tenants[company.id].products).toHaveLength(2);
  expect(await screen.findByText(/Cardápio exportado. Mantenha os códigos/)).toBeInTheDocument();
});
it("UI-IMPORT-01 painel oferece modelo e importa somente após revisar e confirmar", async () => {
  const f = await fixture();
  const app = { ...f, repository: f.repo };
  vi.spyOn(transfer, "readCatalogFile").mockResolvedValue(doc());
  render(
    <ApplicationProvider runtime={app}>
      <MemoryRouter initialEntries={["/dashboard?store=demo&tab=menu"]}>
        <Dashboard />
      </MemoryRouter>
    </ApplicationProvider>,
  );
  expect(await screen.findByRole("link", { name: "Baixar modelo" })).toHaveAttribute(
    "href",
    transfer.CATALOG_TEMPLATE_URL,
  );
  await userEvent.click(screen.getByRole("button", { name: "Importar planilha" }));
  expect(screen.getByRole("link", { name: "Baixar planilha modelo" })).toHaveAttribute(
    "download",
    "modelo-cardapio-pedss.xlsx",
  );
  await userEvent.upload(screen.getByLabelText("Selecionar planilha de cardápio"), file());
  expect(await screen.findByRole("region", { name: "Prévia da importação" })).toBeInTheDocument();
  const confirm = screen.getByRole("button", { name: "Confirmar importação de 1 produtos" });
  expect(confirm).toBeDisabled();
  expect(f.repo.getSnapshot().tenants[company.id].products).toHaveLength(1);
  await userEvent.click(screen.getByLabelText("Revisei a prévia e quero importar estes produtos."));
  await userEvent.click(confirm);
  await waitFor(() => expect(f.repo.getSnapshot().tenants[company.id].products).toHaveLength(2));
  expect(await screen.findByText("Novo sabor")).toBeInTheDocument();
});
it("UI-IMPORT-02 erros por linha bloqueiam todo o lote sem chamar a gravação", async () => {
  vi.spyOn(transfer, "readCatalogFile").mockResolvedValue(doc(-5));
  const save = vi.fn();
  render(<CatalogImport products={[product]} onImport={save} onImported={vi.fn()} />);
  await userEvent.upload(screen.getByLabelText("Selecionar planilha de cardápio"), file());
  expect(await screen.findByText(/O preço deve ser maior que zero/)).toBeInTheDocument();
  expect(screen.getAllByText(/Produtos · linha 2/).length).toBeGreaterThan(0);
  expect(screen.getByLabelText("Revisei a prévia e quero importar estes produtos.")).toBeDisabled();
  expect(screen.getByRole("button", { name: /Confirmar importação/ })).toBeDisabled();
  expect(save).not.toHaveBeenCalled();
});
it("UI-IMPORT-03 atualização exige opção explícita e mudança de catálogo exige nova prévia", async () => {
  const existing = { ...product, sku: "NOVO" };
  const save = vi.fn();
  vi.spyOn(transfer, "readCatalogFile").mockResolvedValue(doc());
  const { rerender } = render(
    <CatalogImport products={[existing]} onImport={save} onImported={vi.fn()} />,
  );
  await userEvent.upload(screen.getByLabelText("Selecionar planilha de cardápio"), file());
  expect(await screen.findByText(/Produto já cadastrado/)).toBeInTheDocument();
  await userEvent.click(screen.getByLabelText("Atualizar produtos existentes com o mesmo código"));
  await userEvent.click(screen.getByLabelText("Revisei a prévia e quero importar estes produtos."));
  expect(screen.getByRole("button", { name: /Confirmar importação/ })).toBeEnabled();
  rerender(
    <CatalogImport
      products={[{ ...existing, priceCents: 5000 }]}
      onImport={save}
      onImported={vi.fn()}
    />,
  );
  expect(screen.getByText(/O cardápio mudou desde/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Confirmar importação/ })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Atualizar prévia" }));
  expect(
    screen.getByLabelText("Revisei a prévia e quero importar estes produtos."),
  ).not.toBeChecked();
  expect(save).not.toHaveBeenCalled();
});
