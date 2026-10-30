import { uuid } from "../core/domain.ts";
import type { PizzaConfig } from "../core/pizza.ts";

export function createPizzaConfig(product: { name?: string; priceCents?: number }): PizzaConfig {
  const sizeId = uuid();
  return {
    pricing: "highest",
    sizes: [
      { id: sizeId, name: "Grande", diameterCm: 35, slices: 8, maxFlavors: 2, available: true },
    ],
    flavors: [
      {
        id: uuid(),
        name: product.name || "Novo sabor",
        available: true,
        prices: { [sizeId]: product.priceCents || 0 },
      },
    ],
    doughs: [{ id: uuid(), name: "Tradicional", priceCents: 0, available: true }],
    edges: [{ id: uuid(), name: "Sem recheio", priceCents: 0, available: true }],
  };
}
