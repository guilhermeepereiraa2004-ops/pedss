import MoneyInput from "./MoneyInput";
import { uuid } from "../core/domain.ts";
import { pizzaFlavorCounts, pizzaPricingLabels } from "../core/pizza.ts";
import "./PizzaBuilder.css";
import { pizzaAppearances } from "../lib/pizzaAppearance";
import { createPizzaConfig } from "../application/pizzaDraft.ts";
import { pizzaFormatLabel } from "../application/productSelections";
import PizzaAdvancedEditor from "./PizzaAdvancedEditor";

const pizzaFormats = [1, 2, 3, 4];

export default function PizzaConfigEditor({ product, catalog = [], onChange, section = "all" }) {
  const config = product.pizza;
  const visible = (name) => section === "all" || section === name;
  const set = (key, value) => onChange({ ...config, [key]: value });
  const update = (key, id, patch) =>
    set(
      key,
      config[key].map((v) => (v.id === id ? { ...v, ...patch } : v)),
    );
  const remove = (key, id) =>
    set(
      key,
      config[key].filter((v) => v.id !== id),
    );
  const toggleFormat = (size, count, checked) => {
    const counts = pizzaFlavorCounts(size);
    update("sizes", size.id, {
      allowedFlavorCounts: checked ? [...counts, count] : counts.filter((item) => item !== count),
      maxFlavors: Math.max(size.maxFlavors, count),
    });
  };
  return (
    <section className="pizza-config">
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={!!config}
          onChange={(e) => onChange(e.target.checked ? createPizzaConfig(product) : undefined)}
        />{" "}
        Ativar montador de pizza
      </label>
      <p className="small-copy muted">
        O montador substitui o preço base pela combinação escolhida. Tamanhos, massas e bordas devem
        ser configurados aqui. Outros adicionais do produto são cobrados separadamente; opções
        antigas de tamanho e borda ficam preservadas, mas não são cobradas junto ao montador.
      </p>
      {config && (
        <>
          {visible("rules") && <PizzaAdvancedEditor config={config} onChange={onChange} />}
          {visible("general") && (
            <>
              <label className="field">
                Exibição no cardápio
                <select
                  value={config.menuPlacement || "catalog"}
                  onChange={(e) => set("menuPlacement", e.target.value)}
                >
                  <option value="catalog">Manter como produto no cardápio</option>
                  <option value="builder">Somente na chamada Monte sua pizza</option>
                </select>
                <small>
                  Cadastre os sabores individuais normalmente. Use a segunda opção para deixar este
                  montador separado dos cards.
                </small>
              </label>
              <fieldset className="pizza-pricing-methods">
                <legend>Como cobrar a pizza?</legend>
                {[
                  [
                    "average",
                    "Média dos sabores",
                    "Divide os preços pelas partes iguais. Exemplo: R$ 44,90 + R$ 39,90 + R$ 54,90 → R$ 46,57.",
                  ],
                  [
                    "highest",
                    "Sabor mais caro",
                    "Usa o maior preço entre os sabores escolhidos. No mesmo exemplo: R$ 54,90.",
                  ],
                  [
                    "fixed",
                    "Preço fixo",
                    "Você define um valor para cada tamanho, independentemente dos sabores escolhidos.",
                  ],
                ].map(([id, label, description]) => (
                  <label className="pizza-pricing-method" key={id}>
                    <input
                      type="radio"
                      name="pizza-pricing-method"
                      checked={config.pricing === id}
                      onChange={() => set("pricing", id)}
                    />
                    <span>
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                  </label>
                ))}
              </fieldset>
              {config.pricing === "sum" && (
                <p className="notice">
                  Este cadastro usa a regra legada {pizzaPricingLabels.sum}. Ela será mantida até
                  você escolher outra opção.
                </p>
              )}
              {config.pricing === "fixed" && (
                <div className="pizza-count-price-fields">
                  {config.sizes.map((size) => (
                    <label className="field" key={size.id}>
                      Preço fixo em {size.name} (R$)
                      <MoneyInput
                        required={size.available}
                        disabled={!size.available}
                        aria-label={`Preço fixo em ${size.name}`}
                        cents={size.fixedPriceCents}
                        onChange={(value) =>
                          update("sizes", size.id, {
                            fixedPriceCents: Number.isFinite(value) ? value : undefined,
                          })
                        }
                      />
                      <small>
                        {size.slices} fatias ·{" "}
                        {pizzaFlavorCounts(size).map(pizzaFormatLabel).join(" · ")}
                      </small>
                    </label>
                  ))}
                </div>
              )}
              <small>
                Os preços da tabela representam pizzas inteiras. Na média, cada sabor ocupa uma
                parte igual e o resultado é arredondado ao centavo. Massa, borda e adicionais são
                somados uma única vez por pizza. Preços específicos por quantidade de sabores
                substituem a regra principal; acréscimos são somados a ela.
              </small>
            </>
          )}
          {visible("sizes") && (
            <div>
              <h3>Tamanhos</h3>
              <p className="small-copy muted">
                Defina o tamanho, quantas fatias serão cortadas e os formatos que o cliente pode
                pedir. Para definir os valores, use Como cobrar, Preços por tamanho ou Preços por
                sabores.
              </p>
              {config.sizes.map((size, index) => {
                const counts = pizzaFlavorCounts(size);
                return (
                  <div className="pizza-config-row" key={size.id}>
                    <label className="field">
                      Nome do tamanho
                      <input
                        required
                        maxLength={60}
                        value={size.name}
                        onChange={(e) => update("sizes", size.id, { name: e.target.value })}
                      />
                    </label>
                    {[
                      ["diameterCm", "Diâmetro (cm)", 200],
                      ["slices", "Fatias", 64],
                    ].map(([key, label, max]) => (
                      <label className="field" key={key}>
                        {label}
                        <input
                          type="number"
                          required={key === "slices"}
                          min="1"
                          max={max}
                          step="1"
                          value={size[key] ?? ""}
                          onChange={(e) =>
                            update("sizes", size.id, {
                              [key]: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                        />
                      </label>
                    ))}
                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        checked={size.available}
                        onChange={(e) => update("sizes", size.id, { available: e.target.checked })}
                      />{" "}
                      Disponível
                    </label>
                    <label className="field">
                      Tempo de forno (minutos)
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={size.ovenMinutes ?? 10}
                        onChange={(e) =>
                          update("sizes", size.id, { ovenMinutes: Number(e.target.value) })
                        }
                      />
                      <small>Reserva antes do horário agendado.</small>
                    </label>
                    <label className="field">
                      Espaços ocupados no forno
                      <input
                        type="number"
                        min="0.25"
                        max="20"
                        step="0.25"
                        value={size.ovenUnits ?? 1}
                        onChange={(e) =>
                          update("sizes", size.id, { ovenUnits: Number(e.target.value) })
                        }
                      />
                      <small>Ex.: grande ocupa 2; brotinho ocupa 0,5.</small>
                    </label>
                    <button
                      className="button button-outline button-small"
                      type="button"
                      disabled={config.sizes.length === 1}
                      aria-label={`Excluir tamanho ${index + 1}`}
                      onClick={() => remove("sizes", size.id)}
                    >
                      Excluir
                    </button>
                    <fieldset className="pizza-size-formats">
                      <legend>Formatos de {size.name || "novo tamanho"}</legend>
                      <div className="pizza-size-format-choices">
                        {pizzaFormats.map((count) => {
                          const checked = counts.includes(count);
                          return (
                            <label className="checkbox-field" key={count}>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={checked && counts.length === 1}
                                onChange={(event) =>
                                  toggleFormat(size, count, event.target.checked)
                                }
                              />
                              {pizzaFormatLabel(count)}
                            </label>
                          );
                        })}
                      </div>
                      <small>Marque pelo menos um formato por tamanho.</small>
                    </fieldset>
                  </div>
                );
              })}
              <button
                className="button button-outline button-small"
                type="button"
                disabled={config.sizes.length >= 12}
                onClick={() =>
                  set("sizes", [
                    ...config.sizes,
                    {
                      id: uuid(),
                      name: "Novo tamanho",
                      diameterCm: 30,
                      slices: 6,
                      maxFlavors: 2,
                      available: true,
                    },
                  ])
                }
              >
                Adicionar tamanho
              </button>
            </div>
          )}
          {visible("counts") && (
            <div className="pizza-count-pricing">
              <h3>Preços por quantidade de sabores</h3>
              <p className="small-copy muted">
                Aqui você decide se a quantidade de sabores muda o preço de cada tamanho. A regra
                principal, escolhida na aba Como cobrar, é:{" "}
                <strong>{pizzaPricingLabels[config.pricing]}</strong>. Fatias são os cortes da
                pizza; sabores são as opções que o cliente combina.
              </p>
              <div className="pizza-count-guide">
                <article>
                  <span>01 · MANTER</span>
                  <h4>Usar a regra dos sabores</h4>
                  <p>
                    Segue a regra da aba Como cobrar, sem cobrar nada a mais pela quantidade de
                    sabores.
                  </p>
                  <small>
                    Exemplo: se a regra principal resultar em R$ 50,00, a pizza custa R$ 50,00.
                  </small>
                </article>
                <article>
                  <span>02 · SUBSTITUIR</span>
                  <h4>Preço fixo por quantidade de sabores</h4>
                  <p>
                    Você define o valor total para cada formato habilitado no tamanho. Esse valor
                    substitui o cálculo principal.
                  </p>
                  <small>
                    Exemplo: 3 sabores por R$ 59,90 → a pizza custa R$ 59,90, qualquer que seja a
                    combinação disponível.
                  </small>
                </article>
                <article>
                  <span>03 · SOMAR</span>
                  <h4>Regra dos sabores + acréscimo</h4>
                  <p>
                    Calcula pela regra principal e soma o acréscimo configurado para aquela
                    quantidade. O acréscimo é por pizza, não por sabor.
                  </p>
                  <small>
                    Exemplo: base de R$ 50,00 + R$ 5,00 para 3 sabores → a pizza custa R$ 55,00.
                  </small>
                </article>
              </div>
              <p className="small-copy muted">
                Exemplos ilustrativos, antes dos adicionais. Campos vazios usam a regra principal,
                sem acréscimo. Massa, borda e adicionais são somados depois, uma única vez por
                pizza.
              </p>
              {config.sizes.map((size) => (
                <fieldset className="pizza-count-pricing-size" key={size.id}>
                  <legend>
                    {size.name} · {size.slices} fatias
                  </legend>
                  <label className="field">
                    Cobrança por quantidade em {size.name}
                    <select
                      aria-describedby={`pizza-count-help-${size.id}`}
                      value={size.flavorCountPricing?.mode || "normal"}
                      onChange={(e) =>
                        update("sizes", size.id, {
                          flavorCountPricing:
                            e.target.value === "normal"
                              ? undefined
                              : { mode: e.target.value, prices: {} },
                        })
                      }
                    >
                      <option value="normal">Usar a regra dos sabores</option>
                      <option value="fixed">Preço fixo por quantidade de sabores</option>
                      <option value="extra">Regra dos sabores + acréscimo</option>
                    </select>
                  </label>
                  <p className="pizza-count-mode-help" id={`pizza-count-help-${size.id}`}>
                    {size.flavorCountPricing?.mode === "fixed"
                      ? "Preencha o preço total da pizza para cada quantidade de sabores. Campo vazio: usa a regra principal. Não é o preço de cada pedaço."
                      : size.flavorCountPricing?.mode === "extra"
                        ? "Preencha somente o valor a somar à regra principal, uma vez por pizza. Campo vazio ou R$ 0,00: sem acréscimo."
                        : `Este tamanho segue a regra principal: ${pizzaPricingLabels[config.pricing]}. A quantidade de sabores não gera uma cobrança extra.`}
                  </p>
                  {size.flavorCountPricing && (
                    <div className="pizza-count-price-fields">
                      {pizzaFlavorCounts(size).map((count) => (
                        <label
                          className="field"
                          key={`${size.id}-${size.flavorCountPricing.mode}-${count}`}
                        >
                          {pizzaFormatLabel(count)} ·{" "}
                          {size.flavorCountPricing.mode === "fixed"
                            ? "Preço (R$)"
                            : "Acréscimo (R$)"}
                          <MoneyInput
                            aria-label={`${size.flavorCountPricing.mode === "fixed" ? "Preço fixo" : "Acréscimo"} de ${count} ${count === 1 ? "sabor" : "sabores"} em ${size.name}`}
                            cents={size.flavorCountPricing.prices[count]}
                            onChange={(value) => {
                              const prices = { ...size.flavorCountPricing.prices };
                              if (Number.isFinite(value)) prices[count] = value;
                              else delete prices[count];
                              update("sizes", size.id, {
                                flavorCountPricing: { ...size.flavorCountPricing, prices },
                              });
                            }}
                            placeholder="Regra normal"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>
              ))}
            </div>
          )}
          {visible("prices") && (
            <div>
              <h3>Sabores e preços por tamanho</h3>
              <p className="small-copy muted">
                {config.pricing === "fixed"
                  ? "No preço fixo, marque quais sabores são oferecidos em cada tamanho. O valor é definido na aba Como cobrar."
                  : "Deixe o preço vazio para não oferecer o sabor naquele tamanho. Nomes e preços são próprios deste montador."}
              </p>
              <div className="pizza-matrix">
                <table>
                  <thead>
                    <tr>
                      <th>Sabor</th>
                      {section === "all" && <th>Aparência na prévia</th>}
                      {config.sizes.map((s) => (
                        <th key={s.id}>
                          {s.name} {config.pricing === "fixed" ? "· disponível" : "(R$)"}
                        </th>
                      ))}
                      <th>Disponível</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.flavors.map((flavor, index) => (
                      <tr key={flavor.id}>
                        <td>
                          <input
                            aria-label={`Nome do sabor ${index + 1}`}
                            required
                            maxLength={80}
                            value={flavor.name}
                            onChange={(e) => update("flavors", flavor.id, { name: e.target.value })}
                          />
                        </td>
                        {section === "all" && (
                          <td>
                            <select
                              aria-label={`Aparência de ${flavor.name}`}
                              value={flavor.appearance || "auto"}
                              onChange={(e) =>
                                update("flavors", flavor.id, { appearance: e.target.value })
                              }
                            >
                              {Object.entries(pizzaAppearances).map(([key, label]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              inputMode="url"
                              aria-label={`Foto vista de cima de ${flavor.name}`}
                              value={flavor.previewImage || ""}
                              placeholder="Foto vista de cima (URL opcional)"
                              onChange={(e) =>
                                update("flavors", flavor.id, { previewImage: e.target.value })
                              }
                            />
                          </td>
                        )}
                        {config.sizes.map((s) => (
                          <td key={s.id}>
                            {config.pricing === "fixed" ? (
                              <input
                                type="checkbox"
                                aria-label={`Oferecer ${flavor.name} em ${s.name}`}
                                checked={flavor.prices[s.id] !== 0}
                                onChange={(e) => {
                                  const prices = { ...flavor.prices };
                                  if (e.target.checked) delete prices[s.id];
                                  else prices[s.id] = 0;
                                  update("flavors", flavor.id, { prices });
                                }}
                              />
                            ) : (
                              <MoneyInput
                                aria-label={`Preço de ${flavor.name} em ${s.name}`}
                                cents={flavor.prices[s.id]}
                                onChange={(value) => {
                                  const prices = { ...flavor.prices };
                                  if (Number.isFinite(value)) prices[s.id] = value;
                                  else delete prices[s.id];
                                  update("flavors", flavor.id, { prices });
                                }}
                              />
                            )}
                          </td>
                        ))}
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Disponibilidade do sabor ${index + 1}`}
                            checked={flavor.available}
                            onChange={(e) =>
                              update("flavors", flavor.id, { available: e.target.checked })
                            }
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="button button-outline button-small"
                            aria-label={`Excluir sabor ${index + 1}`}
                            disabled={config.flavors.length === 1}
                            onClick={() => remove("flavors", flavor.id)}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="button button-outline button-small"
                disabled={config.flavors.length >= 80}
                onClick={() =>
                  set("flavors", [
                    ...config.flavors,
                    { id: uuid(), name: "Novo sabor", available: true, prices: {} },
                  ])
                }
              >
                Adicionar sabor
              </button>
              {catalog.some((p) => p.category === "Pizza" && !p.pizza && p.id !== product.id) && (
                <button
                  type="button"
                  className="button button-outline button-small"
                  onClick={() => {
                    const additions = catalog
                      .filter(
                        (p) =>
                          p.category === "Pizza" &&
                          !p.pizza &&
                          !config.flavors.some(
                            (f) => f.name.toLocaleLowerCase() === p.name.toLocaleLowerCase(),
                          ),
                      )
                      .map((p) => ({
                        id: uuid(),
                        name: p.name,
                        previewImage: p.cutoutImage || p.image || "",
                        available: p.status === "Disponível",
                        prices: { [config.sizes[0].id]: p.priceCents },
                      }));
                    set("flavors", [...config.flavors, ...additions].slice(0, 80));
                  }}
                >
                  Copiar sabores do catálogo
                </button>
              )}
              <small>
                Ao copiar, somente o primeiro tamanho recebe o preço atual. Revise os preços antes
                de salvar. Alterações futuras no catálogo não alteram esta tabela.
              </small>
            </div>
          )}
          {visible("options") &&
            [
              ["doughs", "Massas", "massa"],
              ["edges", "Bordas", "borda"],
            ].map(([key, title, noun]) => (
              <div key={key}>
                <h3>{title}</h3>
                <p className="small-copy muted">
                  O cliente escolhe exatamente uma opção. Cadastre uma opção de valor zero se
                  estiver inclusa.
                </p>
                {config[key].map((v, index) => (
                  <div className="pizza-config-row" key={v.id}>
                    <label className="field">
                      Nome da {noun}
                      <input
                        required
                        maxLength={60}
                        value={v.name}
                        onChange={(e) => update(key, v.id, { name: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      Acréscimo (R$)
                      <MoneyInput
                        required
                        cents={v.priceCents}
                        onChange={(priceCents) => update(key, v.id, { priceCents })}
                      />
                    </label>
                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        checked={v.available}
                        onChange={(e) => update(key, v.id, { available: e.target.checked })}
                      />{" "}
                      Disponível
                    </label>
                    <label className="field">
                      Tamanhos permitidos
                      <select
                        multiple
                        value={v.allowedSizeIds || config.sizes.map((s) => s.id)}
                        onChange={(e) =>
                          update(key, v.id, {
                            allowedSizeIds: [...e.target.selectedOptions].map((o) => o.value),
                          })
                        }
                      >
                        {config.sizes.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Combina com
                      <select
                        multiple
                        value={v.allowedFlavorKinds || ["savory", "sweet"]}
                        onChange={(e) =>
                          update(key, v.id, {
                            allowedFlavorKinds: [...e.target.selectedOptions].map((o) => o.value),
                          })
                        }
                      >
                        <option value="savory">Salgadas</option>
                        <option value="sweet">Doces</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      className="button button-outline button-small"
                      disabled={config[key].length === 1}
                      aria-label={`Excluir ${noun} ${index + 1}`}
                      onClick={() => remove(key, v.id)}
                    >
                      Excluir
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="button button-outline button-small"
                  disabled={config[key].length >= 20}
                  onClick={() =>
                    set(key, [
                      ...config[key],
                      { id: uuid(), name: `Nova ${noun}`, priceCents: 0, available: true },
                    ])
                  }
                >
                  Adicionar {noun}
                </button>
              </div>
            ))}
          <p className="small-copy muted">
            O preço exibido no cardápio será o menor total de uma combinação disponível. Custos e
            margem da pizza montada ficam sem apuração até existir ficha técnica por combinação.
          </p>
        </>
      )}
    </section>
  );
}
