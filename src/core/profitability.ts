import type { Order } from "./model.ts";
import { localDay } from "./calendar.ts";

/** Sales margin uses historical order costs, never the current catalog or cash expenses. */
export function profitability(orders: Order[], from = "", to = "") {
  const rows = orders
    .filter((order) => {
      const day = localDay(order.createdAt);
      return (
        !order.demo &&
        order.status !== "Cancelado" &&
        order.paymentStatus === "Pago" &&
        (!from || day >= from) &&
        (!to || day <= to)
      );
    })
    .map((order) => {
      const complete =
        order.lines.length > 0 &&
        order.lines.reduce((sum, line) => sum + line.totalCents, 0) === order.subtotalCents &&
        order.lines.every(
          (line) =>
            line.unitCostCents != null &&
            Number.isSafeInteger(line.unitCostCents) &&
            line.unitCostCents >= 0,
        );
      const salesCents = order.subtotalCents - (order.coupon?.discountCents || 0);
      const costCents = complete
        ? order.lines.reduce((sum, line) => sum + line.unitCostCents! * line.quantity, 0)
        : null;
      const marginCents = costCents === null ? null : salesCents - costCents;
      return {
        id: order.id,
        number: order.number,
        customer: order.customer.name,
        createdAt: order.createdAt,
        salesCents,
        costCents,
        marginCents,
        marginPercent:
          marginCents === null || salesCents <= 0 ? null : (marginCents / salesCents) * 100,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
  const analyzed = rows.filter((row) => row.costCents !== null);
  const salesCents = rows.reduce((sum, row) => sum + row.salesCents, 0);
  const analyzedSalesCents = analyzed.reduce((sum, row) => sum + row.salesCents, 0);
  const costCents = analyzed.reduce((sum, row) => sum + row.costCents!, 0);
  const marginCents = analyzed.length ? analyzedSalesCents - costCents : null;
  return {
    rows,
    salesCents,
    analyzedSalesCents,
    costCents: analyzed.length ? costCents : null,
    marginCents,
    marginPercent:
      marginCents === null || analyzedSalesCents <= 0
        ? null
        : (marginCents / analyzedSalesCents) * 100,
    analyzedCount: analyzed.length,
    missingCount: rows.length - analyzed.length,
  };
}
