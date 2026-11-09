import type { z } from "zod";
import { pizzaConfigSchema, pizzaSelectionSchema } from "./model.ts";
import { DomainError } from "./errors.ts";

export type PizzaConfig = z.infer<typeof pizzaConfigSchema>;
export type PizzaSelection = z.infer<typeof pizzaSelectionSchema>;
export const pizzaPricingLabels = {
  highest: "Sabor de maior valor",
  average: "Média dos sabores",
  fixed: "Preço fixo por tamanho",
  sum: "Soma dos sabores",
};
export function pizzaFlavorCounts(size: PizzaConfig["sizes"][number]) {
  return size.allowedFlavorCounts
    ? [...size.allowedFlavorCounts].sort((a, b) => a - b)
    : Array.from({ length: size.maxFlavors }, (_, index) => index + 1);
}
export function pizzaFlavorAvailable(
  config: PizzaConfig,
  flavor: PizzaConfig["flavors"][number],
  sizeId: string,
) {
  return (
    flavor.available &&
    (config.pricing === "fixed" ? flavor.prices[sizeId] !== 0 : flavor.prices[sizeId] > 0)
  );
}
export function initialPizzaSelection(config: PizzaConfig): PizzaSelection {
  const size = config.sizes.find((s) => s.available);
  return {
    sizeId: size?.id || "",
    flavorIds: [],
    flavorCount: size ? pizzaFlavorCounts(size)[0] : 1,
    doughId: config.doughs.find((v) => v.available)?.id || "",
    edgeId: config.edges.find((v) => v.available)?.id || "",
  };
}

