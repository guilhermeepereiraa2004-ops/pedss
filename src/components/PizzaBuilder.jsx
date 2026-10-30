import { pizzaPricingLabels, pizzaFlavorAvailable } from "../core/pizza.ts";
import { money } from "../lib/data";
import "./PizzaBuilder.css";
import PizzaPreview from "./PizzaPreview";

export default function PizzaBuilder({
  config,
  value,
  onChange: onSelectionChange,
  includedInCombo = false,
}) {
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
    <div className="pizza-builder">
      <div className="pizza-builder-visual">
        <PizzaPreview config={config} value={value} />
      </div>
      <div className="pizza-builder-controls">
        <fieldset>
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
        <fieldset>
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
        <fieldset>
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
          <div className="pizza-choice-grid">
            {flavors.map((f) => (
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
          <small aria-live="polite">
            {value.flavorIds.length} de {count}{" "}
            {count === 1 ? "sabor selecionado" : "sabores selecionados"}
          </small>
        </fieldset>
        {config.allowUnequalParts && value.flavorIds.length > 1 && (
          <fieldset>
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
            <fieldset key={id}>
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
          <fieldset key={key}>
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
      </div>
    </div>
  );
}
