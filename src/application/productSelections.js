import {
  initialPizzaSelection,
  pizzaFlavorAvailable,
  pizzaFlavorCounts,
  pizzaFormatPrices,
} from "../core/pizza.ts";

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

export function pizzaWithAvailableOptions(config, selection) {
  const kinds = selection.flavorIds.map(
    (id) => config.flavors.find((flavor) => flavor.id === id)?.kind || "savory",
  );
  const next = { ...selection };
  for (const [group, field] of [
    ["doughs", "doughId"],
    ["edges", "edgeId"],
  ]) {
    const available = config[group].filter(
      (option) =>
        option.available &&
        (!option.allowedSizeIds || option.allowedSizeIds.includes(next.sizeId)) &&
        (!option.allowedFlavorKinds ||
          kinds.every((kind) => option.allowedFlavorKinds.includes(kind))),
    );
    if (!available.some((option) => option.id === next[field]))
      next[field] = available[0]?.id || "";
  }
  return next;
}

export function pizzaWithFlavors(
  selection,
  flavorIds,
  flavorCount = Math.max(1, flavorIds.length),
) {
  const { customizations, portions, ...base } = selection;
  const retained = customizations?.filter((option) => flavorIds.includes(option.flavorId));
  const sameFlavors =
    flavorIds.length === selection.flavorIds.length &&
    flavorIds.every((id, index) => selection.flavorIds[index] === id);
  return {
    ...base,
    flavorIds,
    flavorCount,
    ...(retained?.length ? { customizations: retained } : {}),
    ...(sameFlavors && portions ? { portions } : {}),
  };
}

export function pizzaFormatLabel(count) {
  if (count === 1) return "Inteira";
  if (count === 2) return "Meio a meio";
  return `${count} sabores`;
}

export function storefrontPizzaFormats({ availableProducts, pizzaBuilders }) {
  const groups = (products) =>
    products.flatMap((product) => {
      const sizes = pizzaFormatPrices(product.pizza, { equalParts: true });
      return sizes.length ? [{ product, sizes }] : [];
    });
  const dedicated = groups(
    availableProducts.filter(
      (product) => product.category === "Pizza" && product.pizza?.menuPlacement === "builder",
    ),
  );
  return dedicated.length ? dedicated : groups(pizzaBuilders);
}

export function pizzaAtSize(config, selection, size) {
  const available = config.flavors.filter((flavor) =>
    pizzaFlavorAvailable(config, flavor, size.id),
  );
  const retained = selection.flavorIds.filter((id) => available.some((flavor) => flavor.id === id));
  return pizzaWithAvailableOptions(
    config,
    pizzaWithFlavors(
      { ...selection, sizeId: size.id },
      config.flavors.length === 1
        ? available.map((flavor) => flavor.id)
        : retained.slice(0, pizzaFlavorCounts(size).at(-1)),
    ),
  );
}

export function linkedPizzaBuilder(product, builders) {
  if (product?.pizza?.flavors.length !== 1) return null;
  for (const builder of builders) {
    const { pizza: config } = builder;
    const flavor = config.flavors.find(
      (item) => item.sourceProductId === product.id && item.available,
    );
    if (!flavor) continue;
    const sizes = config.sizes.filter(
      (size) => size.available && pizzaFlavorAvailable(config, flavor, size.id),
    );
    if (
      sizes.some((size) =>
        pizzaFormatPrices({ ...config, sizes: [size] }, { requiredFlavorIds: [flavor.id] }).some(
          ({ formats }) => formats.some(({ count }) => count > 1),
        ),
      )
    )
      return { builder, flavor, sizes };
  }
  return null;
}

export function pizzaCombinationDraft(link, line) {
  const { builder, flavor, sizes } = link;
  const previous = line.pizza;
  const size = sizes.find((item) => item.id === previous.sizeId) || sizes[0];
  const customization = previous.customizations?.find(
    (item) => item.flavorId === previous.flavorIds[0],
  );
  return {
    ...line,
    productId: builder.id,
    pizza: pizzaWithAvailableOptions(builder.pizza, {
      ...previous,
      sizeId: size.id,
      flavorIds: [flavor.id],
      flavorCount: 1,
      portions: undefined,
      customizations: customization ? [{ ...customization, flavorId: flavor.id }] : undefined,
    }),
  };
}
