import { restaurantSchema, type Restaurant } from "./restaurantModel.ts";
import type { CartLine, Product, Tenant, Order } from "./model.ts";
import { DomainError } from "./errors.ts";
import { pricePizza, pizzaFlavorAvailable } from "./pizza.ts";
import { paymentLedger } from "./payments.ts";
export function extraCostCents(
  extra: Product["extras"][number],
  inventory?: Restaurant["inventory"],
) {
  if (extra.recipe === undefined) return extra.costCents;
  if (!inventory || extra.recipe.some((r) => !inventory.some((i) => i.id === r.ingredientId)))
    return null;
  return Math.round(
    extra.recipe.reduce(
      (sum, r) =>
        sum + r.quantity * inventory.find((i) => i.id === r.ingredientId)!.costPerUnitCents,
      0,
    ),
  );
}
type ComboOption = NonNullable<Product["combo"]>["groups"][number]["options"][number];
export function comboOptionState(option: ComboOption, products: Product[]) {
  const product = products.find((p) => p.id === option.productId);
  const unavailable = (reason: string) => ({
    available: false,
    reason,
    initialPizza: undefined as import("./pizza.ts").PizzaSelection | undefined,
    minimumExtraCents: 0,
  });
  if (!product || product.status !== "Disponível" || product.combo)
    return unavailable("Produto indisponível");
  if (!product.pizza)
    return { available: true, reason: "", initialPizza: undefined, minimumExtraCents: 0 };
  const config = product.pizza,
    size = config.sizes.find((s) => s.id === option.sizeId && s.available);
  if (!size) return unavailable("Tamanho indisponível");
  if (!option.customizePizza && config.flavors.length !== 1)
    return unavailable("Ative a montagem de sabores neste combo");
  let best: { selection: import("./pizza.ts").PizzaSelection; extra: number } | undefined;
  for (const f of config.flavors.filter((f) => pizzaFlavorAvailable(config, f, size.id)))
    for (const d of config.doughs.filter((d) => d.available))
      for (const e of config.edges.filter((e) => e.available)) {
        const selection = {
          sizeId: size.id,
          flavorIds: [f.id],
          flavorCount: 1,
          doughId: d.id,
          edgeId: e.id,
        };
        try {
          const priced = pricePizza(config, selection);
          const candidate = {
            selection,
            extra: d.priceCents + e.priceCents + priced.customCents,
          };
          if (!option.customizePizza)
            return { available: true, reason: "", initialPizza: selection, minimumExtraCents: 0 };
          if (!best || candidate.extra < best.extra) best = candidate;
        } catch (error) {
          if (!(error instanceof DomainError)) throw error;
        }
      }
  if (!best) return unavailable("Sem massa, borda ou sabor compatível");
  return {
    available: true,
    reason: "",
    initialPizza: best.selection,
    minimumExtraCents: best.extra,
  };
}

