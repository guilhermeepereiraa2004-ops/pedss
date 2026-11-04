import { ShoppingBag, ArrowUpRight } from "lucide-react";
import { money } from "../lib/data";
import { nextStatuses } from "../core/domain.ts";
import { orderActionLabel, orderStatusLabel } from "../lib/orderActions";
import { paidCents, dueCents } from "../core/payments.ts";
export default function OrdersTable({ orders, onSelect, onAdvance, busy = false }) {
  if (!orders.length)
    return (
      <div className="empty-state">
        <ShoppingBag size={30} />
        <h3>Tudo tranquilo por aqui.</h3>
        <p>Nenhum pedido neste filtro.</p>
      </div>
    );
  return (
    <div className="table-scroll orders-table-scroll">
      <table className="data-table" aria-label="Pedidos da loja">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Itens</th>
            <th>Total</th>
            <th>Operação</th>
            <th>Pagamento</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td data-label="Pedido">
                <strong>{order.number}</strong>
                <small>
                  {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                    timeZone: "America/Bahia",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </td>
              <td data-label="Cliente">
                <strong>{order.customer.name}</strong>
                <small>{order.tableName || order.customer.phone || "Sem telefone"}</small>
              </td>
              <td data-label="Itens" className="order-items-cell">
                <span
                  className="order-items-text"
                  title={
                    order.lines.map((l) => `${l.quantity} × ${l.name}`).join(", ") ||
                    order.legacyItems
                  }
                >
                  {order.lines.map((l) => `${l.quantity} × ${l.name}`).join(", ") ||
                    order.legacyItems}
                </span>
              </td>
              <td data-label="Total">
                <strong>{money(order.totalCents / 100)}</strong>
              </td>
              <td data-label="Operação">
                <span
                  className={`tag ${order.status === "Cancelado" ? "danger" : order.status === "Pendente" ? "warning" : ""}`}
                >
                  {orderStatusLabel(order)}
                </span>
              </td>
              <td data-label="Pagamento">
                <span
                  className={`tag ${order.paymentStatus === "Pago" ? "" : order.paymentStatus === "Estornado" ? "danger" : "neutral"}`}
                >
                  {order.paymentStatus === "Pendente" && paidCents(order) > 0
                    ? "Parcial"
                    : order.paymentStatus}
                </span>
                {order.paymentStatus === "Pendente" && paidCents(order) > 0 && (
                  <small>Falta {money(dueCents(order) / 100)}</small>
                )}
              </td>
              <td className="order-actions-cell">
                {onAdvance &&
                  nextStatuses(order)
                    .filter((s) => s !== "Cancelado")
                    .map((next) => (
                      <button
                        key={next}
                        className="button button-dark button-small"
                        disabled={busy}
                        aria-label={`${orderActionLabel(order, next)} ${order.number}`}
                        onClick={() => onAdvance(order, next)}
                      >
                        {orderActionLabel(order, next)} <ArrowUpRight size={13} />
                      </button>
                    ))}
                <button
                  className="button button-outline button-small"
                  onClick={() => onSelect(order.id)}
                  aria-label={`Detalhes do pedido ${order.number}`}
                >
                  Detalhes <ArrowUpRight size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
