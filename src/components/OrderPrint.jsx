import { useState } from "react";
import { money } from "../lib/data";
import { dueCents, paidCents } from "../core/payments.ts";
import "./OrderPrint.css";
import { orderStatusLabel } from "../lib/orderActions";

export default function OrderPrint({ order, storeName = "" }) {
  const [paper, setPaper] = useState("80"),
    [copy, setCopy] = useState("kitchen");
  const address = [
    order.address.street,
    order.address.number,
    order.address.neighborhood,
    order.address.complement,
    order.address.reference,
    order.address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <div className="order-print-container">
      <div className="order-print-controls">
        <label className="field">
          Via da impressão
          <select value={copy} onChange={(e) => setCopy(e.target.value)}>
            <option value="kitchen">Cozinha</option>
            <option value="customer">Cliente</option>
            <option value="delivery">Entrega</option>
          </select>
        </label>
        <label className="field">
          Papel térmico
          <select value={paper} onChange={(e) => setPaper(e.target.value)}>
            <option value="80">80 mm</option>
            <option value="58">58 mm</option>
          </select>
        </label>
        <button type="button" className="button button-outline" onClick={() => window.print()}>
          Imprimir pedido
        </button>
        <p className="small-copy muted">
          Escolha o mesmo papel no diálogo de impressão. O envio usa o navegador; impressão
          automática e impressora física precisam de configuração local.
        </p>
        <details>
          <summary>Ver prévia da via</summary>
          <div className="receipt-preview">
            <Ticket {...{ order, storeName, copy, address }} />
          </div>
        </details>
      </div>
      <section
        className="thermal-ticket"
        style={{ "--receipt-width": `${paper}mm` }}
        aria-label="Via térmica"
      >
        <Ticket {...{ order, storeName, copy, address }} />
      </section>
    </div>
  );
}
function Ticket({ order, storeName, copy, address }) {
  return (
    <>
      {storeName && <h2>{storeName}</h2>}
      <h3>
        {copy === "kitchen" ? "COZINHA" : copy === "delivery" ? "ENTREGA" : "CLIENTE"} ·{" "}
        {order.number}
      </h3>
      <p>Situação: {orderStatusLabel(order)}</p>
      <p>
        {new Date(order.createdAt).toLocaleString("pt-BR", { timeZone: "America/Bahia" })}
        {order.scheduledAt && (
          <>
            <br />
            Agendado:{" "}
            {new Date(order.scheduledAt).toLocaleString("pt-BR", { timeZone: "America/Bahia" })}
          </>
        )}
      </p>
      <p>
        {order.customer.name}
        {order.tableName ? ` · ${order.tableName}` : ""} ·{" "}
        {order.fulfillment === "pickup" ? "Retirada / consumo local" : "Entrega"}
      </p>
      {copy !== "kitchen" && (
        <p>
          {order.customer.phone}
          <br />
          {address}
        </p>
      )}
      <hr />
      {order.lines.map((l, i) => (
        <article key={i}>
          <h4>
            {l.quantity} × {l.name}
          </h4>
          {l.pizzaSummary && <p>{l.pizzaSummary}</p>}
          {l.extras.length > 0 && <p>Adicionais: {l.extras.map((e) => e.name).join(", ")}</p>}
          {l.removedIngredients.length > 0 && <p>SEM: {l.removedIngredients.join(", ")}</p>}
          {l.notes && (
            <p>
              <b>OBS: {l.notes}</b>
            </p>
          )}
          {copy !== "kitchen" && <p>{money(l.totalCents / 100)}</p>}
        </article>
      ))}
      {order.notes && (
        <p>
          <b>Observações: {order.notes}</b>
        </p>
      )}
      {copy !== "kitchen" && (
        <>
          <hr />
          <p>
            Itens: {money(order.subtotalCents / 100)}
            <br />
            Desconto: {money((order.coupon?.discountCents || 0) / 100)}
            <br />
            Frete: {money(order.deliveryFeeCents / 100)}
          </p>
          <h3>Total: {money(order.totalCents / 100)}</h3>
          <p>
            Forma prevista: {order.paymentMethod}
            <br />
            Recebido registrado: {money(paidCents(order) / 100)}
            <br />
            Saldo: {money(dueCents(order) / 100)}
            {order.changeForCents !== null && (
              <>
                <br />
                Troco para: {money(order.changeForCents / 100)}
              </>
            )}
          </p>
        </>
      )}
      <hr />
      <p>Pedido sem valor fiscal.</p>
    </>
  );
}
