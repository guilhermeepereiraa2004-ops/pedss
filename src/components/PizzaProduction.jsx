import { useAction } from "../hooks/useApplication";
import { uuid } from "../core/domain.ts";
import { pizzaWorkItems, pizzaStages, pizzaStageLabels } from "../core/pizzeriaOperations.ts";
export default function PizzaProduction({ order, company, services }) {
  const action = useAction();
  const items = pizzaWorkItems(order);
  if (!items.length)
    return (
      <p className="small-copy muted">
        Controle por pedido: composição antiga sem detalhamento individual, ou pedido acima de 300
        pizzas.
      </p>
    );
  return (
    <section className="pizza-production" aria-label={`Produção individual ${order.number}`}>
      <h3>Pizza por pizza</h3>
      <small>Ao iniciar uma pizza aqui, conclua todas antes de despachar o pedido.</small>
      {items.map((p, i) => (
        <article className="pizza-production-item" key={p.key}>
          <strong>
            {i + 1}. {p.name} · {p.size}
          </strong>
          <p>{p.summary}</p>
          <small>{[p.dough, p.edge].filter(Boolean).join(" · ")}</small>
          <div className="restaurant-actions">
            <span className="tag">{pizzaStageLabels[p.stage]}</span>
            {p.stage !== "ready" && (
              <button
                type="button"
                className="button button-outline"
                disabled={action.busy || !["Aceito", "Preparando"].includes(order.status)}
                onClick={() =>
                  action.run(() =>
                    services.changePizzaProduction(company.id, order.id, {
                      key: p.key,
                      stage: pizzaStages[pizzaStages.indexOf(p.stage) + 1],
                      expectedUpdatedAt: order.updatedAt,
                      requestId: uuid(),
                    }),
                  )
                }
              >
                {p.stage === "queued"
                  ? "Montar pizza"
                  : p.stage === "preparing"
                    ? "Colocar no forno"
                    : "Marcar pizza pronta"}
              </button>
            )}
          </div>
        </article>
      ))}
      {action.error && (
        <p role="alert" className="form-error">
          {action.error}
        </p>
      )}
    </section>
  );
}
