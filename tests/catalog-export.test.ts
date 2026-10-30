import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import { fixture, company, product, cartLine, checkout } from "./fixtures.ts";
import {
  prepareCatalogExport,
  catalogExportBatches,
  catalogExportRows,
} from "../src/core/catalogExport.ts";
import { catalogFingerprint, planCatalogImport, KEEP_IMAGE } from "../src/core/catalogImport.ts";
import { readCatalogBuffer, loadCatalogWorkbook } from "../src/adapters/catalogWorkbook.js";
import { writeCatalogExport } from "../src/adapters/catalogExportWorkbook.js";

async function template() {
  const bytes = await readFile("public/templates/modelo-cardapio-brasa.xlsx");
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
const snapshot = (products) => ({ products, storeName: "Loja de teste", storeSlug: "teste" });
describe("exportação de cardápio", () => {
  it("CUTOUT-02 preserva fotos em planilhas antigas e permite trocar/remover somente a foto sem fundo", () => {
    const current = {
      ...product,
      sku: "BURGER-1",
      image: "/capa.jpg",
      cutoutImage: "/recorte.png",
      model3dUrl: "https://example.com/burger.glb",
    };
    const rows = catalogExportRows([current]);
    const doc = {
      sheets: [
        {
          name: "Produtos",
          rows: rows.products.map((cells, i) => ({ line: i + 1, cells: cells.slice(0, 10) })),
        },
      ],
      issues: [],
    };
    expect(planCatalogImport(doc, [current], true).entries[0].product).toEqual(current);
    doc.sheets[0].rows[0].cells.push("Foto sem fundo (URL)");
    doc.sheets[0].rows[1].cells.push("/outra.png");
    expect(planCatalogImport(doc, [current], true).entries[0].product).toMatchObject({
      image: "/capa.jpg",
      cutoutImage: "/outra.png",
    });
    doc.sheets[0].rows[1].cells[10] = null;
    expect(planCatalogImport(doc, [current], true).entries[0].product.cutoutImage).toBe("");
    doc.sheets[0].rows[1].cells[10] = "javascript:alert(1)";
    expect(planCatalogImport(doc, [current], true).issues).toContainEqual(
      expect.objectContaining({ column: "Foto sem fundo (URL)" }),
    );
  });
  it("EXPORT-06 bloqueia duas linhas que tentam atualizar o mesmo produto legado", () => {
    const rows = catalogExportRows([
      { ...product, sku: "A" },
      { ...product, sku: "B" },
    ]);
    const document = {
      sheets: [
        {
          name: "Produtos",
          rows: rows.products.map((cells, index) => ({ line: index + 1, cells })),
        },
      ],
      issues: [],
    };
    const plan = planCatalogImport(document, [product], true);
    expect(plan.issues).toContainEqual(
      expect.objectContaining({
        line: 3,
        message: expect.stringMatching(/Duas linhas correspondem/),
      }),
    );
  });
  it("EXPORT-01 atribui códigos persistentes sem alterar IDs, pedidos ou dados de outra loja", async () => {
    const f = await fixture();
    await f.services.addToCart(company.id, cartLine);
    await f.services.checkout(
      company.id,
      f.repo.getSnapshot().tenants[company.id].cart.requestId,
      checkout,
    );
    await f.repo.transact((state) => {
      state.companies.push({ ...company, id: "outra", slug: "outra" });
      state.tenants.outra = structuredClone(state.tenants[company.id]);
    });
    const before = structuredClone(f.repo.getSnapshot());
    const first = await f.services.exportCatalog(company.id);
    expect(first.codesAssigned).toBe(1);
    expect(first.products[0].sku).toMatch(/^P-[A-F0-9-]+$/);
    expect(first.products[0]).toEqual({ ...product, sku: first.products[0].sku });
    expect(f.repo.getSnapshot().tenants[company.id].orders).toEqual(
      before.tenants[company.id].orders,
    );
    expect(f.repo.getSnapshot().tenants.outra).toEqual(before.tenants.outra);
    expect((await f.services.exportCatalog(company.id)).products).toEqual(first.products);
    expect((await f.services.exportCatalog(company.id)).codesAssigned).toBe(0);
    first.products[0].name = "Objeto externo";
    expect(f.repo.getSnapshot().tenants[company.id].products[0].name).toBe(product.name);
    const prepared = prepareCatalogExport(
      [
        { ...product, sku: "P-1" },
        { ...product, id: "two", sku: "" },
      ],
      (() => {
        const codes = ["P-1", "P-2"];
        return () => codes.shift()!;
      })(),
    );
    expect(prepared.products.map((p) => p.sku)).toEqual(["P-1", "P-2"]);
    expect(() =>
      prepareCatalogExport(
        [
          { ...product, sku: "X" },
          { ...product, id: "two", sku: "X" },
        ],
        () => "Y",
      ),
    ).toThrow(/repetidos/);
  });
  it("EXPORT-02 exporta campos e opções e reimporta nomes/preços editados sem duplicar produtos", async () => {
    const f = await fixture();
    await f.services.saveProduct(company.id, {
      ...product,
      costCents: 1200,
      ingredients: ["Cebola; roxa", "[Picles]"],
      image: "data:image/png;base64,AAAA",
      cutoutImage: "data:image/webp;base64,BBBB",
      extras: [{ ...product.extras[0], costCents: 0, available: false }],
    });
    const current = await f.services.exportCatalog(company.id);
    const file = await writeCatalogExport(current, await template());
    expect(file.fileName).toBe("cardapio-demo.xlsx");
    expect(file.parts).toBe(1);
    const doc = await readCatalogBuffer(file.buffer);
    expect(doc.issues).toEqual([]);
    const row = doc.sheets[0].rows.find((r) => r.line === 2)!;
    expect(row.cells[8]).toBe(KEEP_IMAGE);
    expect(row.cells[10]).toBe(KEEP_IMAGE);
    const plan = planCatalogImport(doc, current.products, true);
    expect(plan.issues).toEqual([]);
    expect(plan.entries[0].product).toEqual(current.products[0]);
    row.cells[1] = "Novo nome editado";
    row.cells[3] = 34.55;
    row.cells[4] = null;
    row.cells[6] = "Não";
    await f.services.importCatalog(company.id, doc, {
      allowUpdates: true,
      expectedFingerprint: catalogFingerprint(current.products),
    });
    const result = f.repo.getSnapshot().tenants[company.id].products;
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: product.id,
      name: "Novo nome editado",
      priceCents: 3455,
      costCents: null,
      status: "Indisponível",
      image: current.products[0].image,
    });
    expect(result[0].extras).toEqual(current.products[0].extras);
    expect(
      planCatalogImport(doc, [], true).issues.some((i) => /manter a foto/.test(i.message)),
    ).toBe(true);
  });
  it("EXPORT-03 conserva códigos e nomes iguais, campos literais e catálogo vazio sem exemplos", async () => {
    const input = [
      {
        ...product,
        sku: "001",
        name: '=HYPERLINK("https://example.com")',
        description: "+Texto & <literal>",
        status: "Indisponível" as const,
        featured: false,
        extras: [],
      },
      { ...product, id: "second", sku: "002", extras: [] },
      { ...product, id: "third", sku: "003", extras: [] },
    ];
    const result = await writeCatalogExport(snapshot(input), await template());
    const doc = await readCatalogBuffer(result.buffer);
    expect(planCatalogImport(doc, input, true).entries.map((e) => e.product)).toEqual(input);
    expect(planCatalogImport(doc, input, true).issues).toEqual([]);
    const workbook = await loadCatalogWorkbook(result.buffer);
    expect(workbook.getWorksheet("Produtos")!.getCell("A2").value).toBe("001");
    expect(workbook.getWorksheet("Produtos")!.getCell("B2").value).toBe(input[0].name);
    expect(workbook.getWorksheet("Produtos")!.getCell("D2").value).toBe(29.9);
    expect(workbook.getWorksheet("Produtos")!.getCell("D2").numFmt).toContain("0.00");
    expect(workbook.getWorksheet("Produtos")!.views[0]).toMatchObject({
      state: "frozen",
      xSplit: 1,
      ySplit: 1,
    });
    const empty = await writeCatalogExport(snapshot([]), await template());
    const emptyDoc = await readCatalogBuffer(empty.buffer);
    expect(emptyDoc.sheets.map((s) => s.rows)).toEqual([
      expect.arrayContaining([expect.objectContaining({ line: 1 })]),
      expect.arrayContaining([expect.objectContaining({ line: 1 })]),
    ]);
    expect(emptyDoc.sheets.every((s) => s.rows.length === 1)).toBe(true);
  });
  it("EXPORT-04 exportação exige gestor autorizado para a loja", async () => {
    const attendant = await fixture("attendant");
    const before = structuredClone(attendant.repo.getSnapshot());
    await expect(attendant.services.exportCatalog(company.id)).rejects.toThrow();
    expect(attendant.repo.getSnapshot()).toEqual(before);
    const f = await fixture();
    await f.repo.transact((state) => {
      state.companies.push({ ...company, id: "outra", slug: "outra" });
      state.tenants.outra = structuredClone(state.tenants[company.id]);
    });
    const ownerBefore = structuredClone(f.repo.getSnapshot());
    await expect(f.services.exportCatalog("outra")).rejects.toThrow();
    expect(f.repo.getSnapshot()).toEqual(ownerBefore);
  });
  it("EXPORT-05 divide catálogo completo em partes reimportáveis sem perder produtos ou adicionais", async () => {
    const input = Array.from({ length: 51 }, (_, i) => ({
      ...product,
      id: `p${i}`,
      sku: `P${i}`,
      name: `Produto ${i}`,
      extras: Array.from({ length: 30 }, (_, e) => ({
        id: `e${i}-${e}`,
        name: `Adicional ${e}`,
        priceCents: 100,
        costCents: null,
        available: true,
      })),
    }));
    expect(
      catalogExportBatches(
        Array.from({ length: 501 }, (_, i) => ({
          ...product,
          id: `p${i}`,
          sku: `P${i}`,
          extras: [],
        })),
      ).map((b) => b.length),
    ).toEqual([500, 1]);
    const result = await writeCatalogExport(snapshot(input), await template());
    expect(result.parts).toBe(2);
    expect(result.fileName).toBe("cardapio-teste.zip");
    const zip = await JSZip.loadAsync(result.buffer);
    const entries = Object.values(zip.files).filter((e) => !e.dir);
    let total = 0,
      extras = 0;
    for (const entry of entries) {
      const doc = await readCatalogBuffer(await entry.async("arraybuffer"));
      const plan = planCatalogImport(doc, input, true);
      expect(plan.issues).toEqual([]);
      total += plan.entries.length;
      extras += plan.entries.reduce((sum, e) => sum + e.product.extras.length, 0);
    }
    expect(total).toBe(51);
    expect(extras).toBe(1530);
  });
});
