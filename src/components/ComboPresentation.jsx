import { ArrowUpRight, Check, Package } from "lucide-react";
import { comboGroups, comboArtworkItems, comboUnitsLabel } from "../application/comboPresentation";
import { comboStartingPrice } from "../core/restaurant.ts";
import { pizzaFlavorCounts } from "../core/pizza.ts";
import { pizzaFormatLabel } from "../application/productSelections";
import { money } from "../lib/data";
import ProductVisual from "./ProductVisual";
import PizzaPreview from "./PizzaPreview";
import "./ComboPresentation.css";

export function ComboArtwork({ product, products, choices = [], priority = false }) {
  const groups = comboGroups(product, products, choices),
    items = comboArtworkItems(groups, products);
  return (
    <div className="combo-artwork" data-count={items.length}>
      <span className="combo-artwork-count">
        <Package size={13} aria-hidden="true" />
        {comboUnitsLabel(groups)}
      </span>
      <div className="combo-artwork-plates" aria-label={`Composição de ${product.name}`}>
        {items.map((item) => (
          <div className="combo-artwork-item" key={item.key}>
            {item.pizza && item.product.pizza ? (
              <PizzaPreview compact config={item.product.pizza} value={item.pizza} />
            ) : (
              <ProductVisual
                product={item.product}
                motion
                priority={priority}
                sizes="(max-width: 600px) 240px, 280px"
              />
            )}
          </div>
        ))}
        {!items.length && <Package size={56} aria-label="Combo sem opções disponíveis" />}
      </div>
      {groups.some((g) => g.options.some((o) => o.customizePizza)) &&
        !choices.some((c) => c.pizza) && (
          <span className="combo-artwork-note">Sabores à sua escolha</span>
        )}
    </div>
  );
}
function GroupContent({ group }) {
  const available = group.options.filter((o) => o.state.available),
    selected = group.selected;
  const option = selected || (available.length === 1 ? available[0] : null),
    child = option?.product;
  const size = child?.pizza?.sizes.find((s) => s.id === option.sizeId);
  const names = group.choice?.pizza?.flavorIds
    .map((id) => child?.pizza?.flavors.find((f) => f.id === id)?.name)
    .filter(Boolean);
  return (
    <li>
      <b>{group.quantity}×</b>
      <div>
        <strong>{child?.name || group.name}</strong>
        {size && (
          <small>
            {size.name}
            {size.diameterCm ? ` · ${size.diameterCm} cm` : ""}
            {option.customizePizza &&
              (size.allowedFlavorCounts
                ? ` · ${pizzaFlavorCounts(size).map(pizzaFormatLabel).join(" / ")}`
                : ` · até ${size.maxFlavors} sabores`)}
          </small>
        )}
        {names?.length > 0 ? (
          <small>{names.join(" + ")}</small>
        ) : option?.customizePizza ? (
          <small>Monte com os sabores disponíveis</small>
        ) : !option ? (
          <small>
            {available.map((o) => o.product?.name).join(" ou ") || "Sem opção disponível"}
          </small>
        ) : null}
      </div>
      {selected && <Check size={15} aria-label="Escolhido" />}
    </li>
  );
}
export function ComboContents({ product, products, choices = [] }) {
  const groups = comboGroups(product, products, choices);
  return (
    <div className="combo-contents">
      <ul aria-label={`O que vem em ${product.name}`}>
        {groups.slice(0, 3).map((g) => (
          <GroupContent key={g.id} group={g} />
        ))}
      </ul>
      {groups.length > 3 && (
        <details>
          <summary>
            Ver mais {groups.length - 3} {groups.length === 4 ? "item" : "itens"} do combo
          </summary>
          <ul>
            {groups.slice(3).map((g) => (
              <GroupContent key={g.id} group={g} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
export default function ComboMenuCard({
  product,
  products,
  onOpen,
  canOrder = true,
  readOnly = false,
  priority = false,
}) {
  const price = comboStartingPrice(product, products);
  return (
    <article className="combo-menu-card" aria-label={product.name}>
      <div className="combo-menu-card-layout">
        <button
          className="combo-menu-photo"
          type="button"
          aria-label={`Ver ${product.name}`}
          onClick={onOpen}
        >
          <ComboArtwork {...{ product, products, priority }} />
        </button>
        <div className="combo-menu-info">
          <span className="combo-eyebrow">COMBO DA CASA</span>
          <h3>{product.name}</h3>
          {product.description && <p>{product.description}</p>}
          <ComboContents {...{ product, products }} />
          <div className="combo-menu-bottom">
            <div>
              <small>A partir de</small>
              <strong>{price === null ? "Indisponível" : money(price / 100)}</strong>
            </div>
            <button
              className="combo-menu-choose"
              type="button"
              onClick={onOpen}
              disabled={price === null || (!readOnly && !canOrder)}
              aria-label={`${readOnly ? "Ver detalhes de" : "Escolher"} ${product.name}`}
            >
              <span>{readOnly ? "Ver combo" : "Escolher combo"}</span>
              <ArrowUpRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
