import { useState } from "react";
import { Plus, Pencil, Copy, TicketPercent } from "lucide-react";
import Modal from "./Modal";
import MoneyInput from "./MoneyInput";
import { useAction } from "../hooks/useApplication";
import { uuid } from "../core/domain.ts";
import { localDay, shiftDay } from "../core/calendar.ts";
import { couponIsCurrent, couponUses } from "../core/coupons.ts";
import { money } from "../lib/data";
import "./Business.css";

function CouponEditor({ coupon, now, onSave, busy, error }) {
  const day = localDay(now);
  const [form, setForm] = useState(
    coupon || {
      id: uuid(),
      code: "",
      description: "",
      kind: "percent",
      value: 10,
      minSubtotalCents: 0,
      validFrom: day,
      validUntil: shiftDay(day, 30),
      usageLimit: null,
      perCustomerLimit: 1,
      active: true,
      advertised: false,
    },
  );
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <label className="field">
        Código do cupom
        <input
          required
          maxLength={24}
          pattern="[A-Za-z0-9][A-Za-z0-9-]{2,23}"
          readOnly={!!coupon}
          value={form.code}
          onChange={(e) => set("code", e.target.value.toUpperCase())}
          placeholder="PEDSS10"
        />
        <small>O código fica fixo após o cadastro.</small>
      </label>
      <label className="field">
        Descrição da oferta
        <input
          maxLength={120}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </label>
      <div className="form-grid">
        <label className="field">
          Tipo de desconto
          <select
            value={form.kind}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                kind: e.target.value,
                value: e.target.value === "percent" ? 10 : 1000,
              }))
            }
          >
            <option value="percent">Percentual (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </select>
        </label>
        <label className="field">
          {form.kind === "percent" ? "Desconto (%)" : "Desconto (R$)"}
          {form.kind === "percent" ? (
            <input
              type="number"
              min="1"
              max="100"
              required
              value={form.value}
              onChange={(e) => set("value", Number(e.target.value))}
            />
          ) : (
            <MoneyInput key="fixed" required cents={form.value} onChange={(v) => set("value", v)} />
          )}
        </label>
      </div>
      <label className="field">
        Mínimo em produtos (R$)
        <MoneyInput
          required
          cents={form.minSubtotalCents}
          onChange={(v) => set("minSubtotalCents", v)}
        />
        <small>Desconto sobre produtos e adicionais. A entrega mantém sua taxa.</small>
      </label>
      <div className="form-grid">
        <label className="field">
          Válido a partir de
          <input
            required
            type="date"
            value={form.validFrom}
            onChange={(e) => set("validFrom", e.target.value)}
          />
        </label>
        <label className="field">
          Válido até
          <input
            required
            min={form.validFrom}
            type="date"
            value={form.validUntil}
            onChange={(e) => set("validUntil", e.target.value)}
          />
        </label>
      </div>
      <div className="form-grid">
        <label className="field">
          Limite total de usos
          <input
            type="number"
            min="1"
            max="1000000"
            value={form.usageLimit ?? ""}
            placeholder="Sem limite"
            onChange={(e) => set("usageLimit", e.target.value ? Number(e.target.value) : null)}
          />
        </label>
        <label className="field">
          Usos por telefone
          <input
            type="number"
            min="1"
            max="1000000"
            value={form.perCustomerLimit ?? ""}
            placeholder="Sem limite"
            onChange={(e) =>
              set("perCustomerLimit", e.target.value ? Number(e.target.value) : null)
            }
          />
        </label>
      </div>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => set("active", e.target.checked)}
        />
        Cupom ativo
      </label>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={form.advertised}
          onChange={(e) => set("advertised", e.target.checked)}
        />
        Divulgar na vitrine de delivery
      </label>
      <p className="notice small-copy">
        Validade em America/Bahia. Pedidos cancelados liberam o uso. O limite por cliente usa o
        telefone informado no checkout.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button button-dark" disabled={busy} type="submit">
        {busy ? "Salvando…" : "Salvar cupom"}
      </button>
    </form>
  );
}
export default function CouponPanel({ company, tenant, services, now }) {
  const action = useAction(),
    [editing, setEditing] = useState(undefined),
    [message, setMessage] = useState("");
  return (
    <section className="business-section">
      <div className="section-header-row">
        <p>Crie ofertas e compartilhe o código com seus clientes.</p>
        <button
          className="button button-dark"
          onClick={() => {
            action.setError("");
            setEditing(null);
          }}
        >
          <Plus size={15} />
          Novo cupom
        </button>
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {action.error && editing === undefined && (
        <p className="form-error" role="alert">
          {action.error}
        </p>
      )}
      {!tenant.coupons.length ? (
        <div className="panel empty-state">
          <TicketPercent size={32} />
          <h2>Um incentivo para o próximo pedido.</h2>
          <p>Cadastre seu primeiro cupom percentual ou de valor fixo.</p>
        </div>
      ) : (
        <div className="coupon-grid">
          {tenant.coupons.map((c) => (
            <article className="panel coupon-card" key={c.id}>
              <div>
                <span className={`tag ${couponIsCurrent(c, tenant.orders, now) ? "" : "neutral"}`}>
                  {couponIsCurrent(c, tenant.orders, now)
                    ? "Disponível"
                    : c.active
                      ? "Fora da validade / esgotado"
                      : "Desativado"}
                </span>
                <TicketPercent size={23} />
              </div>
              <h2>{c.code}</h2>
              <strong>
                {c.kind === "percent" ? `${c.value}%` : money(c.value / 100)} de desconto
              </strong>
              <p>{c.description || "Uma oferta da casa."}</p>
              <small>
                Mínimo {money(c.minSubtotalCents / 100)} · Até{" "}
                {c.validUntil.split("-").reverse().join("/")}
              </small>
              <small>
                {couponUses(c.id, tenant.orders).length}
                {c.usageLimit ? ` de ${c.usageLimit}` : ""} usos ·{" "}
                {c.advertised ? "Divulgado na vitrine" : "Compartilhamento por código"}
              </small>
              <footer>
                <button
                  className="button button-outline button-small"
                  onClick={() => {
                    action.setError("");
                    setEditing(c);
                  }}
                >
                  <Pencil size={13} />
                  Editar
                </button>
                <button
                  className="icon-button"
                  aria-label={`Copiar cupom ${c.code}`}
                  onClick={() =>
                    action.run(
                      () => navigator.clipboard.writeText(c.code),
                      () => setMessage(`Código ${c.code} copiado.`),
                    )
                  }
                >
                  <Copy size={14} />
                </button>
                <button
                  className="text-link"
                  disabled={action.busy}
                  onClick={() =>
                    action.run(() => services.saveCoupon(company.id, { ...c, active: !c.active }))
                  }
                >
                  {c.active ? "Desativar" : "Ativar"}
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
      {editing !== undefined && (
        <Modal
          title={editing ? "Editar cupom" : "Uma boa oferta começa aqui."}
          onClose={() => setEditing(undefined)}
        >
          <CouponEditor
            key={editing?.id || "new"}
            coupon={editing}
            now={now}
            busy={action.busy}
            error={action.error}
            onSave={(coupon) =>
              action.run(
                () => services.saveCoupon(company.id, coupon),
                () => {
                  setEditing(undefined);
                  setMessage("Cupom salvo.");
                },
              )
            }
          />
        </Modal>
      )}
    </section>
  );
}
