import { pizzaPricingLabels, pizzaFlavorAvailable } from "../core/pizza.ts";
import { money } from "../lib/data";
import "./PizzaBuilder.css";
import "./PizzaRefinements.css";
import PizzaPreview from "./PizzaPreview";
import { useState } from "react";
import PizzaPriceBreakdown from "./PizzaPriceBreakdown";

export default function PizzaBuilder({
  config,
  value,
  onChange: onSelectionChange,
  includedInCombo = false,
}) {
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [showPreview, setShowPreview] = useState(true);
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const go = (next, element) => {
    setStep(next);
    element?.closest(".product-options-body")?.scrollTo?.({ top: 0, behavior: "smooth" });
  };
  const onChange = (next) => {
    const kinds = next.flavorIds.map(
      (id) => config.flavors.find((f) => f.id === id)?.kind || "savory",
    );
    for (const [group, field] of [
      ["doughs", "doughId"],
      ["edges", "edgeId"],
    ]) {
      const available = config[group].filter(
        (o) =>
          o.available &&
          (!o.allowedSizeIds || o.allowedSizeIds.includes(next.sizeId)) &&
          (!o.allowedFlavorKinds || kinds.every((k) => o.allowedFlavorKinds.includes(k))),
      );
      if (!available.some((o) => o.id === next[field]))
        next = { ...next, [field]: available[0]?.id || "" };
    }
    onSelectionChange(next);
  };
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
  return (
    <div className="pizza-builder" data-step={step} data-preview={showPreview ? "shown" : "hidden"}>
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
      <button
        type="button"
        className="pizza-preview-toggle text-link"
        aria-expanded={showPreview}
        onClick={() => setShowPreview(!showPreview)}
      >
        {showPreview ? "Recolher prévia" : "Ver minha pizza"}
      </button>
      <div className="pizza-builder-visual">
        <PizzaPreview config={config} value={value} />
      </div>
      <div className="pizza-builder-controls">
        <fieldset data-pizza-step="0">
          <legend>
            <b>01</b> Escolha o tamanho
          </legend>
          <div className="pizza-choice-grid">
            {config.sizes
              .filter((s) => s.available)
              .map((s) => (
                <label className="pizza-choice" key={s.id}>
                  <input
                    type="radio"
                    name="pizza-size"
                    checked={s.id === value.sizeId}
                    onChange={() =>
                      onChange({
                        ...value,
                        sizeId: s.id,
                        flavorCount: 1,
                        flavorIds: [],
                        portions: undefined,
                        customizations: undefined,
                      })
                    }
                  />
                  <span>
                    <strong>{s.name}</strong>
                    <small>
                      {s.diameterCm} cm · {s.slices} fatias · até {s.maxFlavors} sabores
                    </small>
                  </span>
                </label>
              ))}
          </div>
        </fieldset>
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
        <fieldset data-pizza-step="1">
          <legend>
            <b>03</b> Escolha seus sabores
          </legend>
          <p className="small-copy muted">
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
          </p>
          <div className="pizza-flavor-tools">
            <label className="field">
              Buscar sabor
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ex.: calabresa"
              />
            </label>
            <label className="field">
              Tipo de sabor
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="all">Todos os sabores</option>
                <option value="savory">Salgados</option>
                <option value="sweet">Doces</option>
              </select>
            </label>
          </div>
          <p className="small-copy" aria-live="polite">
            {value.flavorIds.length
              ? `Selecionados: ${value.flavorIds.map((id) => config.flavors.find((f) => f.id === id)?.name).join(", ")}`
              : "Nenhum sabor selecionado"}
          </p>
          <div className="pizza-choice-grid">
            {flavors
              .filter(
                (f) =>
                  normalize(f.name).includes(normalize(search)) &&
                  (kind === "all" || (f.kind || "savory") === kind),
              )
              .map((f) => (
                <label className="pizza-choice" key={f.id}>
                  <input
                    type="checkbox"
                    checked={value.flavorIds.includes(f.id)}
                    disabled={!value.flavorIds.includes(f.id) && value.flavorIds.length >= count}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        portions: undefined,
                        customizations: undefined,
                        flavorIds: e.target.checked
                          ? [...value.flavorIds, f.id]
                          : value.flavorIds.filter((id) => id !== f.id),
                      })
                    }
                  />
                  <span>
                    <strong>{f.name}</strong>
                    <small>
                      {includedInCombo
                        ? "Incluído no combo"
                        : baseFixedPrice != null
                          ? "Incluído no preço da combinação"
                          : `${money(f.prices[value.sizeId] / 100)} · pizza inteira`}
                    </small>
                    {f.allergens?.length > 0 && <small>Contém: {f.allergens.join(", ")}</small>}
                  </span>
                </label>
              ))}
          </div>
          {!flavors.some(
            (f) =>
              normalize(f.name).includes(normalize(search)) &&
              (kind === "all" || (f.kind || "savory") === kind),
          ) && <p role="status">Nenhum sabor encontrado. Tente outro nome ou tipo.</p>}
          <small aria-live="polite">
            {value.flavorIds.length} de {count}{" "}
            {count === 1 ? "sabor selecionado" : "sabores selecionados"}
          </small>
        </fieldset>
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
                        : value.flavorIds.map((_, i) => (i === 0 ? 5 - value.flavorIds.length : 1)),
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
                Aplica somente à parte deste sabor. Cada adicional tem o valor indicado, cobrado uma
                vez por pizza.
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
              <b>{step}</b> {title}
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
        {includedInCombo && (
          <PizzaPriceBreakdown config={config} selection={value} includedInCombo />
        )}
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
      </div>
    </div>
  );
}
