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
  return {
    sizeId: config.sizes.find((s) => s.available)?.id || "",
    flavorIds: [],
    flavorCount: 1,
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
  const summary = `${size.name} · ${size.diameterCm} cm · ${size.slices} fatias · ${flavors.map((f, i) => `${flavors.length > 1 ? `${weights[i]}/${denominator} ` : ""}${f.name}`).join(" + ")} · Massa: ${dough.name} · Borda: ${edge.name}${details.length ? " · " + details.join("; ") : ""}`;
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

export function minimumPizzaPrice(config: PizzaConfig) {
  const prices: number[] = [];
  for (const size of config.sizes.filter((v) => v.available)) {
    const flavors = config.flavors
      .filter((v) => pizzaFlavorAvailable(config, v, size.id))
      .sort((a, b) => (a.prices[size.id] || 0) - (b.prices[size.id] || 0));
    for (const dough of config.doughs.filter((v) => v.available))
      for (const edge of config.edges.filter((v) => v.available))
        for (const kind of ["all", "savory", "sweet"]) {
          const allowed = flavors.filter(
            (f) =>
              (kind === "all" || (f.kind || "savory") === kind) &&
              [dough, edge].every(
                (o) =>
                  (!o.allowedSizeIds || o.allowedSizeIds.includes(size.id)) &&
                  (!o.allowedFlavorKinds || o.allowedFlavorKinds.includes(f.kind || "savory")),
              ),
          );
          for (let count = 1; count <= Math.min(size.maxFlavors, allowed.length); count++) {
            try {
              prices.push(
                pricePizza(config, {
                  sizeId: size.id,
                  flavorIds: allowed.slice(0, count).map((f) => f.id),
                  flavorCount: count,
                  doughId: dough.id,
                  edgeId: edge.id,
                }).priceCents,
              );
              if (config.allowUnequalParts && count > 1 && count < 4)
                prices.push(
                  pricePizza(config, {
                    sizeId: size.id,
                    flavorIds: allowed.slice(0, count).map((f) => f.id),
                    flavorCount: count,
                    doughId: dough.id,
                    edgeId: edge.id,
                    portions: allowed.slice(0, count).map((_, i) => (i === 0 ? 5 - count : 1)),
                  }).priceCents,
                );
            } catch (error) {
              // A combination beyond the monetary limit cannot be the advertised minimum.
              if (!(error instanceof DomainError)) throw error;
            }
          }
        }
  }
  if (!prices.length) throw new DomainError("Cadastre uma combinação disponível para a pizza.");
  return Math.min(...prices);
}
