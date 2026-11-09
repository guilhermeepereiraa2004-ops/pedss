import type { Product } from "./model.ts";
import { pizzaFlavorAvailable, pizzaFlavorCounts } from "./pizza.ts";
import { comboStartingPrice } from "./restaurant.ts";

// Storefront and staff sales use the same catalog, including separately promoted builders.
export function menuCatalog(catalog: Product[]) {
  const availableProducts = catalog.filter(
    (p) => p.status === "Disponível" && (!p.combo || comboStartingPrice(p, catalog) !== null),
  );
  return {
    availableProducts,
    products: availableProducts.filter((p) => p.pizza?.menuPlacement !== "builder"),
    pizzaBuilders: availableProducts.filter(
      (p) =>
        p.category === "Pizza" &&
        p.pizza?.sizes.some(
          (size) =>
            size.available &&
            pizzaFlavorCounts(size).some(
              (count) =>
                count > 1 &&
                count <=
                  p.pizza!.flavors.filter((f) => pizzaFlavorAvailable(p.pizza!, f, size.id)).length,
            ),
        ),
    ),
  };
}
