import type { Company, Order, Tenant } from "./model.ts";
import { localDay, shiftDay } from "./calendar.ts";
import { paymentLedger } from "./payments.ts";

function paymentEvents(order: Order) {
  if (order.payments)
    return paymentLedger(order).map((p) => ({
      day: localDay(p.at),
      value: p.kind === "receipt" ? p.amountCents : -p.amountCents,
    }));
  const events = order.history.filter(
    (h) => h.kind === "payment" && ["Pago", "Estornado"].includes(h.to),
  );
  if (events.length)
    return events.map((e) => ({
      day: localDay(e.at),
      value: e.to === "Pago" ? order.totalCents : -order.totalCents,
    }));
  return order.paymentStatus === "Pago"
    ? [{ day: localDay(order.updatedAt), value: order.totalCents }]
    : [];
}
export function businessOverview(company: Company, tenant: Tenant, now = new Date()) {
  const today = localDay(now),
    month = today.slice(0, 7);
  const orders = tenant.orders.filter((o) => !o.demo),
    expenses = tenant.expenses.filter((e) => !e.voided);
  const entries = orders.flatMap((o) => paymentEvents(o));
  const revenueFor = (prefix: string) =>
    entries.filter((e) => e.day.startsWith(prefix)).reduce((sum, e) => sum + e.value, 0);
  const expenseFor = (prefix: string) =>
    expenses.filter((e) => e.paidOn.startsWith(prefix)).reduce((sum, e) => sum + e.amountCents, 0);
  const created = orders.filter((o) => localDay(o.createdAt).startsWith(month));
  const sales = orders.filter(
    (o) =>
      o.status !== "Cancelado" &&
      o.paymentStatus === "Pago" &&
      (o.payments
        ? localDay(
            paymentLedger(o)
              .filter((p) => p.kind === "receipt")
              .at(-1)?.at || o.updatedAt,
          ).startsWith(month)
        : paymentEvents(o).some((e) => e.value >= 0 && e.day.startsWith(month))),
  );
  const revenueCents = revenueFor(month),
    expenseCents = expenseFor(month);
  const productMap = new Map(
    tenant.products.map((p) => [p.id, { id: p.id, name: p.name, quantity: 0, revenueCents: 0 }]),
  );
  const customers = new Map<
    string,
    {
      name: string;
      phone: string;
      revenueCents: number;
      grossMarginCents: number;
      complete: boolean;
      orders: number;
    }
  >();
  let costedSales = 0,
    unitemizedSales = 0;
  for (const order of sales) {
    for (const line of order.lines) {
      const p = productMap.get(line.productId) || {
        id: line.productId,
        name: line.name,
        quantity: 0,
        revenueCents: 0,
      };
      p.quantity += line.quantity;
      p.revenueCents += line.totalCents;
      productMap.set(p.id, p);
    }
    const complete = order.lines.length > 0 && order.lines.every((l) => l.unitCostCents !== null);
    if (complete) costedSales++;
    if (!order.lines.length) unitemizedSales++;
    const key = order.customer.phone || `legacy-${order.id}`;
    const customer = customers.get(key) || {
      name: order.customer.name,
      phone: order.customer.phone,
      revenueCents: 0,
      grossMarginCents: 0,
      complete: true,
      orders: 0,
    };
    customer.revenueCents += order.totalCents;
    customer.orders++;
    customer.complete &&= complete;
    customer.grossMarginCents +=
      order.subtotalCents -
      (order.coupon?.discountCents || 0) -
      order.lines.reduce((sum, l) => sum + (l.unitCostCents || 0) * l.quantity, 0);
    customers.set(key, customer);
  }
  const ranking = [...productMap.values()];
  const mostSold =
    ranking
      .filter((p) => p.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))[0] || null;
  const leastSold =
    ranking.sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name))[0] || null;
  const customerList = [...customers.values()];
  const topCustomer =
    customerList.length && customerList.every((c) => c.complete)
      ? customerList.sort((a, b) => b.grossMarginCents - a.grossMarginCents)[0]
      : null;
  const topRevenueCustomer =
    [...customers.values()].sort((a, b) => b.revenueCents - a.revenueCents)[0] || null;
  const sevenDays = Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(today, i - 6);
    return {
      day,
      revenueCents: revenueFor(day),
      expenseCents: expenseFor(day),
      balanceCents: revenueFor(day) - expenseFor(day),
    };
  });
  const startDay = localDay(company.createdAt),
    startMonth = startDay && startDay <= today ? startDay.slice(0, 7) : month;
  const months = [];
  let cursor = startMonth;
  while (cursor <= month) {
    months.push({
      month: cursor,
      revenueCents: revenueFor(cursor),
      expenseCents: expenseFor(cursor),
      balanceCents: revenueFor(cursor) - expenseFor(cursor),
    });
    const [y, m] = cursor.split("-").map(Number);
    cursor = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`;
  }
  return {
    month,
    today,
    revenueCents,
    expenseCents,
    balanceCents: revenueCents - expenseCents,
    orderCount: created.length,
    cancelledCount: created.filter((o) => o.status === "Cancelado").length,
    saleCount: sales.length,
    averageTicketCents: sales.length
      ? Math.round(sales.reduce((sum, o) => sum + o.totalCents, 0) / sales.length)
      : 0,
    mostSold,
    leastSold,
    topCustomer,
    topRevenueCustomer,
    costedSales,
    unitemizedSales,
    sevenDays,
    months,
  };
}
export type BusinessOverviewData = ReturnType<typeof businessOverview>;
