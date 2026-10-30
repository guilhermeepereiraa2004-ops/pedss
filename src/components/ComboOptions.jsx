import { useState } from "react";
import { priceLine, uuid } from "../core/domain.ts";
import { comboOptionState } from "../core/restaurant.ts";
import { pricePizza, initialPizzaSelection } from "../core/pizza.ts";
import PizzaBuilder from "./PizzaBuilder";
import { money } from "../lib/data";
import { ComboArtwork, ComboContents } from "./ComboPresentation";
import ProductVisual from "./ProductVisual";
function PizzaInCombo({ product, option, initial, onBack, onConfirm }) {
  const config = {
    ...product.pizza,
    sizes: product.pizza.sizes.filter((s) => s.id === option.sizeId),
  };
  const [value, setValue] = useState(
    () => initial || { ...initialPizzaSelection(config), sizeId: option.sizeId },
  );
  let priced, problem;
  try {
    priced = pricePizza(config, value);
  } catch (e) {
    problem = e.message;
  }
  const extra = priced ? priced.dough.priceCents + priced.edge.priceCents + priced.customCents : 0;
  return (
    <form
      className="product-options"
      onSubmit={(e) => {
        e.preventDefault();
        if (priced) onConfirm(value);
      }}
    >
      <div className="product-options-body">
        <button type="button" className="pizza-back-link" onClick={onBack}>
          ← Voltar ao combo
        </button>
        <h3>Monte {product.name}</h3>
        <p className="small-copy muted">
          O tamanho e os sabores estão incluídos no combo. Massa, borda e adicionais pagos são
          somados por pizza incluída.
        </p>
        <PizzaBuilder config={config} value={value} onChange={setValue} includedInCombo />
        <p className="pizza-order-summary">{priced?.summary || problem}</p>
      </div>
      <div className="product-option-actions">
        <button className="button button-dark" disabled={!priced}>
          Usar esta montagem{extra ? ` · + ${money(extra / 100)} por pizza` : " · inclusa"}
        </button>
      </div>
    </form>
  );
}
export default function ComboOptions({
  product,
  products = [],
  onAdd,
  busy,
  error,
  canOrder = true,
  initialLine,
  submitLabel,
}) {
  const [choices, setChoices] = useState(() =>
      Object.fromEntries([
        ...product.combo.groups.flatMap((g) => {
          const option = g.options.length === 1 ? g.options[0] : null;
          return option &&
            option.surchargeCents === 0 &&
            !option.customizePizza &&
            comboOptionState(option, products).available
            ? [[g.id, { groupId: g.id, productId: option.productId }]]
            : [];
        }),
        ...(initialLine?.comboChoices || []).map((c) => [c.groupId, c]),
      ]),
    ),
    [quantity, setQuantity] = useState(initialLine?.quantity || 1),
    [notes, setNotes] = useState(initialLine?.notes || ""),
    [editing, setEditing] = useState(null);
  const line = {
    key: initialLine?.key || uuid(),
    productId: product.id,
    quantity,
    extraIds: [],
    removedIngredients: [],
    notes,
    comboChoices: product.combo.groups.filter((g) => choices[g.id]).map((g) => choices[g.id]),
  };
  let priced, problem;
  try {
    priced = priceLine(line, products);
  } catch (e) {
    problem = e.message;
  }
  if (editing)
    return (
      <PizzaInCombo
        key={`${editing.groupId}-${editing.product.id}`}
        product={editing.product}
        option={editing.option}
        initial={choices[editing.groupId]?.pizza}
        onBack={() => setEditing(null)}
        onConfirm={(pizza) => {
          setChoices({
            ...choices,
            [editing.groupId]: { groupId: editing.groupId, productId: editing.product.id, pizza },
          });
          setEditing(null);
        }}
      />
    );
  return (
    <form
      className="product-options"
      onSubmit={(e) => {
        e.preventDefault();
        if (priced) onAdd(line);
      }}
    >
      <div className="product-options-body">
        <div className="combo-selection-layout">
          <aside className="combo-selection-summary" aria-label="Resumo do combo">
            <ComboArtwork
              product={product}
              products={products}
              choices={line.comboChoices}
              priority
            />
            <h3>Seu combo, completo.</h3>
            <p className="combo-selection-progress" aria-live="polite">
              {line.comboChoices.length} de {product.combo.groups.length} grupos escolhidos
            </p>
            <ComboContents product={product} products={products} choices={line.comboChoices} />
          </aside>
          <div className="combo-selection-controls">
            <p>{product.description}</p>
            {product.combo.groups.map((g) => (
              <fieldset className="pizza-count-pricing-size" key={g.id}>
                <legend>
                  {g.quantity} × {g.name}
                </legend>
                {g.options.map((o) => {
                  const p = products.find((p) => p.id === o.productId),
                    state = comboOptionState(o, products);
                  return (
                    <div key={o.productId}>
                      <label className="option-row">
                        <span className="combo-option-label">
                          <input
                            type="radio"
                            name={g.id}
                            checked={choices[g.id]?.productId === o.productId}
                            disabled={!state.available}
                            onChange={() => {
                              setChoices({
                                ...choices,
                                [g.id]: { groupId: g.id, productId: o.productId },
                              });
                              if (o.customizePizza)
                                setEditing({ groupId: g.id, product: p, option: o });
                            }}
                          />
                          {p && (
                            <span className="combo-option-visual" aria-hidden="true">
                              <ProductVisual product={p} />
                            </span>
                          )}
                          <span className="combo-option-copy">
                            {p?.name || "Produto removido"}
                            {o.sizeId
                              ? ` · ${p?.pizza?.sizes.find((s) => s.id === o.sizeId)?.name || "Tamanho removido"}`
                              : ""}
                            {!state.available ? ` · ${state.reason}` : ""}
                            {choices[g.id]?.productId === p?.id && choices[g.id]?.pizza && (
                              <small>
                                {choices[g.id].pizza.flavorIds
                                  .map((id) => p.pizza.flavors.find((f) => f.id === id)?.name)
                                  .filter(Boolean)
                                  .join(" + ")}
                              </small>
                            )}
                          </span>
                        </span>
                        <strong>
                          {o.surchargeCents ? "+ " + money(o.surchargeCents / 100) : "Incluso"}
                        </strong>
                      </label>
                      {state.available &&
                        choices[g.id]?.productId === o.productId &&
                        o.customizePizza && (
                          <button
                            type="button"
                            className="button button-outline button-small"
                            onClick={() => setEditing({ groupId: g.id, product: p, option: o })}
                          >
                            {choices[g.id]?.pizza ? "Editar montagem" : "Montar pizza"} · {p.name}
                          </button>
                        )}
                    </div>
                  );
                })}
              </fieldset>
            ))}
            <label className="field">
              Quantidade
              <input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </label>
            <label className="field">
              Observações
              <textarea maxLength="250" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            {problem && <p className="notice">{problem}</p>}
          </div>
        </div>
      </div>
      <div className="product-option-actions">
        {error && <p role="alert">{error}</p>}
        <button className="button button-dark" disabled={busy || !priced || !canOrder}>
          {submitLabel || (initialLine ? "Salvar alterações" : "Adicionar combo")} ·{" "}
          {money((priced?.totalCents || product.priceCents) / 100)}
        </button>
      </div>
    </form>
  );
}