export function restaurant(t: Tenant): Restaurant {
  return (t.restaurant ??= restaurantSchema.parse({}));
}
export function comboLines(line: CartLine, products: Product[], available = true): CartLine[] {
  const p = products.find((p) => p.id === line.productId);
  if (!p?.combo) {
    if (line.comboChoices?.length) throw new DomainError("Este produto não é um combo.");
    return [];
  }
  const choices = line.comboChoices || [];
  if (
    choices.length !== p.combo.groups.length ||
    new Set(choices.map((c) => c.groupId)).size !== choices.length
  )
    throw new DomainError("Escolha uma opção para cada grupo do combo.");
  return p.combo.groups.map((group) => {
    const choice = choices.find((c) => c.groupId === group.id);
    const option = group.options.find((o) => o.productId === choice?.productId);
    const child = products.find(
      (p) => p.id === option?.productId && (!available || p.status === "Disponível"),
    );
    if (!option || !child || child.combo || child.id === p.id)
      throw new DomainError(`Uma opção de ${group.name} ficou indisponível.`);
    let pizza: import("./pizza.ts").PizzaSelection | undefined;
    if (child.pizza) {
      const c = child.pizza;
      if (!option.customizePizza && c.flavors.length !== 1)
        throw new DomainError("Combos devem usar pizzas individuais, com um sabor cadastrado.");
      const size = c.sizes.find((s) => s.id === option.sizeId && (!available || s.available));
      if (!size) throw new DomainError("Defina um tamanho disponível para a pizza do combo.");
      pizza = {
        sizeId: size.id,
        flavorIds: [c.flavors[0].id],
        flavorCount: 1,
        doughId:
          c.doughs.find(
            (d) =>
              d.available &&
              (!d.allowedSizeIds || d.allowedSizeIds.includes(size.id)) &&
              (!d.allowedFlavorKinds ||
                d.allowedFlavorKinds.includes(c.flavors[0].kind || "savory")),
          )?.id || "",
        edgeId:
          c.edges.find(
            (e) =>
              e.available &&
              (!e.allowedSizeIds || e.allowedSizeIds.includes(size.id)) &&
              (!e.allowedFlavorKinds ||
                e.allowedFlavorKinds.includes(c.flavors[0].kind || "savory")),
          )?.id || "",
      };
      if (available) {
        const state = comboOptionState(option, products);
        if (!state.available) throw new DomainError(state.reason);
        if (option.customizePizza) {
          if (!choice?.pizza) throw new DomainError(`Monte a pizza de ${group.name}.`);
          if (choice.pizza.sizeId !== option.sizeId)
            throw new DomainError("O tamanho da pizza não está incluído neste combo.");
          pizza = choice.pizza;
          pricePizza(c, pizza);
        } else {
          if (choice?.pizza) throw new DomainError("Esta opção do combo não permite montagem.");
          pizza = state.initialPizza!;
        }
      }
    } else if (choice?.pizza) throw new DomainError("Este item do combo não é uma pizza.");
    return {
      key: `${line.key}-${group.id}`,
      productId: child.id,
      quantity: group.quantity,
      extraIds: [],
      removedIngredients: [],
      notes: "",
      ...(pizza ? { pizza } : {}),
    };
  });
}
export function comboStartingPrice(product: Product, products: Product[]) {
  if (!product.combo) return product.priceCents;
  const amounts = product.combo.groups.map((g) =>
    g.options
      .map((o) => ({ o, state: comboOptionState(o, products) }))
      .filter((v) => v.state.available)
      .map(({ o, state }) => o.surchargeCents + state.minimumExtraCents * g.quantity),
  );
  if (amounts.some((a) => !a.length)) return null;
  return (
    product.priceCents +
    amounts.reduce((sum, values) => sum + (values.length ? Math.min(...values) : 0), 0)
  );
}
export function comboCustomizationCents(line: CartLine, products: Product[]) {
  const p = products.find((p) => p.id === line.productId);
  if (!p?.combo) return 0;
  return p.combo.groups.reduce((sum, g) => {
    const choice = line.comboChoices?.find((c) => c.groupId === g.id),
      o = g.options.find((o) => o.productId === choice?.productId),
      child = products.find((p) => p.id === o?.productId);
    if (!o?.customizePizza || !child?.pizza || !choice?.pizza) return sum;
    const priced = pricePizza(child.pizza, choice.pizza);
    return (
      sum + g.quantity * (priced.dough.priceCents + priced.edge.priceCents + priced.customCents)
    );
  }, 0);
}
export function pizzaUnitsForLines(lines: CartLine[], products: Product[]): number {
  return lines.reduce((sum, line) => {
    const p = products.find((p) => p.id === line.productId);
    return (
      sum +
      (p?.combo
        ? pizzaUnitsForLines(comboLines(line, products), products) * line.quantity
        : p?.category === "Pizza"
          ? line.quantity
          : 0)
    );
  }, 0);
}
export function lineRecipe(
  line: CartLine,
  products: Product[],
): { ingredientId: string; quantity: number }[] {
  const p = products.find((p) => p.id === line.productId);
  if (!p) throw new DomainError("Produto da ficha técnica não encontrado.");
  if (p.combo)
    return [
      ...(p.recipe || []).map((r) => ({ ...r, quantity: r.quantity * line.quantity })),
      ...comboLines(line, products).flatMap((c) =>
        lineRecipe(c, products).map((r) => ({ ...r, quantity: r.quantity * line.quantity })),
      ),
    ];
  let rows = [...(p.recipe || [])];
  const generalExtras = line.extraIds.flatMap(
    (id) => p.extras.find((e) => e.id === id)?.recipe || [],
  );
  if (p.pizza && line.pizza) {
    const c = p.pizza,
      s = line.pizza;
    const weights = s.portions || s.flavorIds.map(() => 1);
    const denominator = weights.reduce((a, b) => a + b, 0);
    rows = [...(p.recipe || [])];
    for (let i = 0; i < s.flavorIds.length; i++) {
      const f = c.flavors.find((f) => f.id === s.flavorIds[i]);
      const custom = s.customizations?.find((v) => v.flavorId === f?.id);
      for (const r of f?.recipeBySize?.[s.sizeId] || [])
        rows.push({ ...r, quantity: (r.quantity * weights[i]) / denominator });
      // Removals do not reduce the recipe automatically: quantities must remain conservative.
      for (const e of f?.extras || [])
        if (custom?.extraIds.includes(e.id)) rows.push(...(e.recipe || []));
    }
    rows.push(
      ...(c.doughs.find((o) => o.id === s.doughId)?.recipe || []),
      ...(c.edges.find((o) => o.id === s.edgeId)?.recipe || []),
    );
  }
  const totals = new Map<string, number>();
  rows.push(...generalExtras);
  for (const r of rows)
    totals.set(r.ingredientId, (totals.get(r.ingredientId) || 0) + r.quantity * line.quantity);
  return [...totals].map(([ingredientId, quantity]) => ({
    ingredientId,
    quantity: Math.round(quantity * 10000) / 10000,
  }));
}
export function recipeCost(
  line: CartLine,
  products: Product[],
  inventory?: Restaurant["inventory"],
): number | null {
  const p = products.find((p) => p.id === line.productId);
  if (!p || !inventory || (!p.recipe?.length && !p.pizza && !p.combo)) return null;
  if (p.pizza && line.pizza) {
    const s = line.pizza;
    if (
      !s.flavorIds.every(
        (id) => p.pizza!.flavors.find((f) => f.id === id)?.recipeBySize?.[s.sizeId]?.length,
      )
    )
      return null;
    if (
      !p.pizza.doughs.find((d) => d.id === s.doughId)?.recipe?.length ||
      !p.pizza.edges.find((d) => d.id === s.edgeId)?.recipe
    )
      return null;
    if (
      s.customizations?.some((v) =>
        v.extraIds.some(
          (id) =>
            !p.pizza!.flavors.find((f) => f.id === v.flavorId)?.extras?.find((e) => e.id === id)
              ?.recipe?.length,
        ),
      )
    )
      return null;
  }
  if (p.combo) {
    const children = comboLines(line, products);
    const costs = children.map((c) => recipeCost(c, products, inventory));
    const common = (p.recipe || []).reduce(
      (sum, r) =>
        sum + r.quantity * (inventory.find((i) => i.id === r.ingredientId)?.costPerUnitCents || 0),
      0,
    );
    if (p.recipe?.some((r) => !inventory.some((i) => i.id === r.ingredientId))) return null;
    return costs.some((c) => c === null)
      ? null
      : Math.round(
          common + costs.reduce<number>((sum, c, i) => sum + c! * children[i].quantity, 0),
        );
  }
  const recipe = lineRecipe({ ...line, quantity: 1, extraIds: [] }, products);
  if (!recipe.length) return null;
  let total = 0;
  for (const r of recipe) {
    const item = inventory.find((i) => i.id === r.ingredientId);
    if (!item) return null;
    total += r.quantity * item.costPerUnitCents;
  }
  const cost = Math.round(total);
  if (!Number.isSafeInteger(cost) || cost > 100_000_000)
    throw new DomainError("O custo da ficha ultrapassa o limite permitido.");
  return cost;
}
export function mergeStockUsage(rows: NonNullable<Order["stockUsage"]>) {
  const sums = new Map<string, number>();
  for (const row of rows)
    sums.set(row.ingredientId, (sums.get(row.ingredientId) || 0) + row.quantity);
  return [...sums]
    .map(([ingredientId, quantity]) => ({
      ingredientId,
      quantity: Math.round(quantity * 10000) / 10000,
    }))
    .filter((row) => row.quantity > 0);
}
export function reserveStock(t: Tenant, lines: CartLine[], order: Order, now: string) {
  if (!t.restaurant) return;
  const r = restaurant(t),
    totals = new Map<string, number>();
  for (const [index, line] of lines.entries()) {
    const usage = mergeStockUsage(lineRecipe(line, t.products));
    order.lines[index].stockUsage = usage;
    for (const row of usage)
      totals.set(row.ingredientId, (totals.get(row.ingredientId) || 0) + row.quantity);
  }
  for (const [id, quantity] of totals) {
    const item = r.inventory.find((i) => i.id === id);
    if (!item || item.stock + 0.00001 < quantity)
      throw new DomainError(
        `Estoque insuficiente: ${item?.name || "ingrediente da ficha técnica"}.`,
      );
  }
  order.stockUsage = [...totals].map(([ingredientId, quantity]) => ({ ingredientId, quantity }));
  for (const usage of order.stockUsage) {
    const item = r.inventory.find((i) => i.id === usage.ingredientId)!;
    item.stock = Math.max(0, item.stock - usage.quantity);
    r.movements.push({
      id: crypto.randomUUID(),
      ...usage,
      quantity: -usage.quantity,
      reason: `Pedido ${order.number}`,
      at: now,
      orderId: order.id,
    });
  }
}
export function restoreStock(t: Tenant, order: Order, now: string) {
  if (!t.restaurant || !order.stockUsage?.length) return;
  for (const usage of order.stockUsage) {
    const item = t.restaurant.inventory.find((i) => i.id === usage.ingredientId);
    if (item) {
      item.stock += usage.quantity;
      t.restaurant.movements.push({
        id: crypto.randomUUID(),
        ...usage,
        reason: `Cancelamento ${order.number}`,
        at: now,
        orderId: order.id,
      });
    }
  }
}
export function validateSchedule(
  t: Tenant,
  scheduledAt: string | undefined,
  now: Date,
  lines: CartLine[] = [],
) {
  if (!scheduledAt) return;
  const r = t.restaurant?.scheduling;
  const at = new Date(scheduledAt),
    delta = at.getTime() - now.getTime();
  if (
    !r?.enabled ||
    !Number.isFinite(delta) ||
    delta < r.leadMinutes * 60000 ||
    delta > r.days * 86400000
  )
    throw new DomainError("Horário agendado fora do período permitido.");
  // Bahia has a fixed UTC−3 offset; slots are anchored to local midnight.
  const local = new Date(at.getTime() - 3 * 3600000),
    minute = local.getUTCHours() * 60 + local.getUTCMinutes();
  if (minute % r.slotMinutes || at.getUTCSeconds() || at.getUTCMilliseconds())
    throw new DomainError(`Escolha um horário em intervalos de ${r.slotMinutes} minutos.`);
  if (t.settings.scheduleEnabled) {
    const day = local.getUTCDay(),
      prev = (day + 6) % 7;
    const mins = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3));
    const today = t.settings.hours.find((h) => h.day === day),
      yesterday = t.settings.hours.find((h) => h.day === prev);
    if (
      !(
        today?.enabled &&
        (mins(today.open) < mins(today.close)
          ? minute >= mins(today.open) && minute < mins(today.close)
          : minute >= mins(today.open))
      ) &&
      !(
        yesterday?.enabled &&
        mins(yesterday.open) >= mins(yesterday.close) &&
        minute < mins(yesterday.close)
      )
    )
      throw new DomainError("Agende dentro do horário de atendimento da loja.");
  }
  if (
    t.orders.filter((o) => o.status !== "Cancelado" && o.scheduledAt === at.toISOString()).length >=
    r.capacity
  )
    throw new DomainError("Este horário está lotado. Escolha outro.");
  if (r.pizzaCapacity) {
    const occupied = t.orders
      .filter((o) => o.status !== "Cancelado" && o.scheduledAt === at.toISOString())
      .reduce((sum, o) => {
        if (o.pizzaUnits !== undefined) return sum + o.pizzaUnits;
        // Old orders did not snapshot combo quantities. Never silently treat them as zero load.
        if (
          !o.lines.length ||
          o.lines.some(
            (l) =>
              l.selection?.comboChoices?.length ||
              (!l.selection?.pizza && !t.products.some((p) => p.id === l.productId && !p.combo)),
          )
        )
          throw new DomainError(
            "Este horário tem um pedido antigo sem contagem de pizzas. Revise o pedido ou escolha outro horário.",
          );
        return (
          sum +
          o.lines.reduce(
            (n, l) =>
              n +
              (l.selection?.pizza ||
              t.products.find((p) => p.id === l.productId)?.category === "Pizza"
                ? l.quantity
                : 0),
            0,
          )
        );
      }, 0);
    if (occupied + pizzaUnitsForLines(lines, t.products) > r.pizzaCapacity)
      throw new DomainError("A capacidade de pizzas deste horário foi atingida. Escolha outro.");
  }
}
export function cashSummary(t: Tenant, session: Restaurant["cashSessions"][number]) {
  if (session.closedAt && session.receipts && session.expectedCents != null)
    return { receipts: session.receipts, expectedCents: session.expectedCents };
  const receipts: Record<string, number> = {};
  for (const o of t.orders)
    if (!o.demo) {
      if (o.payments) {
        for (const p of paymentLedger(o)) {
          const legacyWithinSession =
            p.id.startsWith("legacy-") &&
            p.cashSessionId === "unassigned" &&
            p.at >= session.openedAt &&
            (!session.closedAt || p.at <= session.closedAt);
          if (p.cashSessionId !== session.id && !legacyWithinSession) continue;
          receipts[p.method] =
            (receipts[p.method] || 0) + (p.kind === "receipt" ? p.amountCents : -p.amountCents);
        }
        continue;
      }
      for (const e of o.history) {
        if (e.cashSessionId && e.cashSessionId !== session.id) continue;
        if (
          e.kind !== "payment" ||
          e.at < session.openedAt ||
          (session.closedAt && e.at > session.closedAt)
        )
          continue;
        const delta = e.to === "Pago" ? o.totalCents : e.to === "Estornado" ? -o.totalCents : 0;
        receipts[o.paymentMethod] = (receipts[o.paymentMethod] || 0) + delta;
      }
    }
  const movements = session.movements.reduce(
    (sum, m) => sum + (m.kind === "supply" ? m.amountCents : -m.amountCents),
    0,
  );
  return { receipts, expectedCents: session.openingCents + (receipts.Dinheiro || 0) + movements };
}
