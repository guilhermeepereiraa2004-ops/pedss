import { useState } from "react";
import { Plus, Pencil, Archive, RotateCcw, Wallet } from "lucide-react";
import Modal from "./Modal";
import MoneyInput from "./MoneyInput";
import { useAction } from "../hooks/useApplication";
import { uuid, iso } from "../core/domain.ts";
import { localDay } from "../core/calendar.ts";
import { money } from "../lib/data";
import "./Business.css";
const categories = [
  "Ingredientes",
  "Equipe",
  "Aluguel",
  "Energia e água",
  "Marketing",
  "Taxas",
  "Outros",
];
function ExpenseEditor({ expense, now, onSave, busy, error }) {
  const [form, setForm] = useState(
    expense || {
      id: uuid(),
      description: "",
      category: "Ingredientes",
      amountCents: 0,
      paidOn: localDay(now),
      notes: "",
      voided: false,
      createdAt: iso(),
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
        Descrição da despesa
        <input
          required
          minLength={2}
          maxLength={120}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </label>
      <div className="form-grid">
        <label className="field">
          Valor pago (R$)
          <MoneyInput required cents={form.amountCents} onChange={(v) => set("amountCents", v)} />
        </label>
        <label className="field">
          Data do pagamento
          <input
            required
            type="date"
            max={localDay(now)}
            value={form.paidOn}
            onChange={(e) => set("paidOn", e.target.value)}
          />
        </label>
      </div>
      <label className="field">
        Categoria da despesa
        <select value={form.category} onChange={(e) => set("category", e.target.value)}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Observações
        <textarea
          value={form.notes}
          maxLength={500}
          onChange={(e) => set("notes", e.target.value)}
        />
      </label>
      <p className="notice small-copy">
        Registre despesas já pagas. Elas entram no saldo de caixa na data informada. O custo
        unitário do produto é usado apenas para calcular margem e não é descontado novamente do
        caixa.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button button-dark" disabled={busy}>
        {busy ? "Salvando…" : "Salvar despesa"}
      </button>
    </form>
  );
}
export default function ExpensePanel({ company, tenant, services, now }) {
  const action = useAction(),
    [editing, setEditing] = useState(undefined),
    [archived, setArchived] = useState(false),
    [month, setMonth] = useState(localDay(now).slice(0, 7));
  const items = tenant.expenses
    .filter((e) => e.voided === archived && (!month || e.paidOn.startsWith(month)))
    .sort((a, b) => b.paidOn.localeCompare(a.paidOn));
  return (
    <section className="business-section">
      <div className="section-header-row">
        <div className="expense-filters">
          <label className="field">
            Mês das despesas
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => setArchived(e.target.checked)}
            />
            Mostrar arquivadas
          </label>
        </div>
        <button
          className="button button-dark"
          onClick={() => {
            action.setError("");
            setEditing(null);
          }}
        >
          <Plus size={15} />
          Registrar despesa
        </button>
      </div>
      {action.error && editing === undefined && (
        <p className="form-error" role="alert">
          {action.error}
        </p>
      )}
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>{archived ? "Lançamentos arquivados" : "Despesas pagas"}</h2>
            <p>
              {items.length} lançamentos ·{" "}
              {money(items.reduce((sum, e) => sum + e.amountCents, 0) / 100)}
              {archived ? " fora dos indicadores" : " no período"}
            </p>
          </div>
        </div>
        {!items.length ? (
          <div className="empty-state">
            <Wallet size={30} />
            <h3>Nenhuma despesa neste período.</h3>
            <p>Registre seus gastos para acompanhar o saldo.</p>
          </div>
        ) : (
          <div className="expense-list">
            {items.map((e) => (
              <article key={e.id}>
                <div>
                  <strong>{e.description}</strong>
                  <small>
                    {e.category} · {e.paidOn.split("-").reverse().join("/")}
                  </small>
                  {e.notes && <p>{e.notes}</p>}
                </div>
                <strong>{money(e.amountCents / 100)}</strong>
                <div>
                  {!archived && (
                    <button
                      className="icon-button"
                      aria-label={`Editar despesa ${e.description}`}
                      onClick={() => {
                        action.setError("");
                        setEditing(e);
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    className="icon-button"
                    aria-label={`${archived ? "Restaurar" : "Arquivar"} despesa ${e.description}`}
                    disabled={action.busy}
                    onClick={() =>
                      action.run(() => services.voidExpense(company.id, e.id, !e.voided))
                    }
                  >
                    {archived ? <RotateCcw size={14} /> : <Archive size={14} />}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {editing !== undefined && (
        <Modal
          title={editing ? "Editar despesa" : "Registrar despesa paga"}
          onClose={() => setEditing(undefined)}
        >
          <ExpenseEditor
            key={editing?.id || "new"}
            expense={editing}
            now={now}
            error={action.error}
            busy={action.busy}
            onSave={(e) =>
              action.run(
                () => services.saveExpense(company.id, e),
                () => setEditing(undefined),
              )
            }
          />
        </Modal>
      )}
    </section>
  );
}
