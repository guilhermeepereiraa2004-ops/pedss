import { comboOptionState } from "../core/restaurant.ts";
import { pizzaFlavorAvailable } from "../core/pizza.ts";
import { pizzaIllustration } from "../lib/pizzaPhotography";

/** Read-only presentation of the same options validated by the pricing domain. */
export function comboGroups(product, products, choices = []) {
  return (product.combo?.groups || []).map((group) => {
    const options = group.options.map((option) => ({
      ...option,
      product: products.find((p) => p.id === option.productId),
      state: comboOptionState(option, products),
    }));
    const choice = choices.find((c) => c.groupId === group.id);
    return {
      ...group,
      options,
      choice,
      selected: options.find((o) => o.productId === choice?.productId),
    };
  });
}
export function comboArtworkItems(groups, products) {
  const items = [];
  for (const group of groups) {
    const option = group.selected || group.options.find((o) => o.state.available);
    const child = option?.product;
    if (!child) continue;
    const flavors =
      option.customizePizza && child.pizza
        ? child.pizza.flavors.filter((f) => pizzaFlavorAvailable(child.pizza, f, option.sizeId))
        : [];
    for (let unit = 0; unit < group.quantity && items.length < 4; unit++) {
      const flavor =
        option.customizePizza && child.pizza && !group.choice?.pizza
          ? flavors[unit % flavors.length]
          : null;
      const source = products.find((p) => p.id === flavor?.sourceProductId);
      const visual = flavor
        ? {
            ...child,
            name: flavor.name,
            model3dUrl: "",
            image: source?.image || "",
            cutoutImage:
              source?.cutoutImage ||
              flavor.previewImage ||
              (!source?.image ? pizzaIllustration(flavor) : ""),
          }
        : child;
      items.push({
        key: `${group.id}-${unit}`,
        product: visual,
        pizza: group.choice?.pizza,
        sizeId: option.sizeId,
      });
    }
  }
  return items;
}
export function comboUnitsLabel(groups) {
  const pizzas = groups
    .filter((g) => {
      const offered = g.selected ? [g.selected] : g.options.filter((o) => o.state.available);
      return offered.length > 0 && offered.every((o) => o.product?.category === "Pizza");
    })
    .reduce((s, g) => s + g.quantity, 0);
  const units = groups.reduce((s, g) => s + g.quantity, 0);
  return pizzas
    ? `${pizzas} ${pizzas === 1 ? "pizza" : "pizzas"}${units > pizzas ? " + acompanhamentos" : ""}`
    : `${units} ${units === 1 ? "item" : "itens"} no combo`;
}
