import { expect, it } from "vitest";
import { pricePizza, minimumPizzaPrice } from "../src/core/pizza.ts";
import { pizzaConfigSchema, cartLineSchema, orderSchema } from "../src/core/model.ts";
import { priceLine } from "../src/core/domain.ts";
import { company, fixture, checkout } from "./fixtures.ts";
import { pizzaConfig, pizzaSelection, pizzaProduct, pizzaLine } from "./pizza-fixture.ts";
import { catalogExportRows } from "../src/core/catalogExport.ts";
import { planCatalogImport } from "../src/core/catalogImport.ts";
it("PIZZA-08 servidor exige quantidade declarada e mantém sacolas legadas", () => {
  expect(() => pricePizza(pizzaConfig, { ...pizzaSelection, flavorCount: 3 })).toThrow();
  expect(() => pricePizza(pizzaConfig, { ...pizzaSelection, flavorCount: 1 })).toThrow();
  expect(pricePizza(pizzaConfig, { ...pizzaSelection, flavorCount: 2 }).priceCents).toBe(5001);
  expect(pricePizza(pizzaConfig, pizzaSelection).priceCents).toBe(5001);
});

it("PIZZA-07 reimportar planilha preserva montador e preço calculado", () => {
  const current = { ...pizzaProduct, sku: "PIZZA-01" };
  const rows = catalogExportRows([current]);
  rows.products[1][3] = 1;
  const document = {
    sheets: [{ name: "Produtos", rows: rows.products.map((cells, i) => ({ line: i + 1, cells })) }],
    issues: [],
  };
  const plan = planCatalogImport(document, [current], true);
  expect(plan.issues).toEqual([]);
  expect(plan.entries[0].product.pizza).toEqual(current.pizza);
  expect(plan.entries[0].product.priceCents).toBe(3000);
});

