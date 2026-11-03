import type { CartLine, Order, Product, Tenant } from "./model.ts";
import type { z } from "zod";
import type { pizzaSaleSchema } from "./restaurantModel.ts";
import { pricePizza } from "./pizza.ts";
import { DomainError } from "./errors.ts";
import { localDay } from "./calendar.ts";
export type PizzaSale = z.infer<typeof pizzaSaleSchema>;

/** Historical names, portions and oven settings. Never derive old sales from today's catalog. */
export function pizzaSnapshot(product: Product, line: CartLine): PizzaSale[] {
  if (product.category !== "Pizza") return [];
  const p = product.pizza ? pricePizza(product.pizza, line.pizza) : null;
  const weights = line.pizza?.portions || p?.flavors.map(() => 1) || [1];
  const total = weights.reduce((a, b) => a + b, 0);
  return [
    {
      componentKey: line.key,
      productId: product.id,
      name: product.name,
      quantity: line.quantity,
      sizeId: p?.size.id || "single",
      sizeName: p?.size.name || "Tamanho único",
      diameterCm: p?.size.diameterCm,
      dough: p?.dough.name || "",
      edge: p?.edge.name || "",
      ovenMinutes: p?.size.ovenMinutes || 10,
      ovenUnits: p?.size.ovenUnits || 1,
      flavors: p
        ? p.flavors.map((f, i) => ({ id: f.id, name: f.name, share: weights[i] / total }))
        : [{ id: product.id, name: product.name, share: 1 }],
    },
  ];
}
export const pizzaStages = ["queued", "preparing", "baking", "ready"] as const;
export const pizzaStageLabels = {
  queued: "Na fila",
  preparing: "Montando",
  baking: "No forno",
  ready: "Pronta",
};
export function pizzaWorkItems(order: Order) {
  const count = order.lines.reduce(
    (sum, l) => sum + (l.pizzaDetails || []).reduce((s, p) => s + p.quantity, 0),
    0,
  );
  if (count > 300) return [];
  return order.lines.flatMap((line) =>
    (line.pizzaDetails || []).flatMap((p) =>
      Array.from({ length: p.quantity }, (_, i) => {
        const lineKey = line.selection?.key || "";
        const key = `${lineKey.length}:${lineKey}${p.componentKey}:${i}`;
        return {
          key,
          name: p.name,
          size: p.sizeName,
          summary: p.flavors
            .map((f) => `${Number((f.share * 100).toFixed(1))}% ${f.name}`)
            .join(" + "),
          dough: p.dough,
          edge: p.edge,
          notes: line.notes,
          stage:
            order.production?.filter((e) => e.key === key).at(-1)?.stage ||
            ("queued" as (typeof pizzaStages)[number]),
        };
      }),
    ),
  );
}
export function pizzaSalesReport(orders: Order[], month: string) {
  const flavors = new Map<string, { name: string; portions: number }>();
  const sizes = new Map<string, { name: string; pizzas: number }>();
  let pizzas = 0,
    untrackedLines = 0;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    return { pizzas, untrackedLines, flavors: [], sizes: [] };
  for (const o of orders.filter(
    (o) =>
      !o.demo &&
      o.status !== "Cancelado" &&
      o.paymentStatus === "Pago" &&
      localDay(o.createdAt).startsWith(month),
  )) {
    for (const l of o.lines) {
      if (!l.pizzaDetails) {
        if (l.pizzaUnits !== 0 || l.selection?.pizza || l.selection?.comboChoices?.length)
          untrackedLines++;
        continue;
      }
      for (const p of l.pizzaDetails) {
        pizzas += p.quantity;
        const sizeKey = `${p.sizeName}:${p.diameterCm || 0}`;
        const size = sizes.get(sizeKey) || {
          name: `${p.sizeName}${p.diameterCm ? ` · ${p.diameterCm} cm` : ""}`,
          pizzas: 0,
        };
        size.pizzas += p.quantity;
        sizes.set(sizeKey, size);
        for (const f of p.flavors) {
          const key = f.id + ":" + f.name;
          const row = flavors.get(key) || { name: f.name, portions: 0 };
          row.portions += f.share * p.quantity;
          flavors.set(key, row);
        }
      }
    }
  }
  return {
    pizzas,
    untrackedLines,
    flavors: [...flavors.values()].sort(
      (a, b) => b.portions - a.portions || a.name.localeCompare(b.name),
    ),
    sizes: [...sizes.values()].sort((a, b) => b.pizzas - a.pizzas || a.name.localeCompare(b.name)),
  };
}
/** Conservative reservation: each pizza occupies its size's spaces during the minutes before pickup. */
export function assertOvenCapacity(
  tenant: Tenant,
  at: string,
  pizzas: PizzaSale[],
  exceptOrderId = "",
) {
  const limit = tenant.restaurant?.scheduling.ovenSlots;
  if (!limit || !pizzas.length) return;
  const finish = Date.parse(at);
  const first = finish - Math.max(...pizzas.map((p) => p.ovenMinutes)) * 60000;
  const events: { at: number; slots: number }[] = [];
  const add = (time: number, rows: PizzaSale[]) => {
    for (const p of rows) {
      const start = time - p.ovenMinutes * 60000;
      if (start >= finish || time <= first) continue;
      events.push(
        { at: Math.max(first, start), slots: p.quantity * p.ovenUnits },
        { at: Math.min(time, finish), slots: -p.quantity * p.ovenUnits },
      );
    }
  };
  add(finish, pizzas);
  for (const o of tenant.orders.filter(
    (o) => o.id !== exceptOrderId && o.status !== "Cancelado" && o.scheduledAt,
  )) {
    const time = Date.parse(o.scheduledAt!);
    if (time <= first || time - 120 * 60000 >= finish) continue;
    if (o.lines.some((l) => !l.pizzaDetails && (l.pizzaUnits !== 0 || l.selection?.pizza)))
      throw new DomainError(
        "Há um pedido antigo sem reserva de forno neste período. Revise antes de agendar.",
      );
    add(
      time,
      o.lines.flatMap((l) => l.pizzaDetails || []),
    );
  }
  let slots = 0;
  for (const e of events.sort((a, b) => a.at - b.at || a.slots - b.slots)) {
    slots += e.slots;
    if (slots > limit + 0.00001)
      throw new DomainError("O forno não comporta as pizzas neste horário. Escolha outro horário.");
  }
}
