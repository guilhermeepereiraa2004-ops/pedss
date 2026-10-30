import type { Order } from "./model.ts";
import type { z } from "zod";
import { paymentEntrySchema } from "./restaurantModel.ts";
import { DomainError } from "./errors.ts";
type Payment = z.infer<typeof paymentEntrySchema>;
export function paymentLedger(order: Order): Payment[] {
  if (order.payments) return order.payments;
  const entries = order.history
    .filter((e) => e.kind === "payment" && ["Pago", "Estornado"].includes(e.to))
    .map((e) => ({
      id: `legacy-${e.id}`,
      requestId: `legacy-${e.id}`,
      kind: e.to === "Pago" ? ("receipt" as const) : ("refund" as const),
      amountCents: order.totalCents,
      method: order.paymentMethod,
      at: e.at,
      actor: e.actor,
      cashSessionId: e.cashSessionId || "unassigned",
    }));
  if (!entries.length && order.paymentStatus === "Pago")
    entries.push({
      id: `legacy-${order.id}`,
      requestId: `legacy-${order.id}`,
      kind: "receipt",
      amountCents: order.totalCents,
      method: order.paymentMethod,
      at: order.updatedAt,
      actor: "Registro anterior",
      cashSessionId: "unassigned",
    });
  return entries;
}
export function paidCents(order: Order) {
  return Math.max(
    0,
    paymentLedger(order).reduce(
      (sum, e) => sum + (e.kind === "receipt" ? e.amountCents : -e.amountCents),
      0,
    ),
  );
}
export function dueCents(order: Order) {
  return Math.max(0, order.totalCents - paidCents(order));
}
export function refundableCents(order: Order) {
  return order.status === "Cancelado"
    ? paidCents(order)
    : Math.max(0, paidCents(order) - order.totalCents);
}
export function appendPayment(
  order: Order,
  input: { requestId: string; kind: "receipt" | "refund"; amountCents: number; method: string },
  actor: string,
  cashSessionId: string,
  reason: string,
): Order {
  const payments = paymentLedger(order);
  if (payments.some((p) => p.requestId === input.requestId)) return order;
  if (
    !Number.isSafeInteger(input.amountCents) ||
    input.amountCents <= 0 ||
    input.amountCents > 100_000_000
  )
    throw new DomainError("Informe um valor positivo em centavos.");
  if (
    input.kind === "receipt" &&
    (order.status === "Cancelado" || input.amountCents > dueCents(order))
  )
    throw new DomainError("Recebimento maior que o saldo ou pedido cancelado.");
  if (
    input.kind === "refund" &&
    (input.amountCents > refundableCents(order) || reason.trim().length < 3)
  )
    throw new DomainError("Estorne somente o saldo a devolver do pedido e informe o motivo.");
  const at = new Date(Math.max(Date.now(), Date.parse(order.updatedAt) + 1)).toISOString();
  const next = [
    ...payments,
    {
      requestId: input.requestId,
      kind: input.kind,
      amountCents: input.amountCents,
      method: input.method,
      id: crypto.randomUUID(),
      at,
      actor,
      cashSessionId,
    },
  ];
  const net = next.reduce(
    (sum, p) => sum + (p.kind === "receipt" ? p.amountCents : -p.amountCents),
    0,
  );
  const paymentStatus =
    net >= order.totalCents && order.totalCents > 0
      ? "Pago"
      : net === 0 && input.kind === "refund"
        ? "Estornado"
        : "Pendente";
  return {
    ...order,
    payments: next,
    paymentStatus,
    updatedAt: at,
    history: [
      ...order.history,
      {
        id: crypto.randomUUID(),
        at,
        actor,
        kind: "payment",
        from: order.paymentStatus,
        to: paymentStatus,
        reason: `${reason.trim()} · ${input.kind === "receipt" ? "Recebido" : "Estornado"} ${(input.amountCents / 100).toFixed(2)} (${input.method})`,
        cashSessionId,
      },
    ],
  };
}
