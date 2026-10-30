import { z } from "zod";
import { cartLineSchema, type Order, type Tenant } from "./model.ts";
import { DomainError } from "./errors.ts";
import { priceLine } from "./domain.ts";
import { lineRecipe, mergeStockUsage } from "./restaurant.ts";
import { paidCents } from "./payments.ts";

export const orderItemInputSchema = z.object({
  requestId: z.string().min(1).max(120),
  expectedUpdatedAt: z.string().min(1),
  expectedTotalCents: z.number().int().min(0).max(100_000_000),
  kind: z.enum(["edit", "cancel"]),
  lineIndex: z.number().int().min(0).max(99),
  selection: cartLineSchema.optional(),
  cancelQuantity: z.number().int().min(1).max(99).optional(),
  reason: z.string().trim().min(3, "Informe o motivo da alteração.").max(200),
  stockDisposition: z.enum(["return", "waste"]),
});
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type OrderItemDraft = Pick<
  OrderItemInput,
  "kind" | "lineIndex" | "selection" | "cancelQuantity" | "stockDisposition"
>;
type Usage = NonNullable<Order["stockUsage"]>;
const round = (value: number) => Math.round(value * 10000) / 10000;
export function editableOrder(order: Order) {
  return ["Pendente", "Aceito"].includes(order.status);
}
export function cancellableOrderItem(order: Order) {
  return !["Entregue", "Cancelado"].includes(order.status);
}
function combineUsage(before: Usage, removed: Usage, added: Usage): Usage {
  const amounts = new Map(mergeStockUsage(before).map((r) => [r.ingredientId, r.quantity]));
  for (const row of removed) {
    const amount = round((amounts.get(row.ingredientId) || 0) - row.quantity);
    if (amount < -0.00001)
      throw new DomainError("A baixa antiga precisa ser revisada antes de alterar este item.");
    amounts.set(row.ingredientId, Math.max(0, amount));
  }
  for (const row of added)
    amounts.set(row.ingredientId, round((amounts.get(row.ingredientId) || 0) + row.quantity));
  return [...amounts]
    .filter(([, quantity]) => quantity > 0)
    .map(([ingredientId, quantity]) => ({ ingredientId, quantity }));
}
/** Pure preview, repeated by the service with authoritative catalog/prices and a version check. */
export function planOrderItemChange(tenant: Tenant, order: Order, draft: OrderItemDraft) {
  if (!cancellableOrderItem(order))
    throw new DomainError("Este pedido já foi concluído ou cancelado.");
  if (draft.kind === "edit" && !editableOrder(order))
    throw new DomainError("Edite os itens antes de iniciar o preparo.");
  if (draft.stockDisposition === "return" && !editableOrder(order))
    throw new DomainError(
      "Após iniciar o preparo, mantenha a baixa como perda; não devolva ingredientes ao estoque.",
    );
  if ((order.amendments?.length || 0) >= 500)
    throw new DomainError("O limite de alterações deste pedido foi atingido.");
  const before = order.lines[draft.lineIndex];
  if (!before) throw new DomainError("Item não encontrado. Abra o pedido novamente.");
  if (before.stockUsage === undefined && order.stockUsage?.length)
    throw new DomainError(
      "Este pedido antigo não tem a baixa de estoque separada por item. Use o cancelamento do pedido inteiro para preservar os registros.",
    );
  let after: Order["lines"][number] | null;
  const oldUsage = mergeStockUsage(before.stockUsage || []);
  if (oldUsage.length && !tenant.restaurant && draft.stockDisposition === "return")
    throw new DomainError(
      "O estoque da baixa antiga está indisponível. Revise os registros antes de devolver ingredientes.",
    );
  let removedStock: Usage,
    addedStock: Usage = [];
  let oldUnits = before.pizzaUnits;
  if (
    oldUnits === undefined &&
    (before.selection?.pizza ||
      tenant.products.find((p) => p.id === before.productId && !p.combo)?.category === "Pizza")
  )
    oldUnits = before.quantity;
  if (draft.kind === "edit") {
    if (!draft.selection) throw new DomainError("Confira a nova montagem do item.");
    const selection = cartLineSchema.parse({
      ...draft.selection,
      key: before.selection?.key || draft.selection.key,
    });
    after = priceLine(selection, tenant.products, tenant.restaurant?.inventory);
    addedStock = tenant.restaurant ? mergeStockUsage(lineRecipe(selection, tenant.products)) : [];
    after.stockUsage = addedStock;
    removedStock = structuredClone(oldUsage);
  } else {
    const quantity = draft.cancelQuantity;
    if (!quantity || quantity > before.quantity)
      throw new DomainError("Confira a quantidade que será cancelada.");
    removedStock = oldUsage
      .map((r) => ({ ...r, quantity: round((r.quantity * quantity) / before.quantity) }))
      .filter((r) => r.quantity > 0);
    const remaining = before.quantity - quantity;
    after = remaining
      ? {
          ...structuredClone(before),
          quantity: remaining,
          totalCents: before.unitPriceCents * remaining,
          ...(before.selection
            ? { selection: { ...structuredClone(before.selection), quantity: remaining } }
            : {}),
          stockUsage: combineUsage(oldUsage, removedStock, []),
          ...(oldUnits !== undefined
            ? { pizzaUnits: (oldUnits * remaining) / before.quantity }
            : {}),
        }
      : null;
  }
  const lines = order.lines.flatMap((line, i) =>
    i === draft.lineIndex ? (after ? [after] : []) : [structuredClone(line)],
  );
  const subtotalCents = lines.reduce((sum, l) => sum + l.totalCents, 0);
  const coupon =
    order.coupon && subtotalCents >= (order.coupon.minSubtotalCents || 0) && lines.length
      ? {
          ...order.coupon,
          discountCents: Math.min(
            subtotalCents,
            order.coupon.kind === "percent"
              ? Math.round((subtotalCents * order.coupon.value) / 100)
              : order.coupon.value,
          ),
        }
      : null;
  const deliveryFeeCents = lines.length ? order.deliveryFeeCents : 0;
  const totalCents = subtotalCents - (coupon?.discountCents || 0) + deliveryFeeCents;
  if (!Number.isSafeInteger(totalCents) || totalCents > 100_000_000)
    throw new DomainError("O valor do pedido ultrapassa o limite permitido.");
  const pizzaUnits =
    order.pizzaUnits !== undefined && oldUnits !== undefined
      ? order.pizzaUnits - oldUnits + (after?.pizzaUnits || 0)
      : lines.every((l) => l.pizzaUnits !== undefined)
        ? lines.reduce((sum, l) => sum + l.pizzaUnits!, 0)
        : undefined;
  if (order.scheduledAt && tenant.restaurant?.scheduling.pizzaCapacity && draft.kind === "edit") {
    if (pizzaUnits === undefined || order.pizzaUnits === undefined)
      throw new DomainError(
        "Revise a contagem de pizzas deste pedido antigo antes de aumentar a montagem agendada.",
      );
    if (pizzaUnits > order.pizzaUnits) {
      const others = tenant.orders.filter(
        (o) => o.id !== order.id && o.status !== "Cancelado" && o.scheduledAt === order.scheduledAt,
      );
      if (
        others.some((o) => o.pizzaUnits === undefined) ||
        others.reduce((sum, o) => sum + o.pizzaUnits!, 0) + pizzaUnits >
          tenant.restaurant.scheduling.pizzaCapacity
      )
        throw new DomainError("A capacidade de pizzas deste horário foi atingida.");
    }
  }
  const nextStockUsage = combineUsage(order.stockUsage || [], removedStock, addedStock);
  if (tenant.restaurant) {
    const released = draft.stockDisposition === "return" ? removedStock : [];
    for (const row of released)
      if (!tenant.restaurant.inventory.some((i) => i.id === row.ingredientId))
        throw new DomainError("Um ingrediente da baixa antiga não existe mais. Revise o estoque.");
    for (const row of addedStock) {
      const item = tenant.restaurant.inventory.find((i) => i.id === row.ingredientId);
      const credit = released.find((r) => r.ingredientId === row.ingredientId)?.quantity || 0;
      if (!item || item.stock + credit + 0.00001 < row.quantity)
        throw new DomainError(`Estoque insuficiente: ${item?.name || "ingrediente da ficha"}.`);
    }
  }
  const net = paidCents(order);
  return {
    before,
    after,
    removedStock,
    addedStock,
    nextStockUsage,
    lines,
    subtotalCents,
    coupon,
    deliveryFeeCents,
    totalCents,
    pizzaUnits,
    status: lines.length ? order.status : ("Cancelado" as const),
    paymentStatus: (totalCents > 0 && net >= totalCents
      ? "Pago"
      : net === 0 && order.paymentStatus === "Estornado"
        ? "Estornado"
        : "Pendente") as Order["paymentStatus"],
    refundDueCents: Math.max(0, net - totalCents),
    wasteCostCents:
      draft.stockDisposition === "waste"
        ? before.unitCostCents === null
          ? null
          : Math.round(
              before.unitCostCents *
                (draft.kind === "cancel" ? draft.cancelQuantity! : before.quantity),
            )
        : 0,
  };
}
