import type {
  CatalogImportDocument,
  ImportEntry,
  ImportIssue,
  ImportCell,
} from "./catalogImport.ts";
import { productSchema } from "./model.ts";
import { minimumPizzaPrice } from "./pizza.ts";
export const PIZZA_PRICE_COLUMNS = [
  "Código do produto",
  "ID tamanho",
  "Tamanho",
  "ID sabor",
  "Sabor",
  "Preço (R$)",
  "Disponível",
  "Preço fixo do tamanho (R$)",
];
const key = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
export function applyPizzaPriceSheet(
  document: CatalogImportDocument,
  entries: ImportEntry[],
  issues: ImportIssue[],
  allowUpdates: boolean,
  amount: (v: ImportCell | undefined, optional?: boolean) => number | null,
) {
  const sheets = document.sheets.filter((s) => key(s.name) === "precosdaspizzas");
  if (!sheets.length) return;
  if (sheets.length !== 1) {
    issues.push({
      sheet: "Preços das pizzas",
      line: 1,
      column: "Aba",
      message: "Use uma única aba Preços das pizzas.",
    });
    return;
  }
  const sheet = sheets[0],
    header = sheet.rows.find((r) => r.line === 1)?.cells || [],
    indices = new Map(header.map((v, i) => [key(v), i]));
  const issue = (line: number, message: string) =>
    issues.push({ sheet: sheet.name, line, column: "Preços", message });
  if (PIZZA_PRICE_COLUMNS.some((c) => !indices.has(key(c)))) {
    issue(1, "Mantenha os cabeçalhos da aba de preços exportada.");
    return;
  }
  if (new Set(header.map(key).filter(Boolean)).size !== header.filter((v) => key(v)).length) {
    issue(1, "Não repita cabeçalhos na aba de preços.");
    return;
  }
  if (sheet.rows.filter((r) => r.line > 1).length > 2000) {
    issue(1, "Use até 2000 preços de pizza por arquivo.");
    return;
  }
  const seen = new Set<string>(),
    fixed = new Map<string, number>(),
    changed = new Set<ImportEntry>();
  for (const row of sheet.rows.filter(
    (r) => r.line > 1 && r.cells.some((c) => c !== null && c !== ""),
  )) {
    const get = (name: string) => row.cells[indices.get(key(name))!],
      code = String(get("Código do produto") || "")
        .trim()
        .toUpperCase(),
      sizeId = String(get("ID tamanho") || ""),
      flavorId = String(get("ID sabor") || "");
    const entry = entries.find((e) => e.product.sku === code),
      config = entry?.product.pizza,
      size = config?.sizes.find((s) => s.id === sizeId),
      flavor = config?.flavors.find((f) => f.id === flavorId);
    if (!allowUpdates) {
      issue(
        row.line,
        "Marque a atualização dos produtos existentes para importar os preços das pizzas.",
      );
      continue;
    }
    if (!entry || !config || !size || !flavor) {
      issue(
        row.line,
        "Código, tamanho ou sabor não encontrado. Exporte a configuração atual da mesma loja antes de editar preços.",
      );
      continue;
    }
    const token = `${code}|${sizeId}|${flavorId}`;
    if (seen.has(token)) {
      issue(row.line, "Preço repetido para o mesmo sabor e tamanho.");
      continue;
    }
    seen.add(token);
    try {
      const available = key(get("Disponível"));
      if (!["sim", "nao", "true", "false", "1", "0"].includes(available))
        throw new Error("Disponível deve ser Sim ou Não.");
      const enabled = ["sim", "true", "1"].includes(available);
      const value = amount(get("Preço (R$)"), true);
      if (!enabled) flavor.prices[sizeId] = 0;
      else if (value == null && config.pricing === "fixed") delete flavor.prices[sizeId];
      else if (value == null || value <= 0)
        throw new Error("Informe preço positivo para um sabor disponível.");
      else flavor.prices[sizeId] = value;
      const sizeFixed = amount(get("Preço fixo do tamanho (R$)"), true);
      if (sizeFixed != null) {
        if (sizeFixed <= 0) throw new Error("Preço fixo do tamanho deve ser positivo.");
        const sizeKey = `${code}|${sizeId}`,
          prior = fixed.get(sizeKey);
        if (prior != null && prior !== sizeFixed)
          throw new Error("Repita o mesmo preço fixo em todas as linhas deste tamanho.");
        fixed.set(sizeKey, sizeFixed);
        size.fixedPriceCents = sizeFixed;
      }
      changed.add(entry);
    } catch (e) {
      issue(row.line, (e as Error).message);
    }
  }
  for (const entry of changed)
    try {
      entry.product.priceCents = minimumPizzaPrice(entry.product.pizza!);
      entry.product = productSchema.parse(entry.product);
    } catch (e) {
      issue(entry.line, e instanceof Error ? e.message : "Revise a tabela de preços da pizza.");
    }
}
