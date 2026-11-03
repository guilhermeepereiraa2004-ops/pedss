import { CircleDollarSign, Package, TrendingUp, Percent, ArrowUpRight } from "lucide-react";
import { profitability } from "../core/profitability.ts";
import { money } from "../lib/data";
import Metrics from "./Metrics";
import "./ProfitabilityPanel.css";

const currency = (cents) => (cents === null ? "Não apurado" : money(cents / 100));
const percent = (value) =>
  value === null ? "—" : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export default function ProfitabilityPanel({ orders, from, to, onFrom, onTo, onCatalog, onOrder }) {
  const data = profitability(orders, from, to);
  const coverage = `${data.analyzedCount} de ${data.rows.length} vendas com custos completos`;
  return (
    <section className="profitability-panel" aria-label="Custos e margem">
      <div className="profitability-heading">
        <div>
          <span className="section-kicker">Entenda o que sobra de cada venda</span>
          <h2>Custos e margem</h2>
          <p>
            Vendas integralmente pagas, por data do pedido. Valores dos produtos após descontos.
          </p>
        </div>
        <button className="button button-outline button-small" onClick={onCatalog}>
          Configurar custos <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="profitability-period">
        <label className="field">
          De
          <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} />
        </label>
        <label className="field">
          Até
          <input type="date" value={to} min={from} onChange={(e) => onTo(e.target.value)} />
        </label>
        <small>Sem datas preenchidas, considera todo o histórico.</small>
      </div>
      {from && to && from > to && (
        <p className="form-error" role="alert">
          A data final deve ser igual ou posterior à inicial.
        </p>
      )}
      <Metrics
        items={[
          {
            label: "Total de vendas",
            value: currency(data.salesCents),
            detail: `${data.rows.length} vendas · sem frete`,
            icon: CircleDollarSign,
          },
          {
            label: "Custo dos produtos",
            value: currency(data.costCents),
            detail: coverage,
            icon: Package,
          },
          {
            label: data.missingCount ? "Margem bruta apurada" : "Margem bruta",
            value: currency(data.marginCents),
            detail: "Vendas com custos completos menos seus custos",
            icon: TrendingUp,
          },
          {
            label: "Margem sobre as vendas",
            value: percent(data.marginPercent),
            detail: "Percentual das vendas com custos completos",
            icon: Percent,
          },
        ]}
      />
      {data.missingCount > 0 && (
        <div className="notice" role="status">
          <strong>
            Apuração parcial: {data.missingCount}{" "}
            {data.missingCount === 1 ? "venda sem custo completo" : "vendas sem custos completos"}.
          </strong>
          <p>
            A margem e o custo acima consideram apenas {currency(data.analyzedSalesCents)} em vendas
            com todos os custos registrados. Custos desconhecidos não são tratados como zero.
          </p>
          <p>
            Preencher custos no cardápio vale para novos pedidos. O histórico mantém os valores da
            venda.
          </p>
        </div>
      )}
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Margem por pedido</h2>
            <p>Compare o valor vendido com o custo registrado em cada venda.</p>
          </div>
        </div>
        {data.rows.length === 0 ? (
          <div className="empty-state">
            <TrendingUp size={30} />
            <h3>Ainda sem vendas pagas neste período.</h3>
            <p>Os resultados aparecem após confirmar o pagamento dos pedidos.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <caption className="sr-only">Custos e margem bruta das vendas pagas</caption>
              <thead>
                <tr>
                  <th scope="col">Pedido</th>
                  <th scope="col">Venda sem frete</th>
                  <th scope="col">Custo</th>
                  <th scope="col">Margem bruta</th>
                  <th scope="col">Margem (%)</th>
                  <th scope="col">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>
                        {row.number} · {row.customer}
                      </strong>
                      <small>
                        {new Date(row.createdAt).toLocaleDateString("pt-BR", {
                          timeZone: "America/Bahia",
                        })}
                      </small>
                    </td>
                    <td>{currency(row.salesCents)}</td>
                    <td>
                      {row.costCents === null ? (
                        <span className="tag warning">Custo incompleto</span>
                      ) : (
                        currency(row.costCents)
                      )}
                    </td>
                    <td>{currency(row.marginCents)}</td>
                    <td>{percent(row.marginPercent)}</td>
                    <td>
                      <button
                        className="button button-outline button-small"
                        aria-label={`Detalhes do pedido ${row.number}`}
                        onClick={() => onOrder(row.id)}
                      >
                        Ver pedido <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <details className="profitability-method">
        <summary>Como calculamos os valores</summary>
        <p>
          Margem bruta = valor dos produtos − desconto do cupom − custo unitário × quantidade. A
          porcentagem divide a margem pelo valor das vendas após descontos, sempre usando as mesmas
          vendas com custos completos.
        </p>
        <p>
          Frete, despesas gerais, impostos e taxas não são descontados separadamente aqui. Este
          indicador não é lucro líquido nem saldo de caixa. Despesas continuam na aba Despesas, sem
          duplicar o custo dos produtos.
        </p>
        <p>
          Pedidos cancelados, estornados, de demonstração e com pagamento pendente ou parcial ficam
          fora desta apuração. Custos e adicionais são os registrados no pedido; pizzas montadas
          dependem de fichas técnicas completas para apurar o custo.
        </p>
      </details>
    </section>
  );
}