it.each([
  ["highest", 5001],
  ["average", 4501],
  ["sum", 8001],
] as const)(
  "PIZZA-01 %s calcula sabores em centavos e soma massa/borda uma vez",
  (pricing, total) => {
    expect(pricePizza({ ...pizzaConfig, pricing }, pizzaSelection).priceCents).toBe(total);
  },
);
it("PIZZA-02 valida tamanho, limite, repetição, disponibilidade e preço por tamanho", () => {
  for (const patch of [
    undefined,
    { ...pizzaSelection, sizeId: "missing" },
    { ...pizzaSelection, flavorIds: [] },
    { ...pizzaSelection, flavorIds: ["cheese", "cheese"] },
    { ...pizzaSelection, flavorIds: ["cheese", "pepper", "chicken"] },
    { ...pizzaSelection, flavorIds: ["chicken"] },
    { ...pizzaSelection, doughId: "missing" },
    { ...pizzaSelection, edgeId: "missing" },
  ])
    expect(() => pricePizza(pizzaConfig, patch)).toThrow();
  expect(() =>
    pricePizza(
      { ...pizzaConfig, flavors: pizzaConfig.flavors.map((f) => ({ ...f, available: false })) },
      pizzaSelection,
    ),
  ).toThrow();
  expect(() =>
    pricePizza(
      { ...pizzaConfig, sizes: pizzaConfig.sizes.map((s) => ({ ...s, available: false })) },
      pizzaSelection,
    ),
  ).toThrow();
  expect(
    pricePizza(pizzaConfig, {
      ...pizzaSelection,
      sizeId: "large",
      flavorIds: ["cheese", "pepper", "chicken", "bacon"],
    }).priceCents,
  ).toBe(8000);
});
it("PIZZA-03 schema rejeita regras inválidas e payload com preço inventado", () => {
  expect(
    pizzaConfigSchema.safeParse({
      ...pizzaConfig,
      sizes: [{ ...pizzaConfig.sizes[0], maxFlavors: 5 }],
    }).success,
  ).toBe(false);
  expect(pizzaConfigSchema.safeParse({ ...pizzaConfig, edges: [] }).success).toBe(false);
  expect(
    pizzaConfigSchema.safeParse({
      ...pizzaConfig,
      flavors: [{ ...pizzaConfig.flavors[0], prices: {} }],
    }).success,
  ).toBe(false);
  expect(
    pizzaConfigSchema.safeParse({
      ...pizzaConfig,
      doughs: [pizzaConfig.doughs[0], pizzaConfig.doughs[0]],
    }).success,
  ).toBe(false);
  expect(
    cartLineSchema.safeParse({ ...pizzaLine, pizza: { ...pizzaSelection, priceCents: 1 } }).success,
  ).toBe(false);
});
it("PIZZA-04 preço mínimo e resumo usam catálogo; combinações não inventam custo", () => {
  expect(minimumPizzaPrice(pizzaConfig)).toBe(3000);
  const result = priceLine(pizzaLine, [{ ...pizzaProduct, costCents: 100 }]);
  expect(result.unitPriceCents).toBe(5001);
  expect(result.unitCostCents).toBeNull();
  expect(result.pizzaSummary).toContain("1/2 Mussarela + 1/2 Calabresa");
  expect(result.pizzaSummary).toContain("Massa: Fina · Borda: Requeijão");
  expect(() => priceLine({ ...pizzaLine, pizza: undefined }, [pizzaProduct])).toThrow();
});
it("PIZZA-05 serviço protege configuração, separa montagens e preserva pedido histórico", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, { ...pizzaProduct, priceCents: 1 });
  expect(
    f.repo.getSnapshot().tenants[company.id].products.find((p) => p.id === "pizza")?.priceCents,
  ).toBe(3000);
  await f.services.addToCart(company.id, pizzaLine);
  await f.services.addToCart(company.id, {
    ...pizzaLine,
    pizza: { ...pizzaSelection, edgeId: "plain" },
  });
  const t = f.repo.getSnapshot().tenants[company.id];
  expect(t.cart.lines).toHaveLength(2);
  await f.services.checkout(company.id, t.cart.requestId, {
    ...checkout,
    expectedTotalCents: 9702,
  });
  const old = structuredClone(f.repo.getSnapshot().tenants[company.id].orders[0]);
  expect(orderSchema.safeParse(old).success).toBe(true);
  await f.services.saveProduct(company.id, {
    ...pizzaProduct,
    pizza: { ...pizzaConfig, flavors: [{ ...pizzaConfig.flavors[0], name: "Outro sabor" }] },
  });
  expect(f.repo.getSnapshot().tenants[company.id].orders[0]).toEqual(old);
  const attendant = await fixture("attendant");
  await expect(attendant.services.saveProduct(company.id, pizzaProduct)).rejects.toThrow();
});
it("PIZZA-06 alterações de preço e disponibilidade são revalidadas ao fechar pedido", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, pizzaProduct);
  await f.services.addToCart(company.id, pizzaLine);
  const requestId = f.repo.getSnapshot().tenants[company.id].cart.requestId;
  await f.services.saveProduct(company.id, {
    ...pizzaProduct,
    pizza: {
      ...pizzaConfig,
      flavors: pizzaConfig.flavors.map((flavor) => ({
        ...flavor,
        prices: { medium: 9000, large: 9000 },
      })),
    },
  });
  await expect(
    f.services.checkout(company.id, requestId, { ...checkout, expectedTotalCents: 5501 }),
  ).rejects.toThrow(/valores/);
  await f.services.saveProduct(company.id, {
    ...pizzaProduct,
    pizza: {
      ...pizzaConfig,
      flavors: pizzaConfig.flavors.map((flavor) => ({
        ...flavor,
        available: flavor.id !== "pepper",
      })),
    },
  });
  await expect(
    f.services.checkout(company.id, requestId, { ...checkout, expectedTotalCents: 5501 }),
  ).rejects.toThrow(/sabor/);
  expect(f.repo.getSnapshot().tenants[company.id].orders).toHaveLength(0);
});
