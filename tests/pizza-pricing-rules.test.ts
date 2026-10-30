import { expect, it } from "vitest";
import { pizzaConfigSchema } from "../src/core/model.ts";
import { minimumPizzaPrice, pricePizza } from "../src/core/pizza.ts";
import { pizzaConfig, pizzaSelection } from "./pizza-fixture.ts";

const sample = () =>
  pizzaConfigSchema.parse({
    ...pizzaConfig,
    sizes: [{ ...pizzaConfig.sizes[1], maxFlavors: 3, fixedPriceCents: 4990 }],
    flavors: [4490, 3990, 5490].map((price, i) => ({
      id: `f${i}`,
      name: `Sabor ${i}`,
      available: true,
      prices: { large: price },
    })),
  });
const choice = {
  ...pizzaSelection,
  sizeId: "large",
  flavorCount: 3,
  flavorIds: ["f0", "f1", "f2"],
  doughId: "classic",
  edgeId: "plain",
};
it("PIZZA-RULES-01 média, maior e fixo calculam a mesma combinação com centavos corretos", () => {
  const config = sample();
  expect(pricePizza({ ...config, pricing: "average" }, choice).priceCents).toBe(4657);
  expect(pricePizza({ ...config, pricing: "highest" }, choice).priceCents).toBe(5490);
  expect(pricePizza({ ...config, pricing: "fixed" }, choice).priceCents).toBe(4990);
  expect(pricePizza({ ...config, pricing: "sum" }, choice).priceCents).toBe(13970);
});
it("PIZZA-RULES-02 fixo valida cada tamanho e permite sabores sem preço de referência; zero desabilita", () => {
  const config = sample();
  config.pricing = "fixed";
  config.flavors = config.flavors.map((f) => ({ ...f, prices: {} }));
  expect(pizzaConfigSchema.safeParse(config).success).toBe(true);
  expect(pricePizza(config, choice).priceCents).toBe(4990);
  expect(minimumPizzaPrice(config)).toBe(4990);
  for (const value of [undefined, 0, -1, 1.2]) {
    const invalid = { ...config, sizes: [{ ...config.sizes[0], fixedPriceCents: value }] };
    expect(pizzaConfigSchema.safeParse(invalid).success).toBe(false);
  }
  config.flavors[0].prices.large = 0;
  expect(() => pricePizza(config, choice)).toThrow(/disponível/);
  expect(minimumPizzaPrice(config)).toBe(4990);
});
it("PIZZA-RULES-03 fixo aceita acréscimo por quantidade, exceção fixa e cobra massa/borda uma vez", () => {
  const config = sample();
  config.pricing = "fixed";
  const selected = { ...choice, doughId: "thin", edgeId: "cream" };
  config.sizes[0].flavorCountPricing = { mode: "extra", prices: { "3": 500 } };
  expect(pricePizza(config, selected).priceCents).toBe(6490);
  config.sizes[0].flavorCountPricing = { mode: "fixed", prices: { "3": 6000 } };
  expect(pricePizza(config, selected).priceCents).toBe(7000);
  expect(pricePizza(config, { ...choice, flavorCount: 1, flavorIds: ["f0"] }).priceCents).toBe(
    4990,
  );
});
