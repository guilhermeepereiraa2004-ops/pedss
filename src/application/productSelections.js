import { initialPizzaSelection, pizzaFlavorAvailable } from "../core/pizza.ts";

const onlyFlavor = (product) =>
  product.pizza?.flavors.length === 1 ? product.pizza.flavors[0] : null;

export function globalProductIngredients(product) {
  const flavor = onlyFlavor(product);
  return product.ingredients.filter((name) => !flavor?.ingredients?.includes(name));
}

// A linked individual pizza already identifies its flavor. Older cart lines may
// carry removals globally; move overlapping removals to that flavor when editing.
export function productPizzaSelection(product, selection, removed = []) {
  if (!product.pizza) return undefined;
  const next = structuredClone(selection || initialPizzaSelection(product.pizza));
  next.flavorCount ||= next.flavorIds.length || 1;
  const flavor = onlyFlavor(product);
  if (!flavor) return next;
  if (!next.flavorIds.length && pizzaFlavorAvailable(product.pizza, flavor, next.sizeId))
    next.flavorIds = [flavor.id];
  const shared = removed.filter((name) => flavor.ingredients?.includes(name));
  if (shared.length && next.flavorIds.includes(flavor.id)) {
    const custom = next.customizations?.find((item) => item.flavorId === flavor.id);
    next.customizations = [
      ...(next.customizations || []).filter((item) => item.flavorId !== flavor.id),
      {
        flavorId: flavor.id,
        extraIds: custom?.extraIds || [],
        removedIngredients: [...new Set([...(custom?.removedIngredients || []), ...shared])],
      },
    ];
  }
  return next;
}
