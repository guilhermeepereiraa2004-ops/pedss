import { describe, it, expect, vi } from "vitest";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import {
  PRODUCT_COLUMNS,
  EXTRA_COLUMNS,
  planCatalogImport,
  catalogFingerprint,
  assertImportDocument,
  type CatalogImportDocument,
  type ImportCell,
} from "../src/core/catalogImport.ts";
import { readCatalogBuffer, validateWorkbookArchive } from "../src/adapters/catalogWorkbook.js";
import { readCatalogFile } from "../src/application/catalogTransfer.js";
import { fixture, company, product, cartLine, checkout } from "./fixtures.ts";
import { catalogExportRows } from "../src/core/catalogExport.ts";

export const row = (changes: ImportCell[] = []) => [
  "SKU-01",
  "Produto da planilha",
  "Hambúrguer",
  "29,90",
  null,
  "Descrição",
  "Sim",
  "Não",
  "",
  "Cebola; Picles",
  ...changes,
];
export function documentFor(
  rows: ImportCell[][] = [row()],
  extras?: ImportCell[][],
): CatalogImportDocument {
  return {
    sheets: [
      {
        name: "Produtos",
        rows: [
          { line: 1, cells: PRODUCT_COLUMNS },
          ...rows.map((cells, i) => ({ line: i + 2, cells })),
        ],
      },
      ...(extras
        ? [
            {
              name: "Adicionais",
              rows: [
                { line: 1, cells: EXTRA_COLUMNS },
                ...extras.map((cells, i) => ({ line: i + 2, cells })),
              ],
            },
          ]
        : []),
    ],
    issues: [],
  };
}
const buffer = async () => {
  const bytes = await readFile("public/templates/modelo-cardapio-brasa.xlsx");
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};
const options = (products, allowUpdates = false) => ({
  allowUpdates,
  expectedFingerprint: catalogFingerprint(products),
});

