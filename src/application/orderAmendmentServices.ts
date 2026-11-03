import { orderItemInputSchema, planOrderItemChange } from "../core/orderAmendments.ts";
import { DomainError, uuid } from "../core/domain.ts";
import { paymentLedger, paidCents } from "../core/payments.ts";
import { assertOvenCapacity } from "../core/pizzeriaOperations.ts";
import type { Identity, Permission, Tenant, Workspace } from "../core/model.ts";
import type { WorkspaceRepository } from "../core/ports.ts";

export function createOrderAmendmentServices(
  repo: WorkspaceRepository,
  permit: (state: Workspace, permission: Permission, id?: string) => Identity,
  tenant: (state: Workspace, id: string) => Tenant,
) {
  return {
    async amendOrderItem(storeId: string, orderId: string, input: unknown) {
      const parsed = orderItemInputSchema.safeParse(input);
      if (!parsed.success)
        throw new DomainError(parsed.error.issues[0]?.message || "Revise a alteração.");
      const data = parsed.data;
      return repo.transact((state) => {
        const actor = permit(state, "orders", storeId),
          t = tenant(state, storeId);
        const index = t.orders.findIndex((o) => o.id === orderId);
        if (index < 0) throw new DomainError("Pedido não encontrado.");
        const order = t.orders[index];
        if (order.amendments?.some((a) => a.requestId === data.requestId)) return order;
        if (order.updatedAt !== data.expectedUpdatedAt)
          throw new DomainError("Este pedido mudou. Feche a revisão e abra o item novamente.");
        const plan = planOrderItemChange(t, order, data);
        if (order.scheduledAt && data.kind === "edit") {
          const config = t.restaurant?.scheduling;
          if (config?.pizzaCapacity) {
            const others = t.orders.filter(
              (o) =>
                o.id !== order.id &&
                o.status !== "Cancelado" &&
                o.scheduledAt === order.scheduledAt,
            );
            if (plan.pizzaUnits === undefined || others.some((o) => o.pizzaUnits === undefined))
              throw new DomainError(
                "Revise a contagem dos pedidos antigos antes de alterar este agendamento.",
              );
            if (
              plan.pizzaUnits + others.reduce((sum, o) => sum + o.pizzaUnits!, 0) >
              config.pizzaCapacity
            )
              throw new DomainError("A capacidade de pizzas deste horário foi atingida.");
          }
          if (config?.ovenSlots && plan.lines.some((l) => !l.pizzaDetails && l.pizzaUnits !== 0))
            throw new DomainError(
              "Revise a reserva de forno dos itens antigos antes de alterar este agendamento.",
            );
          assertOvenCapacity(
            t,
            order.scheduledAt,
            plan.lines.flatMap((l) => l.pizzaDetails || []),
            order.id,
          );
        }
        if (plan.totalCents !== data.expectedTotalCents)
          throw new DomainError("Os valores mudaram. Revise o novo total antes de confirmar.");
        if (paidCents(order) > 0 && plan.totalCents !== order.totalCents)
          permit(state, "finance", storeId);
        const at = new Date(Math.max(Date.now(), Date.parse(order.updatedAt) + 1)).toISOString();
        const payments = paymentLedger(order);
        const next = {
          ...order,
          payments,
          lines: plan.lines,
          subtotalCents: plan.subtotalCents,
          deliveryFeeCents: plan.deliveryFeeCents,
          coupon: plan.coupon,
          totalCents: plan.totalCents,
          pizzaUnits: plan.pizzaUnits,
          stockUsage: plan.nextStockUsage,
          status: plan.status,
          paymentStatus: plan.paymentStatus,
          updatedAt: at,
          changeForCents:
            order.changeForCents !== null && order.changeForCents < plan.totalCents
              ? null
              : order.changeForCents,
          amendments: [
            ...(order.amendments || []),
            {
              id: uuid(),
              requestId: data.requestId,
              at,
              actor: actor.name,
              reason: data.reason,
              kind: data.kind,
              lineIndex: data.lineIndex,
              before: structuredClone(plan.before),
              after: structuredClone(plan.after),
              beforeTotalCents: order.totalCents,
              afterTotalCents: plan.totalCents,
              beforeDiscountCents: order.coupon?.discountCents || 0,
              afterDiscountCents: plan.coupon?.discountCents || 0,
              stockDisposition: data.stockDisposition,
              removedStock: plan.removedStock,
              addedStock: plan.addedStock,
              wasteCostCents: plan.wasteCostCents,
            },
          ],
          history: [
            ...order.history,
            {
              id: uuid(),
              at,
              actor: actor.name,
              kind: "amendment" as const,
              from: order.status,
              to: data.kind === "edit" ? "Item alterado" : "Item cancelado",
              reason: data.reason,
            },
            ...(plan.status !== order.status
              ? [
                  {
                    id: uuid(),
                    at,
                    actor: actor.name,
                    kind: "order" as const,
                    from: order.status,
                    to: plan.status,
                    reason: "Todos os itens foram cancelados",
                  },
                ]
              : []),
          ],
        };
        const movements = [
          ...(data.stockDisposition === "return"
            ? plan.removedStock.map((r) => ({
                ...r,
                reason: `Devolução por alteração ${order.number}`,
              }))
            : []),
          ...plan.addedStock.map((r) => ({
            ...r,
            quantity: -r.quantity,
            reason: `Nova montagem ${order.number}`,
          })),
        ];
        for (const row of movements) {
          const item = t.restaurant!.inventory.find((i) => i.id === row.ingredientId)!;
          item.stock = Math.max(0, Math.round((item.stock + row.quantity) * 10000) / 10000);
          t.restaurant!.movements.push({ ...row, id: uuid(), at, orderId: order.id });
        }
        t.orders[index] = next;
        return next;
      });
    },
  };
}
