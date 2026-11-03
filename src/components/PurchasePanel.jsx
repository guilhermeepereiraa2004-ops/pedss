import { useState } from "react";
import { useAction } from "../hooks/useApplication";
import { uuid } from "../core/domain.ts";
import { localDay, shiftDay } from "../core/calendar.ts";
import { money } from "../lib/data";
import MoneyInput from "./MoneyInput";

export default function PurchasePanel({ tenant, company, services }) {
  const action = useAction(),
    [message, setMessage] = useState("");
  const inventory = tenant.restaurant?.inventory || [],
    suppliers = tenant.restaurant?.suppliers || [],
    purchases = tenant.restaurant?.purchases || [];
  const today = localDay(new Date());
  const [supplier, setSupplier] = useState({ name: "", contact: "" }),
    [supplierId, setSupplierId] = useState("");
  const [invoice, setInvoice] = useState(""),
    [receivedOn, setReceivedOn] = useState(today),
    [requestId, setRequestId] = useState(uuid);
  const empty = () => ({
    ingredientId: inventory[0]?.id || "",
    quantity: 1,
    totalCents: 0,
    batch: "",
    expiresOn: undefined,
  });
  const [lines, setLines] = useState(() => [empty()]);
  const change = (i, patch) =>
    setLines((rows) => rows.map((r, j) => (i === j ? { ...r, ...patch } : r)));
  const lots = purchases.flatMap((p) =>
    p.lines
      .filter((l) => l.expiresOn && l.expiresOn <= shiftDay(today, 7))
      .map((l, i) => ({ ...l, key: p.id + ":" + i, receivedOn: p.receivedOn })),
  );
  return (
    <section className="panel restaurant-stack" aria-label="Compras e fornecedores">
      <div className="restaurant-intro">
        <h2>Compras, lotes e fornecedores</h2>
        <p>Registre o recebimento para dar entrada no ingrediente e atualizar o custo médio.</p>
      </div>
      <details>
        <summary>Cadastrar fornecedor</summary>
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const id = uuid();
            action.run(
              () => services.saveSupplier(company.id, { id, ...supplier }),
              () => {
                setSupplier({ name: "", contact: "" });
                setSupplierId(id);
                setMessage("Fornecedor cadastrado.");
              },
            );
          }}
        >
          <label className="field">
            Nome do fornecedor
            <input
              required
              minLength="2"
              maxLength="80"
              value={supplier.name}
              onChange={(e) => setSupplier({ ...supplier, name: e.target.value })}
            />
          </label>
          <label className="field">
            Contato do fornecedor
            <input
              maxLength="120"
              value={supplier.contact}
              onChange={(e) => setSupplier({ ...supplier, contact: e.target.value })}
            />
          </label>
          <button className="button button-outline" disabled={action.busy}>
            Cadastrar fornecedor
          </button>
        </form>
      </details>
      {suppliers.length > 0 && (
        <p className="small-copy">
          Fornecedores cadastrados: {suppliers.map((s) => s.name).join(", ")}
        </p>
      )}
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          action.run(
            () =>
              services.receivePurchase(company.id, {
                requestId,
                supplierId,
                invoice,
                receivedOn,
                lines,
              }),
            () => {
              setLines([empty()]);
              setInvoice("");
              setRequestId(uuid());
              setMessage("Compra recebida. Estoque e custo médio atualizados.");
            },
          );
        }}
      >
        <div className="form-grid">
          <label className="field">
            Fornecedor da compra
            <select required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">Selecione</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Nota ou referência
            <input maxLength="80" value={invoice} onChange={(e) => setInvoice(e.target.value)} />
          </label>
          <label className="field">
            Data do recebimento
            <input
              type="date"
              required
              max={today}
              value={receivedOn}
              onChange={(e) => setReceivedOn(e.target.value)}
            />
          </label>
        </div>
        {lines.map((row, i) => (
          <fieldset className="purchase-line" key={i}>
            <legend>Item {i + 1}</legend>
            <div className="form-grid">
              <label className="field">
                Ingrediente recebido
                <select
                  required
                  value={row.ingredientId}
                  onChange={(e) => change(i, { ingredientId: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {inventory.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.unit})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Quantidade recebida (
                {inventory.find((v) => v.id === row.ingredientId)?.unit || "unidade do ingrediente"}
                )
                <input
                  type="number"
                  min="0.0001"
                  max="1000000000"
                  step="0.0001"
                  required
                  value={row.quantity}
                  onChange={(e) => change(i, { quantity: Number(e.target.value) })}
                />
              </label>
              <label className="field">
                Valor total deste item (R$)
                <MoneyInput
                  value={row.totalCents}
                  onChange={(value) => change(i, { totalCents: value })}
                />
              </label>
              <label className="field">
                Identificação do lote
                <input
                  maxLength="60"
                  value={row.batch}
                  onChange={(e) => change(i, { batch: e.target.value })}
                />
              </label>
              <label className="field">
                Validade do lote (opcional)
                <input
                  type="date"
                  min={today}
                  value={row.expiresOn || ""}
                  onChange={(e) => change(i, { expiresOn: e.target.value || undefined })}
                />
              </label>
            </div>
            <button
              type="button"
              className="text-link"
              disabled={lines.length === 1 || action.busy}
              onClick={() => setLines(lines.filter((_, j) => j !== i))}
            >
              Remover item {i + 1}
            </button>
          </fieldset>
        ))}
        <div className="restaurant-actions">
          <button
            type="button"
            className="button button-outline"
            disabled={lines.length >= 100 || action.busy}
            onClick={() => setLines([...lines, empty()])}
          >
            Adicionar ingrediente à compra
          </button>
          <strong>Total: {money(lines.reduce((s, l) => s + l.totalCents, 0) / 100)}</strong>
          <button
            className="button button-dark"
            disabled={
              action.busy ||
              !suppliers.length ||
              !inventory.length ||
              lines.some((l) => l.totalCents <= 0)
            }
          >
            Confirmar recebimento
          </button>
        </div>
        <p className="small-copy muted">
          Registre a despesa no Financeiro quando o pagamento ocorrer. Receber a compra não
          movimenta o caixa nem cria despesa automaticamente.
        </p>
      </form>
      {action.error && (
        <p role="alert" className="form-error">
          {action.error}
        </p>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <h3>Validades para conferir</h3>
      <p className="small-copy muted">
        Validade dos lotes recebidos, não saldo restante por lote. O consumo continua pelo
        ingrediente. Confira fisicamente e registre perdas no ajuste de estoque; não há baixa
        automática por validade.
      </p>
      {lots.length ? (
        lots.map((l) => (
          <p className="notice" key={l.key}>
            {inventory.find((v) => v.id === l.ingredientId)?.name} · lote{" "}
            {l.batch || "sem identificação"} · {l.expiresOn < today ? "Vencido" : "Validade"}:{" "}
            {l.expiresOn} · recebidos {l.quantity}{" "}
            {inventory.find((v) => v.id === l.ingredientId)?.unit}
          </p>
        ))
      ) : (
        <p className="muted">Nenhum recebimento com validade nos próximos 7 dias.</p>
      )}
      <details>
        <summary>Histórico de compras ({purchases.length})</summary>
        {purchases
          .slice()
          .reverse()
          .map((p) => (
            <article className="purchase-line" key={p.id}>
              <strong>
                {p.receivedOn} · {suppliers.find((s) => s.id === p.supplierId)?.name} ·{" "}
                {money(p.totalCents / 100)}
              </strong>
              <p>
                {p.invoice || "Sem referência"} · recebido por {p.actor}
              </p>
              {p.lines.map((l, i) => (
                <p key={i}>
                  {inventory.find((v) => v.id === l.ingredientId)?.name}: {l.quantity}{" "}
                  {inventory.find((v) => v.id === l.ingredientId)?.unit} ·{" "}
                  {money(l.totalCents / 100)}
                  {l.batch ? ` · lote ${l.batch}` : ""}
                  {l.expiresOn ? ` · validade ${l.expiresOn}` : ""}
                </p>
              ))}
            </article>
          ))}
      </details>
    </section>
  );
}
