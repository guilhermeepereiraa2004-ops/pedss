import { productSchema, type Product } from "./model.ts";
import { DomainError } from "./errors.ts";
import { minimumPizzaPrice } from "./pizza.ts";
import { applyPizzaPriceSheet } from "./pizzaSheet.ts";

export const MAX_IMPORT_PRODUCTS = 500;
export const MAX_IMPORT_EXTRAS = 1500;
export const KEEP_IMAGE = "MANTER_FOTO_ATUAL";
export const PRODUCT_COLUMNS = [
  "Código",
  "Nome",
  "Categoria",
  "Preço (R$)",
  "Custo (R$)",
  "Descrição",
  "Disponível",
  "Destaque",
  "Foto (URL)",
  "Ingredientes removíveis",
  "Foto sem fundo (URL)",
];
export const EXTRA_COLUMNS = [
  "Código do produto",
  "Nome",
  "Preço (R$)",
  "Custo (R$)",
  "Disponível",
];
export type ImportCell = string | number | boolean | null;
export type ImportSheet = { name: string; rows: { line: number; cells: ImportCell[] }[] };
export type ImportIssue = { sheet: string; line: number; column: string; message: string };
export type CatalogImportDocument = { sheets: ImportSheet[]; issues: ImportIssue[] };
export type ImportEntry = {
  line: number;
  product: Product;
  action: "create" | "update";
  match: "code" | "name" | "new";
};
export type CatalogImportPlan = {
  entries: ImportEntry[];
  issues: ImportIssue[];
  created: number;
  updated: number;
  unchanged: number;
};
export const catalogFingerprint = (products: Product[]) => JSON.stringify(products);
export const normalizeImportText = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
const key = (value: string) => normalizeImportText(value).replace(/[^a-z0-9]/g, "");
const asText = (value: ImportCell | undefined) => (value == null ? "" : String(value).trim());
function amount(value: ImportCell | undefined, optional = false): number | null {
  if (value == null || value === "") {
    if (optional) return null;
    throw new Error("Informe o valor em reais.");
  }
  if (typeof value === "boolean") throw new Error("Informe um número em reais.");
  let raw = typeof value === "number" ? String(value) : value.trim().replace(/^R\$\s*/, "");
  if (raw.includes(",")) {
    if (!/^(?:\d{1,3}(?:\.\d{3})+|\d+),\d{1,2}$/.test(raw))
      throw new Error("Use um valor como 29,90.");
    raw = raw.replaceAll(".", "").replace(",", ".");
  } else if (!/^\d+(?:\.\d{1,2})?$/.test(raw))
    throw new Error("Use até duas casas decimais, como 29,90.");
  const cents = Math.round(Number(raw) * 100);
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 100_000_000)
    throw new Error("Valor fora do limite permitido.");
  return cents;
}
function yesNo(value: ImportCell | undefined, fallback: boolean) {
  if (value == null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const text = normalizeImportText(String(value));
  if (["sim", "s", "true", "1", "disponivel"].includes(text)) return true;
  if (["nao", "n", "false", "0", "indisponivel"].includes(text)) return false;
  throw new Error("Preencha Sim ou Não.");
}
const categoryNames: Record<string, Product["category"]> = {
  hamburguer: "Hamburguer",
  hamburgueres: "Hamburguer",
  burger: "Hamburguer",
  burgers: "Hamburguer",
  porcao: "Porção",
  porcoes: "Porção",
  acompanhamentos: "Porção",
  bebida: "Bebida",
  bebidas: "Bebida",
  sobremesa: "Sobremesa",
  sobremesas: "Sobremesa",
  pizza: "Pizza",
  pizzas: "Pizza",
  acai: "Açaí",
  acais: "Açaí",
  sorvete: "Sorvete",
  sorvetes: "Sorvete",
  salgado: "Salgado",
  salgados: "Salgado",
  pastel: "Pastel",
  pasteis: "Pastel",
};

/** Builds a complete plan without changing the catalogue. The service rebuilds this inside its transaction. */
export function planCatalogImport(
  document: CatalogImportDocument,
  existing: Product[],
  allowUpdates = false,
  makeId: () => string = () => crypto.randomUUID(),
): CatalogImportPlan {
  const issues: ImportIssue[] = [...document.issues];
  const issue = (sheet: string, line: number, column: string, message: string) =>
    issues.push({ sheet, line, column, message });
  const sheets = document.sheets;
  const find = (name: string) => sheets.filter((sheet) => key(sheet.name) === key(name));
  const productSheets = find("Produtos"),
    extraSheets = find("Adicionais");
  if (productSheets.length !== 1)
    issue("Produtos", 1, "Aba", "O arquivo deve conter uma única aba Produtos.");
  if (extraSheets.length > 1) issue("Adicionais", 1, "Aba", "Use uma única aba Adicionais.");
  function rowsFor(sheet: ImportSheet | undefined, columns: string[], required: string[]) {
    if (!sheet) return [];
    const header = sheet.rows.find((row) => row.line === 1)?.cells || [];
    const indices = new Map<string, number>();
    header.forEach((cell, index) => {
      const name = key(asText(cell));
      if (!name) return;
      if (!columns.some((column) => key(column) === name))
        issue(sheet.name, 1, asText(cell), "Coluna não reconhecida. Use os cabeçalhos do modelo.");
      if (indices.has(name)) issue(sheet.name, 1, asText(cell), "Coluna repetida.");
      else indices.set(name, index);
    });
    for (const column of required)
      if (!indices.has(key(column)))
        issue(sheet.name, 1, column, "Coluna obrigatória ausente. Use os cabeçalhos do modelo.");
    return sheet.rows
      .filter((row) => row.line > 1 && row.cells.some((cell) => cell !== null && cell !== ""))
      .map((row) => ({
        line: row.line,
        get: (name: string) => row.cells[indices.get(key(name)) ?? -1],
        sheet: sheet.name,
      }));
  }
  const rows = rowsFor(productSheets[0], PRODUCT_COLUMNS, [
    "Código",
    "Nome",
    "Categoria",
    "Preço (R$)",
  ]);
  const extras = rowsFor(extraSheets[0], EXTRA_COLUMNS, [
    "Código do produto",
    "Nome",
    "Preço (R$)",
  ]);
  if (!rows.length) issue("Produtos", 2, "Produtos", "Preencha pelo menos um produto.");
  if (rows.length > MAX_IMPORT_PRODUCTS)
    issue("Produtos", 1, "Produtos", `O limite é de ${MAX_IMPORT_PRODUCTS} produtos por arquivo.`);
  if (extras.length > MAX_IMPORT_EXTRAS)
    issue(
      "Adicionais",
      1,
      "Adicionais",
      `O limite é de ${MAX_IMPORT_EXTRAS} adicionais por arquivo.`,
    );
  const entries: ImportEntry[] = [],
    seen = new Set<string>(),
    matchedIds = new Set<string>();
  for (const row of rows.slice(0, MAX_IMPORT_PRODUCTS)) {
    const before = issues.length,
      code = asText(row.get("Código")).toUpperCase(),
      name = asText(row.get("Nome"));
    const capture = <T>(column: string, parse: () => T, fallback: T) => {
      try {
        return parse();
      } catch (e) {
        issue(row.sheet, row.line, column, (e as Error).message);
        return fallback;
      }
    };
    if (!/^[A-Z0-9][A-Z0-9._-]{0,59}$/.test(code))
      issue(
        row.sheet,
        row.line,
        "Código",
        "Use até 60 letras, números, ponto, hífen ou sublinhado.",
      );
    if (seen.has(code)) issue(row.sheet, row.line, "Código", "Código repetido na planilha.");
    seen.add(code);
    const category = categoryNames[key(asText(row.get("Categoria")))];
    if (!category)
      issue(
        row.sheet,
        row.line,
        "Categoria",
        "Use Hamburguer, Pizza, Açaí, Sorvete, Salgado, Pastel, Porção, Bebida ou Sobremesa.",
      );
    const nameKey = `${normalizeImportText(name)}|${category}`;
    const byCode = existing.filter((p) => p.sku?.toUpperCase() === code && code);
    const byName = existing.filter(
      (p) => !p.sku && `${normalizeImportText(p.name)}|${p.category}` === nameKey,
    );
    const matches = byCode.length ? byCode : byName;
    if (matches.length > 1)
      issue(
        row.sheet,
        row.line,
        "Código",
        "Há mais de um produto correspondente no cadastro. Corrija os códigos antes de importar.",
      );
    const current = matches.length === 1 ? matches[0] : undefined;
    if (current?.pizza && category !== "Pizza")
      issue(
        row.sheet,
        row.line,
        "Categoria",
        "Uma pizza configurada deve permanecer na categoria Pizza. Revise sua configuração no painel antes de mudar a categoria.",
      );
    if (current) {
      if (matchedIds.has(current.id))
        issue(
          row.sheet,
          row.line,
          "Código",
          "Duas linhas correspondem ao mesmo produto. Use apenas uma linha por produto.",
        );
      matchedIds.add(current.id);
    }
    if (current && !allowUpdates)
      issue(
        row.sheet,
        row.line,
        "Código",
        "Produto já cadastrado. Ative a atualização de produtos existentes para continuar.",
      );
    const rawIngredients = asText(row.get("Ingredientes removíveis"));
    const ingredients: string[] = capture(
      "Ingredientes removíveis",
      () => {
        if (rawIngredients.startsWith("[")) {
          const values: unknown = JSON.parse(rawIngredients);
          if (!Array.isArray(values) || values.some((v) => typeof v !== "string"))
            throw new Error(
              "Use uma lista de textos válida ou ingredientes separados por ponto e vírgula.",
            );
          return values.map((v) => v.trim()).filter(Boolean);
        }
        return rawIngredients
          .split(";")
          .map((v) => v.trim())
          .filter(Boolean);
      },
      [],
    );
    const rawImage = asText(row.get("Foto (URL)"));
    const cutoutCell = row.get("Foto sem fundo (URL)");
    const rawCutout = asText(cutoutCell);
    if (rawCutout === KEEP_IMAGE && !current)
      issue(
        row.sheet,
        row.line,
        "Foto sem fundo (URL)",
        "Para manter a foto sem fundo, o produto deve existir nesta loja com o mesmo código.",
      );
    if (rawImage === KEEP_IMAGE && !current)
      issue(
        row.sheet,
        row.line,
        "Foto (URL)",
        "Para manter a foto, o produto deve existir nesta loja com o mesmo código.",
      );
    const candidate = {
      ...current,
      id: current?.id || makeId(),
      sku: code,
      name,
      category,
      priceCents: capture("Preço (R$)", () => amount(row.get("Preço (R$)"))!, 0),
      costCents: capture("Custo (R$)", () => amount(row.get("Custo (R$)"), true), null),
      description: asText(row.get("Descrição")),
      status: capture("Disponível", () => yesNo(row.get("Disponível"), true), true)
        ? "Disponível"
        : "Indisponível",
      featured: capture("Destaque", () => yesNo(row.get("Destaque"), false), false),
      image: rawImage === KEEP_IMAGE ? current?.image || "" : rawImage,
      model3dUrl:
        rawImage === KEEP_IMAGE || rawImage === current?.image ? current?.model3dUrl || "" : "",
      // Older templates omit this column: preserve previously registered cutouts.
      cutoutImage:
        cutoutCell === undefined || rawCutout === KEEP_IMAGE
          ? current?.cutoutImage || ""
          : rawCutout,
      ingredients: [...new Set(ingredients)],
      extras: extraSheets.length ? [] : current?.extras || [],
      ...(current?.pizza && category === "Pizza"
        ? { pizza: current.pizza, priceCents: minimumPizzaPrice(current.pizza) }
        : {}),
    };
    const parsed = productSchema.safeParse(candidate);
    if (!parsed.success)
      for (const error of parsed.error.issues) {
        const column: Record<string, string> = {
          name: "Nome",
          priceCents: "Preço (R$)",
          image: "Foto (URL)",
          cutoutImage: "Foto sem fundo (URL)",
          description: "Descrição",
          ingredients: "Ingredientes removíveis",
        };
        const messages: Record<string, string> = {
          name: "Informe um nome de até 80 caracteres.",
          priceCents: "O preço deve ser maior que zero.",
          image: "Use uma URL HTTP/HTTPS válida ou um caminho local de imagem.",
          cutoutImage: "Use uma URL HTTP/HTTPS válida ou um caminho local de imagem sem fundo.",
          description: "Use uma descrição de até 500 caracteres.",
          ingredients: "Use até 30 ingredientes com até 60 caracteres cada.",
        };
        const field = String(error.path[0]);
        if (field !== "category")
          issue(row.sheet, row.line, column[field] || field, messages[field] || error.message);
      }
    if (parsed.success && before === issues.length)
      entries.push({
        line: row.line,
        product: parsed.data,
        action: current ? "update" : "create",
        match: current ? (byCode.length ? "code" : "name") : "new",
      });
  }
  const rawCodes = new Set(rows.map((row) => asText(row.get("Código")).toUpperCase()));
  const extraNames = new Set<string>();
  for (const row of extras.slice(0, MAX_IMPORT_EXTRAS)) {
    const code = asText(row.get("Código do produto")).toUpperCase(),
      name = asText(row.get("Nome")),
      entry = entries.find((e) => e.product.sku === code);
    if (!rawCodes.has(code)) {
      issue(
        row.sheet,
        row.line,
        "Código do produto",
        "O código deve existir na aba Produtos deste arquivo.",
      );
      continue;
    }
    if (!entry) continue;
    const dedup = `${code}|${normalizeImportText(name)}`;
    if (extraNames.has(dedup)) {
      issue(row.sheet, row.line, "Nome", "Adicional repetido para este produto.");
      continue;
    }
    extraNames.add(dedup);
    try {
      const prior = existing
        .find((p) => p.id === entry.product.id)
        ?.extras.find((e) => normalizeImportText(e.name) === normalizeImportText(name));
      const extra = {
        ...prior,
        id: prior?.id || makeId(),
        name,
        priceCents: amount(row.get("Preço (R$)"))!,
        costCents: amount(row.get("Custo (R$)"), true),
        available: yesNo(row.get("Disponível"), true),
      };
      const checked = productSchema.safeParse({
        ...entry.product,
        extras: [...entry.product.extras, extra],
      });
      if (!checked.success)
        throw new Error("Use nome de até 60 caracteres e no máximo 30 adicionais por produto.");
      entry.product = checked.data;
    } catch (e) {
      issue(row.sheet, row.line, "Adicional", (e as Error).message);
    }
  }
  applyPizzaPriceSheet(document, entries, issues, allowUpdates, amount);
  return {
    entries,
    issues,
    created: entries.filter((e) => e.action === "create").length,
    updated: entries.filter((e) => e.action === "update").length,
    unchanged: existing.filter((p) => !entries.some((e) => e.product.id === p.id)).length,
  };
}
export function assertImportDocument(value: unknown): asserts value is CatalogImportDocument {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as CatalogImportDocument).sheets) ||
    !Array.isArray((value as CatalogImportDocument).issues)
  )
    throw new DomainError("Arquivo de importação inválido.");
  const doc = value as CatalogImportDocument;
  if (
    doc.sheets.length > 10 ||
    doc.sheets.some(
      (s) =>
        !s ||
        typeof s.name !== "string" ||
        !Array.isArray(s.rows) ||
        s.rows.length > 2002 ||
        s.rows.some(
          (r) =>
            !r ||
            !Number.isInteger(r.line) ||
            r.line < 1 ||
            !Array.isArray(r.cells) ||
            r.cells.length > 30 ||
            r.cells.some((c) => c !== null && !["string", "number", "boolean"].includes(typeof c)),
        ),
    )
  )
    throw new DomainError("A estrutura da planilha está fora dos limites permitidos.");
  if (
    doc.issues.length > 2002 ||
    doc.issues.some(
      (i) =>
        !i ||
        typeof i.sheet !== "string" ||
        typeof i.column !== "string" ||
        typeof i.message !== "string" ||
        !Number.isInteger(i.line) ||
        i.line < 1,
    )
  )
    throw new DomainError("A lista de erros da planilha é inválida.");
}
