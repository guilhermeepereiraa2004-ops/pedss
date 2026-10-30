import { expect, it } from "vitest";
import { pricePizza, minimumPizzaPrice } from "../src/core/pizza.ts";
import { pizzaConfigSchema } from "../src/core/model.ts";
import { pizzaConfig, pizzaSelection, pizzaProduct, pizzaLine } from "./pizza-fixture.ts";
import { fixture, company, checkout } from "./fixtures.ts";

it("PIZZA-PRICE-01 fatias e quantidade de sabores são independentes; preço fixo e acréscimo respeitam tamanho", () => {
  const config = structuredClone(pizzaConfig);
  config.sizes[0].slices = 3;
  config.sizes[1].slices = 4;
  const fixed = pizzaConfigSchema.parse({
    ...config,
    sizes: config.sizes.map((s) => ({
      ...s,
      flavorCountPricing: { mode: "fixed", prices: { "2": 5500 } },
    })),
  });
  expect(pricePizza(fixed, pizzaSelection)).toMatchObject({
    priceCents: 6500,
    size: { slices: 3 },
  });
  expect(pricePizza(fixed, { ...pizzaSelection, sizeId: "large" }).priceCents).toBe(6500);
  const extra = pizzaConfigSchema.parse({
    ...config,
    sizes: [
      { ...config.sizes[0], flavorCountPricing: { mode: "extra", prices: { "2": 500 } } },
      config.sizes[1],
    ],
  });
  expect(pricePizza(extra, pizzaSelection).priceCents).toBe(5501);
  expect(pricePizza(extra, { ...pizzaSelection, sizeId: "large" }).priceCents).toBe(6000);
  expect(pricePizza(extra, { ...pizzaSelection, flavorIds: ["cheese"] }).priceCents).toBe(4000);
  expect(pricePizza(pizzaConfig, pizzaSelection).priceCents).toBe(5001);
});

it("PIZZA-PRICE-02 três e quatro sabores têm valores próprios, sem ignorar disponibilidade ou limite", () => {
  const config = pizzaConfigSchema.parse({
    ...pizzaConfig,
    sizes: [
      pizzaConfig.sizes[0],
      {
        ...pizzaConfig.sizes[1],
        flavorCountPricing: { mode: "fixed", prices: { "3": 6500, "4": 7500 } },
      },
    ],
  });
  const selection = {
    ...pizzaSelection,
    sizeId: "large",
    flavorCount: 3,
    flavorIds: ["cheese", "pepper", "chicken"],
  };
  expect(pricePizza(config, selection).priceCents).toBe(7500);
  expect(
    pricePizza(config, {
      ...selection,
      flavorCount: 4,
      flavorIds: [...selection.flavorIds, "bacon"],
    }).priceCents,
  ).toBe(8500);
  expect(() => pricePizza(config, { ...selection, sizeId: "medium" })).toThrow();
  config.flavors[2].available = false;
  expect(() => pricePizza(config, selection)).toThrow(/indisponível|disponível/);
});

it("PIZZA-PRICE-03 valor A partir de considera combinações e ignora quantidades impossíveis", () => {
  const config = pizzaConfigSchema.parse({
    ...pizzaConfig,
    sizes: [
      { ...pizzaConfig.sizes[0], flavorCountPricing: { mode: "fixed", prices: { "2": 2000 } } },
      { ...pizzaConfig.sizes[1], flavorCountPricing: { mode: "fixed", prices: { "4": 1000 } } },
    ],
  });
  expect(minimumPizzaPrice(config)).toBe(1000);
  config.flavors[3].available = false;
  expect(minimumPizzaPrice(config)).toBe(2000);
  const enormous = pizzaConfigSchema.parse({
    ...pizzaConfig,
    pricing: "sum",
    flavors: pizzaConfig.flavors.map((f) => ({
      ...f,
      prices: { medium: 60_000_000, large: 60_000_000 },
    })),
  });
  expect(minimumPizzaPrice(enormous)).toBe(60_000_000);
});

it("PIZZA-PRICE-04 configuração recusa preço fixo zero, frações, negativos e quantidade fora do limite", () => {
  for (const pricing of [
    { mode: "fixed", prices: { "2": 0 } },
    { mode: "extra", prices: { "2": -1 } },
    { mode: "extra", prices: { "2": 1.2 } },
    { mode: "extra", prices: { "3": 200 } },
    { mode: "fixed", prices: { "5": 5000 } },
  ])
    expect(
      pizzaConfigSchema.safeParse({
        ...pizzaConfig,
        sizes: [{ ...pizzaConfig.sizes[0], flavorCountPricing: pricing }, pizzaConfig.sizes[1]],
      }).success,
    ).toBe(false);
});

it("PIZZA-PRICE-05 salvar preços recalcula pedido, rejeita total antigo e preserva venda anterior", async () => {
  const f = await fixture();
  const product = {
    ...pizzaProduct,
    pizza: pizzaConfigSchema.parse({
      ...pizzaConfig,
      sizes: [
        { ...pizzaConfig.sizes[0], flavorCountPricing: { mode: "fixed", prices: { "2": 5500 } } },
        pizzaConfig.sizes[1],
      ],
    }),
  };
  await f.services.saveProduct(company.id, product);
  await f.services.addToCart(company.id, pizzaLine);
  const request = f.repo.getSnapshot().tenants[company.id].cart.requestId;
  await expect(
    f.services.checkout(company.id, request, { ...checkout, expectedTotalCents: 5501 }),
  ).rejects.toThrow(/valores/);
  await f.services.checkout(company.id, request, { ...checkout, expectedTotalCents: 7000 });
  const order = structuredClone(f.repo.getSnapshot().tenants[company.id].orders[0]);
  expect(order.lines[0].unitPriceCents).toBe(6500);
  expect(order.lines[0].pizzaSummary).toContain("6 fatias");
  product.pizza.sizes[0].flavorCountPricing!.prices["2"] = 6500;
  await f.services.saveProduct(company.id, product);
  expect(f.repo.getSnapshot().tenants[company.id].orders[0]).toEqual(order);
});
