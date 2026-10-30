import type { Product } from "./model.ts";
const normalized = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
export function replacesPizzaOption(product: Product, extra: Product["extras"][number]) {
  if (!product.pizza) return false;
  if (extra.replacedByPizzaOption) return true;
  const name = normalized(extra.name);
  return (
    /^borda(?:\s|$)/.test(name) ||
    product.pizza.sizes.some(
      (s) =>
        name === normalized(s.name) ||
        name.startsWith(normalized(s.name) + " ·") ||
        name.startsWith(normalized(s.name) + " -"),
    ) ||
    /\b\d+\s*cm\s*\/\s*\d+\s*fatias\b/.test(name)
  );
}
export function markReplacedPizzaExtras(product: Product) {
  return {
    ...product,
    extras: product.extras.map((e) =>
      replacesPizzaOption(product, e) ? { ...e, replacedByPizzaOption: true } : e,
    ),
  };
}
