import { productSchema } from "../src/core/model.ts";
import type { PizzaConfig, PizzaSelection } from "../src/core/pizza.ts";
export const pizzaConfig: PizzaConfig = {
  pricing: "highest",
  sizes: [
    { id: "medium", name: "Média", diameterCm: 30, slices: 6, maxFlavors: 2, available: true },
    { id: "large", name: "Grande", diameterCm: 35, slices: 8, maxFlavors: 4, available: true },
  ],
  flavors: [
    { id: "cheese", name: "Mussarela", available: true, prices: { medium: 3000, large: 4000 } },
    { id: "pepper", name: "Calabresa", available: true, prices: { medium: 4001, large: 5000 } },
    { id: "chicken", name: "Frango", available: true, prices: { large: 6000 } },
    { id: "bacon", name: "Bacon", available: true, prices: { large: 7000 } },
  ],
  doughs: [
    { id: "classic", name: "Tradicional", priceCents: 0, available: true },
    { id: "thin", name: "Fina", priceCents: 200, available: true },
  ],
  edges: [
    { id: "plain", name: "Sem recheio", priceCents: 0, available: true },
    { id: "cream", name: "Requeijão", priceCents: 800, available: true },
  ],
};
export const pizzaSelection: PizzaSelection = {
  sizeId: "medium",
  flavorIds: ["cheese", "pepper"],
  doughId: "thin",
  edgeId: "cream",
};
export const pizzaProduct = productSchema.parse({
  id: "pizza",
  name: "Monte sua pizza",
  category: "Pizza",
  priceCents: 3000,
  status: "Disponível",
  pizza: pizzaConfig,
});
export const pizzaFormatsDemo = productSchema.parse({
  ...pizzaProduct,
  priceCents: 6500,
  pizza: {
    ...pizzaConfig,
    menuPlacement: "builder",
    allowMixedKinds: false,
    sizes: [
      { id: "small", name: "Pequena", diameterCm: 25, slices: 4, maxFlavors: 2, available: true },
      { id: "medium", name: "Média", diameterCm: 30, slices: 6, maxFlavors: 3, available: true },
      { id: "family", name: "Família", diameterCm: 40, slices: 10, maxFlavors: 3, available: true },
    ],
    flavors: [
      {
        id: "cheese",
        name: "Mussarela",
        available: true,
        prices: { small: 6500, medium: 7500, family: 9500 },
      },
      {
        id: "pepper",
        name: "Calabresa",
        available: true,
        prices: { small: 6700, medium: 7900, family: 9900 },
      },
      { id: "chicken", name: "Frango", available: true, prices: { medium: 8200, family: 10500 } },
      {
        id: "chocolate",
        name: "Chocolate com Morango",
        available: true,
        kind: "sweet",
        prices: { small: 7000, medium: 8000, family: 9900 },
      },
    ],
  },
});
export const pizzaLine = {
  key: "pizza-line",
  productId: "pizza",
  quantity: 1,
  extraIds: [],
  removedIngredients: [],
  notes: "",
  pizza: pizzaSelection,
};