describe("importação de cardápio", () => {
  it("IMPORT-10 novas categorias aceitam acentos/plural e preservam categoria e centavos na exportação/reimportação", () => {
    const inputs = ["Pizzas", "Açaís", "Sorvetes", "Salgados", "Pastéis"];
    const expected = ["Pizza", "Açaí", "Sorvete", "Salgado", "Pastel"];
    const rows = inputs.map((category, i) => {
      const cells = row();
      cells[0] = `SEG-${i}`;
      cells[2] = category;
      return cells;
    });
    const plan = planCatalogImport(documentFor(rows), []);
    expect(plan.issues).toEqual([]);
    expect(plan.entries.map((e) => e.product.category)).toEqual(expected);
    const exported = catalogExportRows(plan.entries.map((e) => e.product));
    const roundTrip = planCatalogImport(
      documentFor(exported.products.slice(1), exported.extras.slice(1)),
      [],
    );
    expect(roundTrip.issues).toEqual([]);
    expect(roundTrip.entries.map((e) => [e.product.category, e.product.priceCents])).toEqual(
      expected.map((category) => [category, 2990]),
    );
  });
  it("IMPORT-01 lê o modelo distribuído com três produtos, adicionais e centavos", async () => {
    const doc = await readCatalogBuffer(await buffer());
    assertImportDocument(doc);
    const plan = planCatalogImport(doc, []);
    expect(plan.issues).toEqual([]);
    expect(plan.created).toBe(3);
    expect(plan.entries[0].product).toMatchObject({
      sku: "EX-BURGER-01",
      priceCents: 2990,
      costCents: 1200,
      extras: [
        { priceCents: 450, costCents: 150 },
        { priceCents: 600, costCents: null },
      ],
    });
    expect(plan.entries[2].product.costCents).toBeNull();
  });
  it("IMPORT-02 aceita números e moeda brasileira e distingue custo zero de desconhecido", () => {
    const a = row(),
      b = row();
    a[3] = "R$ 1.234,56";
    a[4] = 0;
    b[0] = "SKU-02";
    b[1] = "Outro";
    b[3] = 12.9;
    const plan = planCatalogImport(documentFor([a, b]), []);
    expect(plan.issues).toEqual([]);
    expect(plan.entries.map((e) => [e.product.priceCents, e.product.costCents])).toEqual([
      [123456, 0],
      [1290, null],
    ]);
  });
  it("IMPORT-03 relata linha e coluna para valores inválidos e códigos repetidos", () => {
    const invalid = row();
    invalid[3] = "12,999";
    invalid[2] = "Inválida";
    invalid[6] = "Talvez";
    const plan = planCatalogImport(documentFor([row(), invalid]), []);
    expect(plan.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ line: 3, column: "Código" }),
        expect.objectContaining({ line: 3, column: "Categoria" }),
        expect.objectContaining({ line: 3, column: "Preço (R$)" }),
        expect.objectContaining({ line: 3, column: "Disponível" }),
      ]),
    );
    expect(plan.entries).toHaveLength(1);
    expect(() => assertImportDocument({ sheets: [null], issues: [] })).toThrow(/estrutura/);
    const noHeader = documentFor();
    noHeader.sheets[0].rows[0].cells = ["Nome", "Coluna surpresa"];
    expect(
      planCatalogImport(noHeader, []).issues.some((i) => i.line === 1 && i.column === "Código"),
    ).toBe(true);
  });
  it("IMPORT-04 bloqueia referências, repetições e excesso de opções ou produtos", () => {
    const doc = documentFor(
      [row()],
      [
        ["INEXISTENTE", "Queijo", 3],
        ["SKU-01", "Queijo", 3],
        ["SKU-01", "queijo", 4],
      ],
    );
    expect(
      planCatalogImport(doc, [])
        .issues.map((i) => i.message)
        .join(" "),
    ).toMatch(/código deve existir.*repetido/);
    const many = Array.from({ length: 501 }, (_, i) => {
      const item = row();
      item[0] = `P${i}`;
      item[1] = `Produto ${i}`;
      return item;
    });
    expect(planCatalogImport(documentFor(many), []).issues.some((i) => /500/.test(i.message))).toBe(
      true,
    );
    expect(
      planCatalogImport(
        documentFor(
          [row()],
          Array.from({ length: 31 }, (_, i) => ["SKU-01", `Opção ${i}`, 2]),
        ),
        [],
      ).issues.some((i) => /30 adicionais/.test(i.message)),
    ).toBe(true);
  });
  it("IMPORT-05 exige atualização explícita e preserva IDs e adicionais quando a aba está ausente", async () => {
    const f = await fixture();
    const imported = row();
    imported[1] = product.name;
    const doc = documentFor([imported]);
    const current = f.repo.getSnapshot().tenants[company.id].products;
    expect(planCatalogImport(doc, current).issues[0].message).toMatch(/Ative a atualização/);
    await f.services.importCatalog(company.id, doc, options(current, true));
    const updated = f.repo.getSnapshot().tenants[company.id].products;
    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({ id: product.id, sku: "SKU-01", extras: product.extras });
    const codeDoc = documentFor([row()], [["SKU-01", "Queijo", 5, null, "Não"]]);
    await f.services.importCatalog(company.id, codeDoc, options(updated, true));
    expect(f.repo.getSnapshot().tenants[company.id].products[0].extras).toEqual([
      expect.objectContaining({ id: "cheese", priceCents: 500, available: false }),
    ]);
    const next = f.repo.getSnapshot().tenants[company.id].products;
    await f.services.importCatalog(company.id, documentFor([row()], []), options(next, true));
    expect(f.repo.getSnapshot().tenants[company.id].products[0].extras).toEqual([]);
  });
  it("IMPORT-06 grava o lote inteiro e preserva pedidos e produtos fora do arquivo", async () => {
    const f = await fixture();
    await f.services.addToCart(company.id, cartLine);
    await f.services.checkout(
      company.id,
      f.repo.getSnapshot().tenants[company.id].cart.requestId,
      checkout,
    );
    const prior = structuredClone(f.repo.getSnapshot());
    const invalid = row();
    invalid[0] = "P2";
    invalid[1] = "Inválido";
    invalid[3] = -10;
    await expect(
      f.services.importCatalog(
        company.id,
        documentFor([row(), invalid]),
        options(prior.tenants[company.id].products),
      ),
    ).rejects.toThrow(/linha 3/);
    expect(f.repo.getSnapshot()).toEqual(prior);
    await f.services.importCatalog(
      company.id,
      documentFor(),
      options(prior.tenants[company.id].products),
    );
    const tenant = f.repo.getSnapshot().tenants[company.id];
    expect(tenant.products).toHaveLength(2);
    expect(tenant.products[0]).toEqual(prior.tenants[company.id].products[0]);
    expect(tenant.orders).toEqual(prior.tenants[company.id].orders);
  });
  it("IMPORT-07 impede acesso de atendente, outra loja e prévia desatualizada", async () => {
    const attendant = await fixture("attendant");
    await expect(
      attendant.services.importCatalog(company.id, documentFor(), options([product])),
    ).rejects.toThrow();
    const f = await fixture();
    await f.repo.transact((state) => {
      state.companies.push({ ...company, id: "store-two", slug: "outra" });
      state.tenants["store-two"] = structuredClone(state.tenants[company.id]);
    });
    const prior = structuredClone(f.repo.getSnapshot());
    await expect(
      f.services.importCatalog("store-two", documentFor(), options([product])),
    ).rejects.toThrow();
    expect(f.repo.getSnapshot()).toEqual(prior);
    await f.services.saveProduct(company.id, { ...product, priceCents: 4000 });
    const changed = structuredClone(f.repo.getSnapshot());
    await expect(
      f.services.importCatalog(company.id, documentFor(), options([product])),
    ).rejects.toThrow(/alterado após a prévia/);
    expect(f.repo.getSnapshot()).toEqual(changed);
  });
  it("IMPORT-08 rejeita fórmulas, arquivos corrompidos e arquivos grandes", async () => {
    expect(() => validateWorkbookArchive(new ArrayBuffer(10))).toThrow(/XLSX válida/);
    expect(() => validateWorkbookArchive(new ArrayBuffer(2 * 1024 * 1024 + 1))).toThrow(/2 MB/);
    const zip = await JSZip.loadAsync(await buffer());
    const filename = "xl/worksheets/sheet1.xml";
    const xml = await zip.file(filename)!.async("string");
    expect(xml).toContain('r="D2"');
    zip.file(
      filename,
      xml.replace(
        /(<(?:x:)?c\b[^>]*\br="D2"[^>]*>)([\s\S]*?)(<\/(?:x:)?c>)/,
        "$1<f>1+1</f><v>2</v>$3",
      ),
    );
    const result = await readCatalogBuffer(await zip.generateAsync({ type: "arraybuffer" }));
    expect(result.issues).toContainEqual(
      expect.objectContaining({ line: 2, message: expect.stringMatching(/fórmulas por valores/) }),
    );
    const macros = await JSZip.loadAsync(await buffer());
    macros.file("xl/vbaProject.bin", "placeholder");
    await expect(
      readCatalogBuffer(await macros.generateAsync({ type: "arraybuffer" })),
    ).rejects.toThrow(/sem macros/);
  });
  it("IMPORT-09 valida o arquivo antes da leitura e encerra o worker ao cancelar", async () => {
    await expect(readCatalogFile({ name: "legado.csv", size: 20 })).rejects.toThrow(/.xlsx/);
    await expect(readCatalogFile({ name: "grande.xlsx", size: 3 * 1024 * 1024 })).rejects.toThrow(
      /2 MB/,
    );
    const terminate = vi.fn();
    const send = vi.fn();
    vi.stubGlobal(
      "Worker",
      class {
        terminate = terminate;
        postMessage = send;
      },
    );
    try {
      const controller = new AbortController();
      const pending = readCatalogFile(
        { name: "menu.xlsx", size: 10, arrayBuffer: async () => new ArrayBuffer(10) },
        controller.signal,
      );
      await Promise.resolve();
      controller.abort();
      await expect(pending).rejects.toThrow(/cancelada/);
      expect(terminate).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
