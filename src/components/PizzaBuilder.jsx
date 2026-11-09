import { pizzaPricingLabels, pizzaFlavorAvailable, pricePizza } from "../core/pizza.ts";
import {
  pizzaAtSize,
  pizzaWithAvailableOptions,
  pizzaWithFlavors,
} from "../application/productSelections";
import { money } from "../lib/data";
import "./PizzaBuilder.css";
import "./PizzaRefinements.css";
import PizzaPreview from "./PizzaPreview";
import { useState } from "react";
import PizzaPriceBreakdown from "./PizzaPriceBreakdown";

const customerPriceRules = {
  highest: "Vale o preço do sabor mais caro.",
  average: "O preço segue a média dos sabores, de acordo com as partes escolhidas.",
  fixed: "O preço da pizza é fixo para este tamanho.",
  sum: "O preço é a soma dos sabores escolhidos.",
};

function PizzaCustomization({ quickOrder, children }) {
  if (!quickOrder) return children;
  return (
    <details className="pizza-customization">
      <summary>
        <strong>Personalizar pizza</strong>
        <small>Massa, borda, ingredientes e observações</small>
      </summary>
      <div className="pizza-customization-fields">{children}</div>
    </details>
  );
}

export default function PizzaBuilder({
  config,
  value,
  onChange: onSelectionChange,
  includedInCombo = false,
  quickOrder = false,
  onCombine,
  customOptions,
}) {
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [showPreview, setShowPreview] = useState(true);
  const [sizeNotice, setSizeNotice] = useState("");
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const go = (next, element) => {
    setStep(next);
    element?.closest(".product-options-body")?.scrollTo?.({ top: 0, behavior: "smooth" });
  };
  const onChange = (next) => onSelectionChange(pizzaWithAvailableOptions(config, next));
  const size = config.sizes.find((s) => s.id === value.sizeId);
  const flavors = config.flavors.filter((f) => pizzaFlavorAvailable(config, f, value.sizeId));
  const count = value.flavorCount || 1;
  const countPrice = size?.flavorCountPricing?.prices[count];
  const fixedPrice = size?.flavorCountPricing?.mode === "fixed" && countPrice != null;
  const baseFixedPrice = fixedPrice
    ? countPrice
    : config.pricing === "fixed"
      ? size?.fixedPriceCents
      : null;
  const wholePizza = quickOrder && config.flavors.length === 1;
  const selectedFlavors = value.flavorIds
    .map((id) => config.flavors.find((f) => f.id === id))
    .filter(Boolean);
  const maxFlavors = Math.min(size?.maxFlavors || 1, flavors.length);
  const selectionLimit = quickOrder ? maxFlavors : count;
  const showSearch = !quickOrder || flavors.length >= 7 || Boolean(search);
  const showFlavorFilter =
    !quickOrder ||
    kind !== "all" ||
    new Set(flavors.map((flavor) => flavor.kind || "savory")).size > 1;
  const toggleFlavor = (id, checked) => {
    const flavorIds = checked
      ? [...value.flavorIds, id]
      : value.flavorIds.filter((item) => item !== id);
    onChange(
      quickOrder
        ? pizzaWithFlavors(value, flavorIds)
        : { ...value, portions: undefined, customizations: undefined, flavorIds },
    );
  };
  const matchesFilter = (f) =>
    normalize(f.name).includes(normalize(search)) &&
    (kind === "all" || (f.kind || "savory") === kind);
  const changeSize = (nextSize) => {
    if (!quickOrder) {
      onChange({
        ...value,
        sizeId: nextSize.id,
        flavorCount: 1,
        flavorIds: [],
        portions: undefined,
        customizations: undefined,
      });
      return;
    }
    const next = pizzaAtSize(config, value, nextSize);
    const removed = selectedFlavors.filter((flavor) => !next.flavorIds.includes(flavor.id));
    const changedOptions = value.doughId !== next.doughId || value.edgeId !== next.edgeId;
    setSizeNotice(
      [
        removed.length
          ? `Sabores removidos ao mudar o tamanho: ${removed.map((flavor) => flavor.name).join(", ")}.`
          : "",
        changedOptions ? "A massa ou a borda foi ajustada para as opções disponíveis." : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
    onSelectionChange(next);
  };
  const sizePrice = (option) => {
    if (!quickOrder) return "";
    const candidate = pizzaAtSize(config, value, option);
    if (!candidate.flavorIds.length || candidate.flavorIds.length !== value.flavorIds.length)
      return "";
    try {
      return money(pricePizza(config, candidate).priceCents / 100);
    } catch {
      return "";
    }
  };
  return (
    <div
      className="pizza-builder"
      data-order={quickOrder ? "quick" : undefined}
      data-step={quickOrder ? undefined : step}
      data-preview={showPreview ? "shown" : "hidden"}
    >
      {!quickOrder && (
        <nav className="pizza-mobile-steps" aria-label="Etapas da montagem">
          {["Tamanho", "Sabores", "Massa e borda"].map((name, i) => (
            <button
              type="button"
              key={name}
              aria-current={step === i ? "step" : undefined}
              onClick={(e) => go(i, e.currentTarget)}
            >
              {i + 1}. {name}
            </button>
          ))}
        </nav>
      )}
      {!quickOrder && (
        <button
          type="button"
          className="pizza-preview-toggle text-link"
          aria-expanded={showPreview}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? "Recolher prévia" : "Ver minha pizza"}
        </button>
      )}
      <div className="pizza-builder-visual">
        <PizzaPreview config={config} value={value} />
      </div>
      <div className="pizza-builder-controls">
        <fieldset data-pizza-step="0">
          <legend>{!quickOrder && <b>01</b>} Escolha o tamanho</legend>
          <div className="pizza-choice-grid pizza-size-grid">
            {config.sizes
              .filter((s) => s.available)
              .map((s) => (
                <label className="pizza-choice" key={s.id}>
                  <input
                    type="radio"
                    name="pizza-size"
                    checked={s.id === value.sizeId}
                    onChange={() => changeSize(s)}
                  />
                  <span>
                    <strong>{s.name}</strong>
                    <small>
                      {s.diameterCm} cm · {s.slices} fatias
                      {!wholePizza &&
                        ` · até ${quickOrder ? Math.min(s.maxFlavors, config.flavors.filter((f) => pizzaFlavorAvailable(config, f, s.id)).length) : s.maxFlavors} sabores`}
                    </small>
                    {quickOrder && <span className="pizza-size-price">{sizePrice(s)}</span>}
                  </span>
                </label>
              ))}
          </div>
        </fieldset>
        {sizeNotice && (
          <p className="pizza-size-notice" role="status">
            {sizeNotice}
          </p>
        )}
        {wholePizza && onCombine && (
          <button
            type="button"
            className="button button-outline pizza-combine-link"
            onClick={onCombine}
          >
            Combinar com outro sabor
          </button>
        )}
        {!quickOrder && (
          <fieldset data-pizza-step="1">
            <legend>
              <b>02</b> Quantos sabores?
            </legend>
            <div className="pizza-count-choices">
              {Array.from(
                { length: Math.min(size?.maxFlavors || 1, flavors.length) },
                (_, i) => i + 1,
              ).map((n) => (
                <label className="pizza-choice" key={n}>
                  <input
                    type="radio"
                    name="pizza-count"
                    checked={count === n}
                    onChange={() =>
                      onChange({
                        ...value,
                        flavorCount: n,
                        flavorIds: value.flavorIds.slice(0, n),
                        portions: undefined,
                        customizations: undefined,
                      })
                    }
                  />
                  <span>
                    <strong>
                      {n} {n === 1 ? "sabor" : "sabores"}
                    </strong>
                    {!includedInCombo && size?.flavorCountPricing?.prices[n] != null && (
                      <small>
                        {size.flavorCountPricing.mode === "extra" ? "+ " : ""}
                        {money(size.flavorCountPricing.prices[n] / 100)}
                        {size.flavorCountPricing.mode === "fixed"
                          ? " · pizza inteira"
                          : " · acréscimo"}
                      </small>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {!wholePizza && (
          <fieldset data-pizza-step="1">
            <legend>{!quickOrder && <b>03</b>} Escolha seus sabores</legend>
            <p className="small-copy muted">
              {quickOrder ? (
                <>
                  {maxFlavors === 1 ? "Escolha 1 sabor." : `Escolha até ${maxFlavors} sabores.`}{" "}
                  {fixedPrice
                    ? "O preço é fixo para esta quantidade de sabores."
                    : customerPriceRules[config.pricing]}
                </>
              ) : (
                <>
                  Escolha {count} {count === 1 ? "sabor" : "sabores, divididos em partes iguais"}.{" "}
                  {includedInCombo
                    ? "Sabores incluídos no preço do combo."
                    : baseFixedPrice != null
                      ? `Preço fixo da pizza: ${money(baseFixedPrice / 100)}.`
                      : `${pizzaPricingLabels[config.pricing]}.`}
                  {!includedInCombo &&
                    !fixedPrice &&
                    countPrice != null &&
                    ` Acréscimo por ${count} sabores: ${money(countPrice / 100)}.`}
                  {!includedInCombo &&
                    (countPrice != null || baseFixedPrice != null) &&
                    " Massa, borda e adicionais à parte."}
                </>
              )}
            </p>
            {(showSearch || showFlavorFilter) && (
              <div
                className="pizza-flavor-tools"
                data-fields={Number(showSearch) + Number(showFlavorFilter)}
              >
                {showSearch && (
                  <label className="field">
                    Buscar sabor
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                      }}
                      placeholder="Ex.: calabresa"
                    />
                  </label>
                )}
                {showFlavorFilter && (
                  <label className="field">
                    Tipo de sabor
                    <select value={kind} onChange={(e) => setKind(e.target.value)}>
                      <option value="all">Todos os sabores</option>
                      <option value="savory">Salgados</option>
                      <option value="sweet">Doces</option>
                    </select>
                  </label>
                )}
              </div>
            )}
            {!quickOrder && (
              <p className="small-copy" aria-live="polite">
                {value.flavorIds.length
                  ? `Selecionados: ${value.flavorIds.map((id) => config.flavors.find((f) => f.id === id)?.name).join(", ")}`
                  : "Nenhum sabor selecionado"}
              </p>
            )}
            {quickOrder && selectedFlavors.length > 0 && (
              <ul className="pizza-selected-flavors" aria-label="Sabores selecionados">
                {selectedFlavors.map((flavor) => (
                  <li key={flavor.id}>
                    <button
                      type="button"
                      onClick={() => toggleFlavor(flavor.id, false)}
                      aria-label={`Remover sabor ${flavor.name}`}
                    >
                      {flavor.name} <span aria-hidden="true">×</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="pizza-choice-grid">
              {flavors.filter(matchesFilter).map((f) => {
                const selected = value.flavorIds.includes(f.id);
                const incompatible =
                  quickOrder &&
                  config.allowMixedKinds === false &&
                  selectedFlavors.some(
                    (flavor) => (flavor.kind || "savory") !== (f.kind || "savory"),
                  );
                return (
                  <label className="pizza-choice" key={f.id}>
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={
                        !selected && (value.flavorIds.length >= selectionLimit || incompatible)
                      }
                      onChange={(e) => toggleFlavor(f.id, e.target.checked)}
                    />
                    <span>
                      <strong>{f.name}</strong>
                      {(!quickOrder || incompatible) && (
                        <small>
                          {incompatible
                            ? "Não combina com os sabores escolhidos"
                            : includedInCombo
                              ? "Incluído no combo"
                              : baseFixedPrice != null
                                ? "Incluído no preço da combinação"
                                : `${money(f.prices[value.sizeId] / 100)} · pizza inteira`}
                        </small>
                      )}
                      {f.allergens?.length > 0 && <small>Contém: {f.allergens.join(", ")}</small>}
                    </span>
                  </label>
                );
              })}
            </div>
            {!flavors.some(matchesFilter) && (
              <p role="status">Nenhum sabor encontrado. Tente outro nome ou tipo.</p>
            )}
            <small aria-live="polite">
              {quickOrder
                ? `${value.flavorIds.length} de até ${selectionLimit} ${selectionLimit === 1 ? "sabor" : "sabores"}`
                : `${value.flavorIds.length} de ${count} ${count === 1 ? "sabor selecionado" : "sabores selecionados"}`}
            </small>
          </fieldset>
        )}
        <PizzaCustomization quickOrder={quickOrder}>
          {config.allowUnequalParts && value.flavorIds.length > 1 && (
            <fieldset data-pizza-step="1">
              <legend>Proporção dos sabores</legend>
              <label className="field">
                Divisão da pizza
                <select
                  value={value.portions ? "quarters" : "equal"}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      portions:
                        e.target.value === "equal"
                          ? undefined
                          : value.flavorIds.map((_, i) =>
                              i === 0 ? 5 - value.flavorIds.length : 1,
                            ),
                    })
                  }
                >
                  <option value="equal">Partes iguais</option>
                  <option value="quarters">Dividir em 4 quartos</option>
                </select>
              </label>
              {value.portions &&
                value.flavorIds.map((id, i) => (
                  <label className="field" key={id}>
                    {config.flavors.find((f) => f.id === id)?.name} — quartos
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={value.portions[i]}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          portions: value.portions.map((v, j) =>
                            j === i ? Number(e.target.value) : v,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
              {value.portions && (
                <small aria-live="polite">
                  Total: {value.portions.reduce((s, n) => s + n, 0)} de 4 quartos. Deve somar 4.
                </small>
              )}
            </fieldset>
          )}
          {value.flavorIds.map((id) => {
            const f = config.flavors.find((f) => f.id === id);
            if (!f?.ingredients?.length && !f?.extras?.some((e) => e.available)) return null;
            const custom = value.customizations?.find((c) => c.flavorId === id) || {
              flavorId: id,
              extraIds: [],
              removedIngredients: [],
            };
            const change = (patch) =>
              onChange({
                ...value,
                customizations: [
                  ...(value.customizations || []).filter((c) => c.flavorId !== id),
                  { ...custom, ...patch },
                ],
              });
            return (
              <fieldset key={id} data-pizza-step="2">
                <legend>Personalizar {f.name}</legend>
                <small>
                  Aplica somente à parte deste sabor. Cada adicional tem o valor indicado, cobrado
                  uma vez por pizza.
                </small>
                {f.ingredients?.map((name) => (
                  <label className="checkbox-field" key={name}>
                    <input
                      type="checkbox"
                      checked={custom.removedIngredients.includes(name)}
                      onChange={(e) =>
                        change({
                          removedIngredients: e.target.checked
                            ? [...custom.removedIngredients, name]
                            : custom.removedIngredients.filter((v) => v !== name),
                        })
                      }
                    />
                    Sem {name}
                  </label>
                ))}
                {f.extras
                  ?.filter((e) => e.available)
                  .map((extra) => (
                    <label className="checkbox-field" key={extra.id}>
                      <input
                        type="checkbox"
                        checked={custom.extraIds.includes(extra.id)}
                        onChange={(e) =>
                          change({
                            extraIds: e.target.checked
                              ? [...custom.extraIds, extra.id]
                              : custom.extraIds.filter((v) => v !== extra.id),
                          })
                        }
                      />
                      {extra.name} + {money(extra.priceCents / 100)}
                    </label>
                  ))}
              </fieldset>
            );
          })}
          {[
            ["doughs", "doughId", "04", "Escolha a massa"],
            ["edges", "edgeId", "05", "Escolha a borda"],
          ].map(([key, field, step, title]) => (
            <fieldset key={key} data-pizza-step="2">
              <legend>
                {!quickOrder && <b>{step}</b>} {title}
              </legend>
              <div className="pizza-choice-grid">
                {config[key]
                  .filter(
                    (v) =>
                      v.available &&
                      (!v.allowedSizeIds || v.allowedSizeIds.includes(value.sizeId)) &&
                      (!v.allowedFlavorKinds ||
                        value.flavorIds.every((id) =>
                          v.allowedFlavorKinds.includes(
                            config.flavors.find((f) => f.id === id)?.kind || "savory",
                          ),
                        )),
                  )
                  .map((option) => (
                    <label className="pizza-choice" key={option.id}>
                      <input
                        type="radio"
                        name={`pizza-${key}`}
                        checked={value[field] === option.id}
                        onChange={() => onChange({ ...value, [field]: option.id })}
                      />
                      <span>
                        <strong>{option.name}</strong>
                        <small>
                          {option.priceCents ? `+ ${money(option.priceCents / 100)}` : "Inclusa"}
                        </small>
                      </span>
                    </label>
                  ))}
              </div>
            </fieldset>
          ))}
          {quickOrder && customOptions}
        </PizzaCustomization>
        {includedInCombo && (
          <PizzaPriceBreakdown config={config} selection={value} includedInCombo />
        )}
        {!quickOrder && (
          <div className="pizza-step-navigation">
            {step > 0 && (
              <button
                type="button"
                className="button button-outline"
                onClick={(e) => go(step - 1, e.currentTarget)}
              >
                Voltar
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                className="button button-dark"
                disabled={step === 0 ? !size : value.flavorIds.length !== count}
                onClick={(e) => go(step + 1, e.currentTarget)}
              >
                Continuar para {step === 0 ? "os sabores" : "massa e borda"}
              </button>
            ) : (
              <p className="small-copy">Confira o preço e adicione quando estiver do seu jeito.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