/** A missing price means this flavor is not sold in that size. All amounts are cents. */
export function pricePizza(config: PizzaConfig, selection?: PizzaSelection) {
  if (!selection) throw new DomainError("Monte a pizza antes de adicionar à sacola.");
  const size = config.sizes.find((s) => s.id === selection.sizeId && s.available);
  if (!size) throw new DomainError("Tamanho de pizza indisponível.");
  const ids = selection.flavorIds;
  if (
    selection.flavorCount != null &&
    (selection.flavorCount > size.maxFlavors || ids.length !== selection.flavorCount)
  )
    throw new DomainError(
      `Escolha exatamente ${Math.min(selection.flavorCount, size.maxFlavors)} ${Math.min(selection.flavorCount, size.maxFlavors) === 1 ? "sabor" : "sabores"} para completar a pizza.`,
    );
  if (!ids.length || ids.length > size.maxFlavors || new Set(ids).size !== ids.length)
    throw new DomainError(`Escolha de 1 a ${size.maxFlavors} sabores diferentes.`);
  if (size.allowedFlavorCounts && !size.allowedFlavorCounts.includes(ids.length))
    throw new DomainError(
      `Este tamanho não é oferecido com ${ids.length} ${ids.length === 1 ? "sabor" : "sabores"}.`,
    );
  const flavors = ids.map((id) => {
    const flavor = config.flavors.find((f) => f.id === id && f.available);
    if (!flavor || !pizzaFlavorAvailable(config, flavor, size.id))
      throw new DomainError("Um sabor não está disponível neste tamanho. Revise a pizza.");
    return { ...flavor, priceCents: flavor.prices[size.id] || 0 };
  });
  const weights = selection.portions || ids.map(() => 1);
  if (
    weights.length !== ids.length ||
    weights.some((w) => !Number.isInteger(w) || w < 1 || w > 4) ||
    (selection.portions && !config.allowUnequalParts)
  )
    throw new DomainError("Revise as proporções dos sabores desta pizza.");
  const denominator = weights.reduce((sum, w) => sum + w, 0);
  if (selection.portions && denominator !== 4)
    throw new DomainError("As partes da pizza devem somar 4 quartos.");
  const kinds = new Set(flavors.map((f) => f.kind || "savory"));
  if (config.allowMixedKinds === false && kinds.size > 1)
    throw new DomainError("Esta loja não combina sabores doces e salgados na mesma pizza.");
  const dough = config.doughs.find((v) => v.id === selection.doughId && v.available);
  const edge = config.edges.find((v) => v.id === selection.edgeId && v.available);
  if (!dough || !edge) throw new DomainError("Selecione uma massa e uma borda disponíveis.");
  for (const option of [dough, edge])
    if (
      (option.allowedSizeIds && !option.allowedSizeIds.includes(size.id)) ||
      (option.allowedFlavorKinds && [...kinds].some((k) => !option.allowedFlavorKinds!.includes(k)))
    )
      throw new DomainError(`${option.name} não é compatível com o tamanho ou sabores escolhidos.`);
  const customizations = selection.customizations || [];
  if (new Set(customizations.map((c) => c.flavorId)).size !== customizations.length)
    throw new DomainError("Personalização de sabor repetida.");
  let customCents = 0;
  const details: string[] = [];
  for (const custom of customizations) {
    const flavor = flavors.find((f) => f.id === custom.flavorId);
    if (
      !flavor ||
      custom.removedIngredients.some((i) => !flavor.ingredients?.includes(i)) ||
      new Set(custom.extraIds).size !== custom.extraIds.length
    )
      throw new DomainError("Revise a personalização de cada sabor.");
    for (const id of custom.extraIds) {
      const extra = flavor.extras?.find((e) => e.id === id && e.available);
      if (!extra) throw new DomainError("Adicional deste sabor indisponível.");
      customCents += extra.priceCents;
      details.push(`${flavor.name}: + ${extra.name}`);
    }
    if (custom.removedIngredients.length)
      details.push(`${flavor.name}: sem ${custom.removedIngredients.join(", ")}`);
  }
  const sum = flavors.reduce((total, f) => total + f.priceCents, 0);
  if (config.pricing === "fixed" && !(size.fixedPriceCents && size.fixedPriceCents > 0))
    throw new DomainError(`Informe um preço fixo maior que zero para ${size.name}.`);
  const flavorBase =
    config.pricing === "fixed"
      ? size.fixedPriceCents!
      : config.pricing === "highest"
        ? Math.max(...flavors.map((f) => f.priceCents))
        : config.pricing === "average"
          ? Math.round(
              flavors.reduce((total, f, i) => total + f.priceCents * weights[i], 0) / denominator,
            )
          : sum;
  const countPrice = size.flavorCountPricing?.prices[String(ids.length)];
  const base =
    countPrice == null
      ? flavorBase
      : size.flavorCountPricing?.mode === "fixed"
        ? countPrice
        : flavorBase + countPrice;
  const priceCents = base + dough.priceCents + edge.priceCents + customCents;
  if (!Number.isSafeInteger(priceCents) || priceCents < 1 || priceCents > 100_000_000)
    throw new DomainError("O valor da pizza ultrapassa o limite permitido.");
  const summary = `${size.name}${size.diameterCm ? ` · ${size.diameterCm} cm` : ""} · ${size.slices} fatias · ${flavors.map((f, i) => `${flavors.length > 1 ? `${weights[i]}/${denominator} ` : ""}${f.name}`).join(" + ")} · Massa: ${dough.name} · Borda: ${edge.name}${details.length ? " · " + details.join("; ") : ""}`;
  if (summary.length > 1000)
    throw new DomainError("Reduza a quantidade de personalizações da pizza.");
  return {
    priceCents,
    summary,
    size,
    flavors,
    dough,
    edge,
    customCents,
    pricing: config.pricing,
    breakdown: {
      baseCents: base,
      flavorBaseCents: flavorBase,
      countExtraCents:
        size.flavorCountPricing?.mode === "extra" && countPrice != null ? countPrice : 0,
      doughCents: dough.priceCents,
      edgeCents: edge.priceCents,
      flavorExtrasCents: customCents,
    },
  };
}

