import type { Product } from "./model.ts";
import { DomainError } from "./errors.ts";
import { PIZZA_PRICE_COLUMNS } from "./pizzaSheet.ts";
import {
  PRODUCT_COLUMNS,
  EXTRA_COLUMNS,
  MAX_IMPORT_PRODUCTS,
  MAX_IMPORT_EXTRAS,
  KEEP_IMAGE,
  type ImportCell,
} from "./catalogImport.ts";

/** Assign only missing codes; never derive identity from an editable product name. */
export function prepareCatalogExport(products: Product[], makeCode: () => string) {
  const used = new Set<string>();
  for (const product of products) {
    if (!product.sku) continue;
    if (used.has(product.sku))
      throw new DomainError(
        "Há produtos com códigos repetidos. Corrija os códigos antes de exportar.",
      );
    used.add(product.sku);
  }
  let codesAssigned = 0;
  const result = products.map((product) => {
    if (product.sku) return structuredClone(product);
    let code = makeCode();
    for (let attempts = 0; used.has(code); attempts++) {
      if (attempts >= 100)
        throw new DomainError("Não foi possível gerar um código único. Tente novamente.");
      code = makeCode();
    }
    used.add(code);
    codesAssigned++;
    return { ...structuredClone(product), sku: code };
  });
  return { products: result, codesAssigned };
}

export function catalogExportBatches(products: Product[]): Product[][] {
  const batches: Product[][] = [[]];
  let extraCount = 0,
    pizzaCount = 0;
  for (const product of products) {
    let current = batches[batches.length - 1];
    if (
      current.length >= MAX_IMPORT_PRODUCTS ||
      extraCount + product.extras.length > MAX_IMPORT_EXTRAS ||
      pizzaCount + (product.pizza ? product.pizza.flavors.length * product.pizza.sizes.length : 0) >
        2000
    ) {
      current = [];
      batches.push(current);
      extraCount = 0;
      pizzaCount = 0;
    }
    current.push(product);
    extraCount += product.extras.length;
    pizzaCount += product.pizza ? product.pizza.flavors.length * product.pizza.sizes.length : 0;
  }
  return batches;
}

export function catalogExportRows(
  products: Product[],
  allProducts = products,
): {
  products: ImportCell[][];
  extras: ImportCell[][];
  pizzaPrices: ImportCell[][];
} {
  return {
    pizzaPrices: [
      PIZZA_PRICE_COLUMNS,
      ...products
        .filter(
          (p) =>
            p.pizza &&
            !allProducts.some(
              (b) => b.id !== p.id && b.pizza?.flavors.some((f) => f.sourceProductId === p.id),
            ),
        )
        .flatMap((p) =>
          p.pizza!.sizes.flatMap((s) =>
            p.pizza!.flavors.map((f) => [
              p.sku,
              s.id,
              s.name,
              f.id,
              f.name,
              f.prices[s.id] ? f.prices[s.id] / 100 : null,
              p.pizza!.pricing === "fixed"
                ? f.prices[s.id] !== 0
                  ? "Sim"
                  : "Não"
                : (f.prices[s.id] || 0) > 0
                  ? "Sim"
                  : "Não",
              s.fixedPriceCents ? s.fixedPriceCents / 100 : null,
            ]),
          ),
        ),
    ],
    products: [
      PRODUCT_COLUMNS,
      ...products.map((p) => [
        p.sku,
        p.name,
        p.category,
        p.priceCents / 100,
        p.costCents === null ? null : p.costCents / 100,
        p.description,
        p.status === "Disponível" ? "Sim" : "Não",
        p.featured ? "Sim" : "Não",
        /^data:/i.test(p.image) || p.image.length > 32000 ? KEEP_IMAGE : p.image,
        p.ingredients.some((i) => i.includes(";") || i.startsWith("["))
          ? JSON.stringify(p.ingredients)
          : p.ingredients.join("; "),
        /^data:/i.test(p.cutoutImage) || p.cutoutImage.length > 32000 ? KEEP_IMAGE : p.cutoutImage,
      ]),
    ],
    extras: [
      EXTRA_COLUMNS,
      ...products.flatMap((p) =>
        p.extras.map((e) => [
          p.sku,
          e.name,
          e.priceCents / 100,
          e.costCents === null ? null : e.costCents / 100,
          e.available ? "Sim" : "Não",
        ]),
      ),
    ],
  };
}
