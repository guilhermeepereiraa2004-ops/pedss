import { useMemo, useState } from "react";
import { Plus, Minus, ShoppingBag } from "lucide-react";
import ProductVisual from "./ProductVisual";
import { money } from "../lib/data";
import { isIllustrativeProductPhoto } from "../lib/productPhotography";
import { isCiaMenuPhoto } from "../lib/pizzaPhotography";
import "./ProductOptions.css";
import PizzaBuilder from "./PizzaBuilder";
import PizzaPriceBreakdown from "./PizzaPriceBreakdown";
import { initialPizzaSelection, minimumPizzaPrice, pricePizza } from "../core/pizza.ts";
import {
  globalProductIngredients,
  pizzaWithAvailableOptions,
  productPizzaSelection,
} from "../application/productSelections";
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
  initialDraft,
  submitLabel,
  quickOrder = false,
  pizzaFormat,
  onCombine,
}) {
  const fastPizza = quickOrder && Boolean(product.pizza);
  const saved = initialLine || initialDraft;
  const globalIngredients = globalProductIngredients(product);
  const [quantity, setQuantity] = useState(saved?.quantity || 1),
    [extras, setExtras] = useState(
      (saved?.extraIds || []).filter((id) =>
        product.extras.some((e) => e.id === id && e.available && !replacesPizzaOption(product, e)),
      ),
    ),
    [removed, setRemoved] = useState(
      (saved?.removedIngredients || []).filter((name) => globalIngredients.includes(name)),
    ),
    [notes, setNotes] = useState(saved?.notes || "");
  const [pizza, setPizza] = useState(() => {
    if (pizzaFormat) {
      return pizzaWithAvailableOptions(
        product.pizza,
        productPizzaSelection(product, {
          ...initialPizzaSelection(product.pizza),
          sizeId: pizzaFormat.sizeId,
          flavorCount: pizzaFormat.count,
        }),
      );
    }
    const selection = productPizzaSelection(product, saved?.pizza, saved?.removedIngredients);
    return fastPizza ? pizzaWithAvailableOptions(product.pizza, selection) : selection;
  });
  let pizzaPrice = null,
    pizzaError = "";
  if (product.pizza) {
    try {
      pizzaPrice = pricePizza(product.pizza, pizza);
    } catch (e) {
      pizzaError = e.message;
    }
  }
  const extrasCents = product.extras.reduce(
    (sum, e) => sum + e.priceCents * extras.filter((id) => id === e.id).length,
    0,
  );
  const selectionRule = product.extraSelection;
  const selectionValid =
    !selectionRule || (extras.length >= selectionRule.min && extras.length <= selectionRule.max);
  const total = ((pizzaPrice?.priceCents ?? product.priceCents) + extrasCents) * quantity;
  const missingFlavors = pizzaFormat ? pizzaFormat.count - pizza.flavorIds.length : 0;
  const awaitingFlavor = fastPizza && (!pizza.flavorIds.length || missingFlavors > 0);
  const sizeId = pizza?.sizeId;
  const formatCount = pizzaFormat?.count;
  const formatStartingPrice = pizzaFormat?.startingPriceCents;
  const startingPrice = useMemo(() => {
    if (!awaitingFlavor) return null;
    if (formatStartingPrice != null) return formatStartingPrice;
    const sizes = product.pizza.sizes.filter((size) => size.id === sizeId);
    try {
      return minimumPizzaPrice({ ...product.pizza, sizes });
    } catch {
      return null;
    }
  }, [awaitingFlavor, product.pizza, sizeId, formatStartingPrice]);
  const draft = () => ({
    productId: product.id,
    quantity,
    extraIds: extras,
    removedIngredients: removed,
    notes,
    ...(pizza ? { pizza } : {}),
  });
  const customOptions = (
    <>
      {product.extras.some((e) => e.available && !replacesPizzaOption(product, e)) && (
        <fieldset>
          <legend>{selectionRule?.label || "Um pouco mais do seu jeito"}</legend>
          {selectionRule && selectionRule.max > 1 && (
            <p className="small-copy muted" aria-live="polite">
              {extras.length} de {selectionRule.max} selecionados
            </p>
          )}
          {product.extras
            .filter((e) => e.available && !replacesPizzaOption(product, e))
            .map((extra) => {
              if (selectionRule?.max > 1) {
                const count = extras.filter((id) => id === extra.id).length;
                return (
                  <div className="option-row" key={extra.id}>
                    <span>
                      {extra.name}
                      {extra.priceCents > 0 && ` · + ${money(extra.priceCents / 100)}`}
                    </span>
                    <div className="quantity-control">
                      <button
                        type="button"
                        disabled={!count}
                        aria-label={`Diminuir ${extra.name}`}
                        onClick={() =>
                          setExtras((current) =>
                            current.filter((_, index) => index !== current.indexOf(extra.id)),
                          )
                        }
                      >
                        <Minus size={13} />
                      </button>
                      <span aria-label={`Quantidade de ${extra.name}`}>{count}</span>
                      <button
                        type="button"
                        disabled={extras.length >= selectionRule.max}
                        aria-label={`Aumentar ${extra.name}`}
                        onClick={() => setExtras((current) => [...current, extra.id])}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <label className="option-row" key={extra.id}>
                  <span>
                    <input
                      type={
                        selectionRule?.min === 1 && selectionRule.max === 1 ? "radio" : "checkbox"
                      }
                      name={
                        selectionRule?.min === 1 && selectionRule.max === 1
                          ? "product-extra-selection"
                          : undefined
                      }
                      checked={extras.includes(extra.id)}
                      onChange={(e) =>
                        setExtras(
                          selectionRule?.max === 1 && e.target.checked
                            ? [extra.id]
                            : e.target.checked
                              ? [...extras, extra.id]
                              : extras.filter((id) => id !== extra.id),
                        )
                      }
                    />
                    {extra.name}
                  </span>
                  <strong>
                    {selectionRule && !extra.priceCents
                      ? "Incluso"
                      : `+ ${money(extra.priceCents / 100)}`}
                  </strong>
                </label>
              );
            })}
        </fieldset>
      )}
      {globalIngredients.length > 0 && (
        <fieldset>
          <legend>Prefere sem algum ingrediente?</legend>
          {globalIngredients.map((ingredient) => (
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
    </>
  );
  return (
    <form
      className={`product-options${fastPizza ? " pizza-quick-order" : ""}`}
      data-pizza-format={formatCount || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy && canOrder && !pizzaError && selectionValid) onAdd(draft());
      }}
    >
      <div className="product-options-body">
        {saved?.extraIds.some(
          (id) =>
            !product.extras.some(
              (e) => e.id === id && e.available && !replacesPizzaOption(product, e),
            ),
        ) && (
          <p className="notice">
            Alguns adicionais não estão disponíveis nesta pizza. Confira as opções e o novo total.
          </p>
        )}
        {initialDraft?.removedIngredients.some((name) => !globalIngredients.includes(name)) && (
          <p className="notice">Confira as retiradas disponíveis em Personalizar pizza.</p>
        )}
        {product.pizza && onBack && (
          <button type="button" className="pizza-back-link" onClick={onBack}>
            {pizzaFormat ? "← Voltar aos tamanhos" : "← Voltar ao cardápio"}
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
                : isCiaMenuPhoto(product.cutoutImage || product.image)
                  ? "Imagem ilustrativa. A aparência do produto pode variar."
                  : "Foto do produto base. Adicionais e retiradas não alteram a foto."}
            </small>
          </div>
        )}
        {product.description && <p className="small-copy muted">{product.description}</p>}
        {!fastPizza && product.ingredients.length > 0 && (
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
            <PizzaBuilder
              config={product.pizza}
              value={pizza}
              quickOrder={fastPizza}
              formatCount={formatCount}
              customOptions={customOptions}
              onCombine={onCombine ? () => onCombine(draft()) : undefined}
              onChange={(next) =>
                setPizza(
                  fastPizza
                    ? next
                    : productPizzaSelection(product, {
                        ...next,
                        ...(product.pizza.flavors.length === 1 && next.sizeId !== pizza.sizeId
                          ? { customizations: pizza.customizations }
                          : {}),
                      }),
                )
              }
            />
            {fastPizza ? (
              <PizzaPriceBreakdown
                config={product.pizza}
                selection={pizza}
                quantity={quantity}
                extrasCents={extrasCents}
              />
            ) : (
              <div className="pizza-order-summary" aria-live="polite">
                {pizzaPrice?.summary || pizzaError}
              </div>
            )}
          </>
        )}
        {!fastPizza && customOptions}
      </div>
      <div className="product-option-actions">
        {product.pizza && !fastPizza && (
          <PizzaPriceBreakdown
            config={product.pizza}
            selection={pizza}
            quantity={quantity}
            extrasCents={extrasCents}
          />
        )}
        {fastPizza && (
          <div className="pizza-quick-total" aria-live="polite" aria-atomic="true">
            <span>
              {awaitingFlavor
                ? "A partir de"
                : quantity > 1
                  ? `Total · ${quantity} pizzas`
                  : "Total da pizza"}
            </span>
            <strong>
              {pizzaPrice
                ? money(total / 100)
                : startingPrice != null
                  ? money(((startingPrice + extrasCents) * quantity) / 100)
                  : "—"}
            </strong>
          </div>
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
            disabled={busy || !canOrder || !!pizzaError || !selectionValid}
          >
            <ShoppingBag size={15} />
            {!canOrder
              ? "Loja fechada para pedidos"
              : busy
                ? "Adicionando…"
                : fastPizza
                  ? submitLabel ||
                    (initialLine
                      ? "Salvar alterações"
                      : awaitingFlavor
                        ? missingFlavors > 1
                          ? `Escolha ${missingFlavors} sabores`
                          : pizzaFormat && pizza.flavorIds.length
                            ? "Falta 1 sabor"
                            : "Escolha um sabor"
                        : "Adicionar à sacola")
                  : `${submitLabel || (initialLine ? "Salvar alterações" : "Adicionar")} · ${money(total / 100)}`}
          </button>
        </div>
        {fastPizza && pizzaError && !awaitingFlavor && (
          <p className="form-error" role="status">
            {pizzaError}
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
