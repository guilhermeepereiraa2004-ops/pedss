import { useState } from "react";
import { pizzaSalesReport } from "../core/pizzeriaOperations.ts";
import { localDay } from "../core/calendar.ts";
import "./PizzaRefinements.css";
export default function PizzaSalesReport({ tenant, now = new Date() }) {
  const [month, setMonth] = useState(() => localDay(new Date(now)).slice(0, 7));
  const data = pizzaSalesReport(tenant.orders, month);
  return (
    <section className="panel pizza-sales-report" aria-label="Relatório da pizzaria">
      <div className="panel-head">
        <div>
          <span className="section-kicker">Os sabores do seu movimento</span>
          <h2>Vendas da pizzaria</h2>
        </div>
        <label className="field">
          Mês das vendas
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
      </div>
      <div className="pizza-report-body">
        <p className="muted small-copy">
          <strong>
            {data.pizzas} {data.pizzas === 1 ? "pizza" : "pizzas"}
          </strong>{" "}
          em pedidos pagos, criados no mês selecionado. Combos contam suas pizzas incluídas.
        </p>
        <div className="pizza-report-grid">
          <div>
            <h3>Sabores mais vendidos</h3>
            <small>Equivalente a pizzas inteiras: meia pizza conta 0,5; um terço conta 0,33.</small>
            <ol>
              {data.flavors.map((f, i) => (
                <li key={`${f.name}-${i}`}>
                  <span>
                    {f.name}
                    <strong>
                      {f.portions.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                    </strong>
                  </span>
                </li>
              ))}
            </ol>
            {!data.flavors.length && (
              <p className="muted">Ainda não há sabores com vendas detalhadas neste período.</p>
            )}
          </div>
          <div>
            <h3>Vendas por tamanho</h3>
            <ol>
              {data.sizes.map((s) => (
                <li key={s.name}>
                  <span>
                    {s.name}
                    <strong>{s.pizzas}</strong>
                  </span>
                </li>
              ))}
            </ol>
            {!data.sizes.length && (
              <p className="muted">Ainda não há tamanhos com vendas detalhadas neste período.</p>
            )}
          </div>
        </div>
        <p className="small-copy muted">
          A contagem usa as escolhas salvas na venda. Pedidos cancelados e demonstrações são
          excluídos. Alterações de itens são consideradas na composição atual do pedido.
        </p>
        {data.untrackedLines > 0 && (
          <p className="notice">
            {data.untrackedLines} itens antigos sem detalhamento histórico ficaram fora deste
            relatório. O ranking geral de produtos continua disponível.
          </p>
        )}
      </div>
    </section>
  );
}
