import { DomainError } from "../core/errors.ts";
export function comboGroupMode(group) {
  return group.mode || (group.options.length <= 1 ? "included" : "choice");
}
/** Draft-only conversion; references, quantities, sizes and surcharges survive until explicit save. */
export function changeComboGroupMode(groups, id, mode, products, makeId) {
  const group = groups.find((g) => g.id === id);
  if (!group) throw new DomainError("Grupo não encontrado.");
  if (mode !== "included" || group.options.length <= 1)
    return groups.map((g) => (g.id === id ? { ...g, mode } : g));
  if (groups.length - 1 + group.options.length > 10)
    throw new DomainError(
      "O combo permite até 10 itens/grupos. Reduza as opções antes de incluir todos.",
    );
  return groups.flatMap((g) =>
    g.id !== id
      ? [g]
      : g.options.map((option, i) => ({
          ...g,
          id: i === 0 ? g.id : makeId(),
          mode: "included",
          name: products.find((p) => p.id === option.productId)?.name || g.name,
          options: [structuredClone(option)],
        })),
  );
}