export function pizzaFormatPrices(
  config: PizzaConfig,
  {
    count: onlyCount,
    requiredFlavorIds = [],
    equalParts = false,
    comboExtrasOnly = false,
  }: {
    count?: number;
    requiredFlavorIds?: string[];
    equalParts?: boolean;
    comboExtrasOnly?: boolean;
  } = {},
) {
  const groups: ("savory" | "sweet")[][] = [["savory"], ["sweet"]];
  if (config.allowMixedKinds !== false) groups.push(["savory", "sweet"]);
  const byCost = (a: { priceCents: number }, b: { priceCents: number }) =>
    a.priceCents - b.priceCents;
  const doughs = config.doughs.filter((option) => option.available).sort(byCost);
  const edges = config.edges.filter((option) => option.available).sort(byCost);

  return config.sizes
    .filter((size) => size.available)
    .flatMap((size) => {
      const flavorCost = (a: PizzaConfig["flavors"][number], b: PizzaConfig["flavors"][number]) =>
        (a.prices[size.id] || 0) - (b.prices[size.id] || 0);
      const flavors = config.flavors
        .filter((flavor) => pizzaFlavorAvailable(config, flavor, size.id))
        .sort(flavorCost);
      const minimums = new Map<number, { priceCents: number; selection: PizzaSelection }>();
      const counts = pizzaFlavorCounts(size);
      for (const kinds of groups) {
        const allowed = flavors.filter((flavor) => kinds.includes(flavor.kind || "savory"));
        const required = allowed.filter((flavor) => requiredFlavorIds.includes(flavor.id));
        if (required.length !== requiredFlavorIds.length) continue;
        const compatible = (option: PizzaConfig["doughs"][number]) =>
          (!option.allowedSizeIds || option.allowedSizeIds.includes(size.id)) &&
          kinds.every(
            (kind) => !option.allowedFlavorKinds || option.allowedFlavorKinds.includes(kind),
          );
        const dough = doughs.find(compatible);
        const edge = edges.find(compatible);
        if (!dough || !edge) continue;
        const remaining = allowed.filter((flavor) => !requiredFlavorIds.includes(flavor.id));
        for (const count of counts) {
          if (
            count < required.length ||
            count > allowed.length ||
            (onlyCount != null && count !== onlyCount)
          )
            continue;
          const picked = [...required, ...remaining.slice(0, count - required.length)].sort(
            flavorCost,
          );
          const selection = {
            sizeId: size.id,
            flavorIds: picked.map((flavor) => flavor.id),
            flavorCount: count,
            doughId: dough.id,
            edgeId: edge.id,
          };
          try {
            const priced = pricePizza(config, selection);
            let best: { priceCents: number; selection: PizzaSelection } = {
              priceCents: comboExtrasOnly ? dough.priceCents + edge.priceCents : priced.priceCents,
              selection,
            };
            if (
              !comboExtrasOnly &&
              !equalParts &&
              config.allowUnequalParts &&
              (count === 2 || count === 3)
            ) {
              const unequal = { ...selection, portions: count === 2 ? [3, 1] : [2, 1, 1] };
              const priceCents = pricePizza(config, unequal).priceCents;
              if (priceCents < best.priceCents) best = { priceCents, selection: unequal };
            }
            if (best.priceCents < (minimums.get(count)?.priceCents ?? Infinity))
              minimums.set(count, best);
          } catch (error) {
            if (!(error instanceof DomainError)) throw error;
          }
        }
      }
      const formats = [...minimums]
        .sort(([a], [b]) => a - b)
        .map(([count, best]) => ({ count, ...best }));
      return formats.length ? [{ size, formats }] : [];
    });
}

export function minimumPizzaPrice(config: PizzaConfig) {
  const prices = pizzaFormatPrices(config).flatMap(({ formats }) =>
    formats.map(({ priceCents }) => priceCents),
  );
  if (!prices.length) throw new DomainError("Cadastre uma combinação disponível para a pizza.");
  return Math.min(...prices);
}
