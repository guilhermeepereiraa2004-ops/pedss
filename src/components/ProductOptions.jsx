import { useState } from "react";
import { Plus, Minus, ShoppingBag } from "lucide-react";
import ProductVisual from "./ProductVisual";
import { money } from "../lib/data";
import { isIllustrativeProductPhoto } from "../lib/productPhotography";
import "./ProductOptions.css";
import PizzaBuilder from "./PizzaBuilder";
import PizzaPriceBreakdown from "./PizzaPriceBreakdown";
import { pricePizza, initialPizzaSelection } from "../core/pizza.ts";
import ComboOptions from "./ComboOptions";
import { replacesPizzaOption } from "../core/catalogRules.ts";
export default function ProductOptions(props) {
  return props.product.combo ? <ComboOptions {...props} /> : <SingleProductOptions {...props} />;
}
function SingleProductOptions({
  product,
  onAdd,
  onBack,
  busy,
  error,
  canOrder = true,
  initialLine,
  submitLabel,
}) {
  const [quantity, setQuantity] = useState(initialLine?.quantity || 1),
    [extras, setExtras] = useState(
      (initialLine?.extraIds || []).filter((id) =>
        product.extras.some((e) => e.id === id && e.available && !replacesPizzaOption(product, e)),
      ),
    ),
    [removed, setRemoved] = useState(initialLine?.removedIngredients || []),
    [notes, setNotes] = useState(initialLine?.notes || "");
  const [pizza, setPizza] = useState(() =>
    product.pizza
      ? structuredClone(
          initialLine?.pizza
            ? {
                ...initialLine.pizza,
                flavorCount:
                  initialLine.pizza.flavorCount || initialLine.pizza.flavorIds.length || 1,
              }
            : initialPizzaSelection(product.pizza),
        )
      : undefined,
  );
  let pizzaPrice = null,
    pizzaError = "";
  if (product.pizza) {
    try {
      pizzaPrice = pricePizza(product.pizza, pizza);
    } catch (e) {
      pizzaError = e.message;
    }
  }
  const total =
    ((pizzaPrice?.priceCents ?? product.priceCents) +
      product.extras.filter((e) => extras.includes(e.id)).reduce((s, e) => s + e.priceCents, 0)) *
    quantity;
  return (
    <form
      className="product-options"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd({
          productId: product.id,
          quantity,
          extraIds: extras,
          removedIngredients: removed,
          notes,
          ...(pizza ? { pizza } : {}),
        });
      }}
    >
      <div className="product-options-body">
        {initialLine?.extraIds.some(
          (id) =>
            !product.extras.some(
              (e) => e.id === id && e.available && !replacesPizzaOption(product, e),
            ),
        ) && (
          <p className="notice">
            Opções antigas ou indisponíveis foram retiradas desta edição. Tamanho e borda são
            escolhidos no montador; confira o novo total antes de salvar.
          </p>
        )}
        {product.pizza && onBack && (
          <button type="button" className="pizza-back-link" onClick={onBack}>
            ← Voltar ao cardápio
          </button>
        )}
        {!product.pizza && (
          <div className="product-options-preview">
            <ProductVisual
              product={product}
              className="product-option-cutout"
              interactive
              priority
              motion
            />
            <small className="muted product-photo-note">
              {!product.model3dUrl && isIllustrativeProductPhoto(product)
                ? "Imagem ilustrativa da categoria. A aparência do produto pode variar."
                : "Foto do produto base. Adicionais e retiradas não alteram a foto."}
            </small>
          </div>
        )}
        {product.description && <p className="small-copy muted">{product.description}</p>}
        {product.ingredients.length > 0 && (
          <p className="small-copy">Ingredientes: {product.ingredients.join(", ")}</p>
        )}
        {product.allergens?.length > 0 && (
          <p className="notice">
            Contém: {product.allergens.join(", ")}. Para restrições alimentares, confirme com a
            equipe os riscos de contaminação cruzada.
          </p>
        )}
        {product.pizza && (
          <>
            <PizzaBuilder config={product.pizza} value={pizza} onChange={setPizza} />
            <div className="pizza-order-summary" aria-live="polite">
              {pizzaPrice?.summary || pizzaError}
            </div>
          </>
        )}
        {product.extras.some((e) => e.available && !replacesPizzaOption(product, e)) && (
          <fieldset>
            <legend>Um pouco mais do seu jeito</legend>
            {product.extras
              .filter((e) => e.available && !replacesPizzaOption(product, e))
              .map((extra) => (
                <label className="option-row" key={extra.id}>
                  <span>
                    <input
                      type="checkbox"
                      checked={extras.includes(extra.id)}
                      onChange={(e) =>
                        setExtras(
                          e.target.checked
                            ? [...extras, extra.id]
                            : extras.filter((id) => id !== extra.id),
                        )
                      }
                    />
                    {extra.name}
                  </span>
                  <strong>+ {money(extra.priceCents / 100)}</strong>
                </label>
              ))}
          </fieldset>
        )}
        {product.ingredients.length > 0 && (
          <fieldset>
            <legend>Prefere sem algum ingrediente?</legend>
            {product.ingredients.map((ingredient) => (
              <label className="option-row" key={ingredient}>
                <span>
                  <input
                    type="checkbox"
                    checked={removed.includes(ingredient)}
                    onChange={(e) =>
                      setRemoved(
                        e.target.checked
                          ? [...removed, ingredient]
                          : removed.filter((i) => i !== ingredient),
                      )
                    }
                  />
                  Sem {ingredient}
                </span>
                <small>Sem custo</small>
              </label>
            ))}
          </fieldset>
        )}
        <label className="field">
          Observações deste item
          <textarea
            maxLength={250}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Algum cuidado no preparo?"
          />
        </label>
      </div>
      <div className="product-option-actions">
        {product.pizza && (
          <PizzaPriceBreakdown
            config={product.pizza}
            selection={pizza}
            quantity={quantity}
            extrasCents={product.extras
              .filter((e) => extras.includes(e.id))
              .reduce((sum, e) => sum + e.priceCents, 0)}
          />
        )}
        <div className="product-option-footer">
          <div className="quantity-control">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              disabled={quantity <= 1}
              onClick={() => setQuantity(quantity - 1)}
            >
              <Minus size={13} />
            </button>
            <span>{quantity}</span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              disabled={quantity >= 99}
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus size={13} />
            </button>
          </div>
          <button
            type="submit"
            className="button button-dark"
            disabled={busy || !canOrder || !!pizzaError}
          >
            <ShoppingBag size={15} />
            {!canOrder
              ? "Loja fechada para pedidos"
              : busy
                ? "Adicionando…"
                : `${submitLabel || (initialLine ? "Salvar alterações" : "Adicionar")} · ${money(total / 100)}`}
          </button>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
