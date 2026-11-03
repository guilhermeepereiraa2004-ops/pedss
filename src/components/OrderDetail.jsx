import { useState } from "react";
import { Check, ArrowUpRight } from "lucide-react";
import OrderPrint from "./OrderPrint";
import { nextStatuses } from "../core/domain.ts";
import { money } from "../lib/data";
import { orderActionLabel, orderStatusLabel } from "../lib/orderActions";
import { paidCents, dueCents, paymentLedger, refundableCents } from "../core/payments.ts";
import { editableOrder, cancellableOrderItem } from "../core/orderAmendments.ts";
import "./OrderItemChange.css";
import PaymentReceipt from "./PaymentReceipt";
const addressText = (a) =>
  [
    a.street,
    a.number,
    a.neighborhood,
    a.complement,
    a.reference,
    a.postalCode && `CEP ${a.postalCode}`,
  ]
    .filter(Boolean)
    .join(", ");
export default function OrderDetail({
  order,
  storeName = "",
  canFinance,
  onTransition,
  onPayment,
  onPartialPayment,
  paymentMethods = [],
  error,
  busy,
  onEditItem,
  onCancelItem,
}) {
  const [reason, setReason] = useState("");
  const statuses = nextStatuses(order);
  return (
    <div className="order-detail">
      <div className="order-detail-top">
        {order.scheduledAt && (
          <p className="notice">
            Agendado:{" "}
            {new Date(order.scheduledAt).toLocaleString("pt-BR", { timeZone: "America/Bahia" })}
          </p>
        )}
        {order.tableName && <span className="tag">{order.tableName}</span>}
        {order.channel && order.channel !== "site" && (
          <span className="tag">
            {{ counter: "Balcão", phone: "Telefone", table: "Mesa" }[order.channel]}
          </span>
        )}
        <span className="tag">{orderStatusLabel(order)}</span>
        <span
          className={`tag ${order.paymentStatus === "Pago" ? "" : order.paymentStatus === "Estornado" ? "danger" : "warning"}`}
        >
          Pagamento: {order.paymentStatus}
        </span>
      </div>
      <div className="order-primary-actions">
        {statuses
          .filter((s) => s !== "Cancelado")
          .map((s) => (
            <button
              key={s}
              className="button button-dark"
              disabled={busy}
              onClick={() => onTransition(s, reason)}
            >
              {orderActionLabel(order, s)} <ArrowUpRight size={17} />
            </button>
          ))}
      </div>
      <div className="detail-customer">
        <strong>{order.customer.name}</strong>
        {order.customer.phone && <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>}
        <span>
          {order.channel === "table"
            ? "Consumo na mesa: "
            : order.fulfillment === "pickup"
              ? "Retirada: "
              : "Entrega: "}
          {addressText(order.address)}
        </span>
        {order.deliveryArea && <small>Área: {order.deliveryArea}</small>}
      </div>
      <div className="order-lines">
        {order.lines.length ? (
          order.lines.map((line, i) => (
            <div key={`${line.productId}-${i}`}>
              <div>
                <strong>
                  {line.quantity} × {line.name}
                </strong>
                <span>{money(line.totalCents / 100)}</span>
              </div>
              <small>Unidade com adicionais: {money(line.unitPriceCents / 100)}</small>
              {line.pizzaSummary && <small>{line.pizzaSummary}</small>}
              {line.extras.length > 0 && (
                <small>Adicionais: {line.extras.map((e) => e.name).join(", ")}</small>
              )}
              {line.removedIngredients.length > 0 && (
                <small>Sem: {line.removedIngredients.join(", ")}</small>
              )}
              {line.notes && <small>Observação: {line.notes}</small>}
              <div className="order-line-actions">
                {onEditItem && editableOrder(order) && (
                  <button
                    type="button"
                    className="button button-outline button-small"
                    disabled={busy}
                    onClick={() => onEditItem(i)}
                  >
                    Editar item {i + 1}
                  </button>
                )}
                {onCancelItem && cancellableOrderItem(order) && (
                  <button
                    type="button"
                    className="button button-outline button-small"
                    disabled={busy}
                    onClick={() => onCancelItem(i)}
                  >
                    Cancelar item {i + 1}
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>
            {order.legacyItems ||
              (order.amendments?.length
                ? "Todos os itens foram cancelados."
                : "Pedido legado: composição original preservada em texto.")}
          </p>
        )}
      </div>
      {order.notes && <p className="notice">Observações: {order.notes}</p>}
      <div className="cart-totals">
        <div>
          <span>Produtos</span>
          <span>{money(order.subtotalCents / 100)}</span>
        </div>
        <div>
          <span>Entrega</span>
          <span>{money(order.deliveryFeeCents / 100)}</span>
        </div>
        {order.coupon && (
          <div>
            <span>Cupom {order.coupon.code}</span>
            <span>−{money(order.coupon.discountCents / 100)}</span>
          </div>
        )}
        <div className="total-line">
          <strong>Total</strong>
          <strong>{money(order.totalCents / 100)}</strong>
        </div>
      </div>
      <div className="notice small-copy">
        Pagamento escolhido: {order.paymentMethod}
        {order.changeForCents !== null && (
          <>
            . Troco para {money(order.changeForCents / 100)}; devolver{" "}
            {money((order.changeForCents - order.totalCents) / 100)}.
          </>
        )}{" "}
        O registro abaixo é manual e não movimenta dinheiro.
      </div>
      {canFinance && onPartialPayment && (
        <section className="panel form-stack">
          <h3>Recebimentos do pedido</h3>
          <p>
            Recebido líquido: {money(paidCents(order) / 100)} · Falta:{" "}
            {money(dueCents(order) / 100)}
          </p>
          {paymentLedger(order).map((p) => (
            <p key={p.id}>
              {p.kind === "receipt" ? "Recebimento" : "Estorno"} · {money(p.amountCents / 100)} ·{" "}
              {p.method} · {new Date(p.at).toLocaleString("pt-BR")}
            </p>
          ))}
          {refundableCents(order) > 0 && (
            <p className="notice">
              Saldo a devolver ao cliente: {money(refundableCents(order) / 100)}. Registre somente
              após conferir a devolução realizada.
            </p>
          )}
          {((order.status !== "Cancelado" && dueCents(order) > 0) ||
            refundableCents(order) > 0) && (
            <PaymentReceipt
              key={`${order.id}-${order.status}-${order.totalCents}-${paidCents(order)}`}
              maximum={refundableCents(order) > 0 ? refundableCents(order) : dueCents(order)}
              methods={[...new Set([...paymentMethods, order.paymentMethod])]}
              refund={refundableCents(order) > 0}
              label={
                refundableCents(order) > 0
                  ? "Valor devolvido ao cliente (R$)"
                  : "Valor recebido (R$)"
              }
              busy={busy}
              onSubmit={onPartialPayment}
            />
          )}
        </section>
      )}
      {(statuses.includes("Cancelado") ||
        (canFinance && order.paymentStatus === "Pago" && order.status === "Cancelado")) && (
        <label className="field reason-field">
          Motivo de cancelamento / estorno
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            placeholder="Descreva o motivo antes de confirmar."
          />
        </label>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="order-action-list">
        {statuses.includes("Cancelado") && (
          <button
            className="button button-outline"
            disabled={busy || reason.trim().length < 3}
            onClick={() => onTransition("Cancelado", reason)}
          >
            Cancelar pedido
          </button>
        )}
        {canFinance && order.paymentStatus === "Pendente" && order.status !== "Cancelado" && (
          <button
            className="button button-lime"
            disabled={busy}
            onClick={() => onPayment("Pago", "Recebimento conferido manualmente")}
          >
            Registrar recebimento <Check size={14} />
          </button>
        )}
        {canFinance && order.paymentStatus === "Pago" && order.status === "Cancelado" && (
          <button
            className="button button-outline"
            disabled={busy || reason.trim().length < 3}
            onClick={() => onPayment("Estornado", reason)}
          >
            Registrar estorno manual
          </button>
        )}
      </div>
      <OrderPrint order={order} storeName={storeName} />
      {!!order.amendments?.length && (
        <section className="order-amendment-log" aria-label="Alterações dos itens">
          <h3>Alterações dos itens</h3>
          {order.amendments.map((a) => (
            <details key={a.id}>
              <summary>
                {a.kind === "edit" ? "Alteração" : "Cancelamento"}: {a.before.name} · {a.actor}
              </summary>
              <p>
                {new Date(a.at).toLocaleString("pt-BR", { timeZone: "America/Bahia" })} · {a.reason}
              </p>
              <p>
                Antes: {a.before.quantity} × {a.before.name} · {a.before.pizzaSummary} ·{" "}
                {money(a.before.totalCents / 100)}
              </p>
              <p>
                Depois:{" "}
                {a.after
                  ? `${a.after.quantity} × ${a.after.name} · ${a.after.pizzaSummary || ""} · ${money(a.after.totalCents / 100)}`
                  : "Item removido"}
              </p>
              <p>
                Total do pedido: {money(a.beforeTotalCents / 100)} →{" "}
                {money(a.afterTotalCents / 100)}
              </p>
              <p>
                Ingredientes anteriores:{" "}
                {a.stockDisposition === "return"
                  ? "devolvidos ao estoque"
                  : "baixa mantida como perda"}
                {canFinance && a.stockDisposition === "waste"
                  ? ` · ${a.wasteCostCents === null ? "custo desconhecido" : money(a.wasteCostCents / 100)}`
                  : ""}
                .
              </p>
            </details>
          ))}
        </section>
      )}
      <div className="order-history">
        <h3>Histórico do pedido</h3>
        {order.history.map((event) => (
          <div key={event.id}>
            <span className="history-point" />
            <div>
              <strong>
                {event.kind === "payment" ? "Pagamento: " : ""}
                {event.to}
              </strong>
              <small>
                {new Date(event.at).toLocaleString("pt-BR", { timeZone: "America/Bahia" })} ·{" "}
                {event.actor}
              </small>
              {event.reason && <p>{event.reason}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
