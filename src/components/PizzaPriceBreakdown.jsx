import { pricePizza, pizzaPricingLabels } from "../core/pizza.ts";
import { money } from "../lib/data";

export default function PizzaPriceBreakdown({
  config,
  selection,
  quantity = 1,
  extrasCents = 0,
  includedInCombo = false,
  expanded = false,
}) {
  let priced;
  try {
    priced = pricePizza(config, selection);
  } catch {
    return null;
  }
  const b = priced.breakdown;
  const surcharge = b.doughCents + b.edgeCents + b.flavorExtrasCents + extrasCents;
  const total = (includedInCombo ? surcharge : priced.priceCents + extrasCents) * quantity;
  return (
    <details
      className="pizza-price-breakdown"
      aria-label="Composição do preço"
      open={expanded || undefined}
    >
      <summary>
        {includedInCombo ? "Adicionais desta pizza no combo" : "Como chegamos ao preço"}{" "}
        <strong>{money(total / 100)}</strong>
      </summary>
      <dl>
        {!includedInCombo && (
          <>
            <div>
              <dt>
                Pizza ·{" "}
                {b.countExtraCents ? pizzaPricingLabels[config.pricing] : "valor da combinação"}
              </dt>
              <dd>{money((b.baseCents - b.countExtraCents) / 100)}</dd>
            </div>
            {b.countExtraCents > 0 && (
              <div>
                <dt>Acréscimo pela quantidade de sabores</dt>
                <dd>{money(b.countExtraCents / 100)}</dd>
              </div>
            )}
          </>
        )}
        <div>
          <dt>Massa {priced.dough.name}</dt>
          <dd>{b.doughCents ? money(b.doughCents / 100) : "Inclusa"}</dd>
        </div>
        <div>
          <dt>Borda {priced.edge.name}</dt>
          <dd>{b.edgeCents ? money(b.edgeCents / 100) : "Inclusa"}</dd>
        </div>
        {b.flavorExtrasCents > 0 && (
          <div>
            <dt>Adicionais dos sabores</dt>
            <dd>{money(b.flavorExtrasCents / 100)}</dd>
          </div>
        )}
        {extrasCents > 0 && (
          <div>
            <dt>Adicionais do produto</dt>
            <dd>{money(extrasCents / 100)}</dd>
          </div>
        )}
        <div className="pizza-price-total">
          <dt>
            {quantity > 1
              ? `${quantity} pizzas · total`
              : includedInCombo
                ? "Somado ao combo"
                : "Total da pizza"}
          </dt>
          <dd>{money(total / 100)}</dd>
        </div>
      </dl>
    </details>
  );
}
