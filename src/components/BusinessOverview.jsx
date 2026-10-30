import { useState } from "react";
import {
  CircleDollarSign,
  Wallet,
  ShoppingBag,
  Receipt,
  ArrowUpRight,
  TrendingUp,
  Trophy,
  Users,
  Package,
} from "lucide-react";
import Metrics from "./Metrics";
import { businessOverview } from "../core/analytics.ts";
import { money } from "../lib/data";
import "./Business.css";
const currency = (cents) => money(cents / 100);
export default function BusinessOverview({ company, tenant, now, onExpenses, onCatalog }) {
  const data = businessOverview(company, tenant, now),
    [dayIndex, setDayIndex] = useState(6);
  const monthName = new Date(`${data.month}-01T12:00:00Z`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Bahia",
  });
  const dailyMax = Math.max(1, ...data.sevenDays.map((d) => Math.abs(d.balanceCents))),
    monthlyMax = Math.max(
      1,
      ...data.months.flatMap((m) => [Math.abs(m.revenueCents), m.expenseCents]),
    );
  const day = data.sevenDays[dayIndex];
  const metrics = [
    {
      label: "Receita do mês",
      value: currency(data.revenueCents),
      detail: "Recebido menos estornos no mês",
      icon: CircleDollarSign,
    },
    {
      label: "Despesas do mês",
      value: currency(data.expenseCents),
      detail: "Despesas pagas registradas",
      icon: Wallet,
    },
    {
      label: "Pedidos do mês",
      value: String(data.orderCount).padStart(2, "0"),
      detail: `${data.cancelledCount} cancelados · exemplos excluídos`,
      icon: ShoppingBag,
    },
    {
      label: "Ticket médio",
      value: currency(data.averageTicketCents),
      detail: `${data.saleCount} ${data.saleCount === 1 ? "venda paga" : "vendas pagas"} no mês`,
      icon: Receipt,
    },
  ];
  return (
    <div className="business-overview">
      <div className="overview-period">
        <span>
          <i />
          Visão de {monthName}
        </span>
        <small>Atualizado com os registros da loja</small>
      </div>
      <Metrics items={metrics} />
      <div className="business-chart-grid">
        <section className="panel balance-panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">O movimento da semana</span>
              <h2>Saldo dos últimos 7 dias</h2>
            </div>
            <TrendingUp size={20} />
          </div>
          <div className="balance-total">
            <strong>{currency(data.sevenDays.reduce((sum, d) => sum + d.balanceCents, 0))}</strong>
            <span>recebimentos − estornos − despesas</span>
          </div>
          <div className="seven-day-chart" aria-label="Saldo de caixa por dia">
            {data.sevenDays.map((d, i) => (
              <button
                key={d.day}
                aria-pressed={i === dayIndex}
                onClick={() => setDayIndex(i)}
                aria-label={`${d.day.split("-").reverse().join("/")}: saldo ${currency(d.balanceCents)}`}
              >
                <span className="daily-bars">
                  <i
                    className={d.balanceCents < 0 ? "negative" : "positive"}
                    style={{
                      height: `${Math.max(2, (Math.abs(d.balanceCents) / dailyMax) * 47)}%`,
                      bottom: d.balanceCents < 0 ? undefined : "50%",
                      top: d.balanceCents < 0 ? "50%" : undefined,
                    }}
                  />
                </span>
                <small>
                  {d.day.slice(8)}/{d.day.slice(5, 7)}
                </small>
              </button>
            ))}
          </div>
          <div className="daily-detail" aria-live="polite">
            <strong>{day.day.split("-").reverse().join("/")}</strong>
            <span>Receita {currency(day.revenueCents)}</span>
            <span>Despesas {currency(day.expenseCents)}</span>
            <b>Saldo {currency(day.balanceCents)}</b>
          </div>
        </section>
        <section className="month-balance-card">
          <span className="section-kicker">O mês, no controle</span>
          <h2>Saldo de caixa do mês</h2>
          <strong>{currency(data.balanceCents)}</strong>
          <p>A diferença entre o que entrou e as despesas pagas registradas em {monthName}.</p>
          <button className="button button-lime" onClick={onExpenses}>
            Registrar despesas <ArrowUpRight size={14} />
          </button>
          <small>
            Saldo de caixa não equivale ao lucro contábil. Registre todas as saídas para completar a
            visão.
          </small>
        </section>
      </div>
      <div className="business-ranking-grid">
        <article className="panel ranking-card">
          <span className="ranking-icon">
            <Trophy size={20} />
          </span>
          <span className="section-kicker">Campeão da casa</span>
          <h2>Produto mais vendido</h2>
          <strong>{data.mostSold?.name || "Ainda sem vendas pagas"}</strong>
          <p>
            {data.mostSold
              ? `${data.mostSold.quantity} ${data.mostSold.quantity === 1 ? "unidade" : "unidades"} no mês`
              : "O ranking aparece com os primeiros recebimentos."}
          </p>
        </article>
        <article className="panel ranking-card">
          <span className="ranking-icon">
            <Package size={20} />
          </span>
          <span className="section-kicker">Uma oportunidade</span>
          <h2>Produto menos vendido</h2>
          <strong>{data.leastSold?.name || "Seu catálogo começa aqui"}</strong>
          <p>
            {data.leastSold
              ? `${data.leastSold.quantity} unidades no mês · inclui produtos sem vendas`
              : "Cadastre produtos para acompanhar."}
          </p>
        </article>
        <article className="panel ranking-card">
          <span className="ranking-icon">
            <Users size={20} />
          </span>
          <span className="section-kicker">Quem volta à mesa</span>
          <h2>Cliente com maior margem</h2>
          <strong>
            {data.topCustomer?.name ||
              (data.saleCount ? "Custos incompletos" : "Ainda sem vendas pagas")}
          </strong>
          <p>
            {data.topCustomer
              ? `${currency(data.topCustomer.grossMarginCents)} de margem bruta · ${data.topCustomer.orders} ${data.topCustomer.orders === 1 ? "pedido" : "pedidos"}`
              : data.topRevenueCustomer
                ? `Maior receita: ${data.topRevenueCustomer.name} · ${currency(data.topRevenueCustomer.revenueCents)}`
                : "O resultado será calculado com as vendas do mês."}
          </p>
        </article>
      </div>
      {data.saleCount > data.costedSales && (
        <div className="notice margin-notice">
          <p>
            {data.costedSales} de {data.saleCount} vendas pagas têm custos completos. Preencha o
            custo dos produtos e adicionais para calcular a margem dos próximos pedidos. Os pedidos
            anteriores preservam o custo original.
          </p>
          <button className="text-link" onClick={onCatalog}>
            Configurar custos <ArrowUpRight size={13} />
          </button>
        </div>
      )}
      <section className="panel monthly-panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">Desde o primeiro dia</span>
            <h2>Comparação de faturamento mensal</h2>
            <p>
              Desde o cadastro em{" "}
              {new Date(`${data.months[0].month}-01T12:00:00Z`).toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
              , incluindo os meses sem movimento.
            </p>
          </div>
          <div className="chart-legend">
            <span>
              <i />
              Receita
            </span>
            <span>
              <i />
              Despesas
            </span>
          </div>
        </div>
        <div className="monthly-series">
          {data.months.map((m) => (
            <div className="monthly-row" key={m.month}>
              <strong>
                {new Date(`${m.month}-01T12:00:00Z`).toLocaleDateString("pt-BR", {
                  month: "short",
                  year: "2-digit",
                })}
              </strong>
              <div className="monthly-bars" aria-hidden="true">
                <i style={{ width: `${(Math.abs(m.revenueCents) / monthlyMax) * 100}%` }} />
                <i style={{ width: `${(m.expenseCents / monthlyMax) * 100}%` }} />
              </div>
              <div>
                <span>
                  Receita <b>{currency(m.revenueCents)}</b>
                </span>
                <span>
                  Despesas <b>{currency(m.expenseCents)}</b>
                </span>
                <span>
                  Saldo <b>{currency(m.balanceCents)}</b>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <details className="overview-method">
        <summary>Como calculamos os indicadores</summary>
        <p>
          Receita considera a data do recebimento e desconta estornos na data em que foram
          registrados. Despesas seguem a data do pagamento. Pedidos contam pela data de criação,
          incluindo cancelados. Ticket e rankings usam vendas pagas e não canceladas, recebidas no
          mês. Exemplos demonstrativos ficam fora dos indicadores.
        </p>
        <p>
          Margem bruta do cliente = valor dos produtos − cupom − custo unitário dos produtos e
          adicionais. Frete e despesas gerais não são rateados entre clientes. Sem custos completos,
          o ranking de margem não é publicado. Produto menos vendido inclui itens cadastrados sem
          vendas; empates são ordenados por nome.{" "}
          {data.unitemizedSales > 0
            ? `${data.unitemizedSales} vendas legadas não têm composição detalhada e não entram no ranking de produtos.`
            : ""}
        </p>
      </details>
    </div>
  );
}
