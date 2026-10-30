import { useState } from "react";
import { useAction } from "../hooks/useApplication";
import { uuid } from "../core/domain.ts";
import MoneyInput from "./MoneyInput";
import { ComboArtwork, ComboContents } from "./ComboPresentation";
import { comboStartingPrice } from "../core/restaurant.ts";
import { comboGroupMode, changeComboGroupMode } from "../application/comboDraft";
import { money } from "../lib/data";
import "./RestaurantPanel.css";

function RecipeForm({ product, target, tenant, services, storeId }) {
  const option =
    target.kind === "flavor"
      ? product.pizza.flavors.find((f) => f.id === target.id)
      : target.kind === "dough"
        ? product.pizza.doughs.find((f) => f.id === target.id)
        : target.kind === "edge"
          ? product.pizza.edges.find((f) => f.id === target.id)
          : target.kind === "flavorExtra"
            ? product.pizza.flavors
                .find((f) => f.id === target.id)
                ?.extras?.find((e) => e.id === target.extraId)
            : target.kind === "extra"
              ? product.extras.find((e) => e.id === target.extraId)
              : product;
  const initial = target.kind === "flavor" ? option.recipeBySize?.[target.sizeId] : option.recipe;
  const [rows, setRows] = useState(() => structuredClone(initial || [])),
    [message, setMessage] = useState("");
  const action = useAction(),
    inventory = tenant.restaurant?.inventory || [];
  const cost = rows.reduce(
    (sum, r) =>
      sum + r.quantity * (inventory.find((i) => i.id === r.ingredientId)?.costPerUnitCents || 0),
    0,
  );
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        action.run(
          () => services.saveRecipe(storeId, product.id, target, rows),
          () => setMessage("Ficha técnica salva."),
        );
      }}
    >
      <p className="small-copy muted">
        Na ficha de um sabor, informe a cobertura para uma pizza inteira daquele tamanho; a
        combinação usa a proporção escolhida. Massa e borda são somadas inteiras. Use a ficha do
        produto para embalagem e outros custos comuns. Retiradas de ingredientes não reduzem a baixa
        automaticamente. Fichas vazias não consomem estoque; sem ficha completa, o custo da montagem
        permanece desconhecido.
      </p>
      {rows.map((row, index) => (
        <div className="recipe-row" key={index}>
          <label className="field">
            Ingrediente
            <select
              required
              value={row.ingredientId}
              onChange={(e) =>
                setRows((v) =>
                  v.map((r, i) => (i === index ? { ...r, ingredientId: e.target.value } : r)),
                )
              }
            >
              <option value="">Selecione</option>
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Quantidade
            <input
              type="number"
              min="0.0001"
              step="0.0001"
              required
              value={row.quantity}
              onChange={(e) =>
                setRows((v) =>
                  v.map((r, i) => (i === index ? { ...r, quantity: Number(e.target.value) } : r)),
                )
              }
            />
          </label>
          <button
            className="button button-outline button-small"
            type="button"
            onClick={() => setRows((v) => v.filter((_, i) => i !== index))}
          >
            Remover ingrediente {index + 1}
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button button-outline"
        disabled={!inventory.length}
        onClick={() => setRows((v) => [...v, { ingredientId: "", quantity: 1 }])}
      >
        Adicionar ingrediente à ficha
      </button>
      <div className="recipe-summary">
        Custo desta ficha: <strong>{money(Math.round(cost) / 100)}</strong> · valores de compra
        atuais, sem despesas fixas.
      </div>
      <button className="button button-dark" disabled={action.busy}>
        Salvar ficha técnica
      </button>
      {message && <p role="status">{message}</p>}
      {action.error && (
        <p className="form-error" role="alert">
          {action.error}
        </p>
      )}
    </form>
  );
}
function Inventory({ tenant, company, services }) {
  const action = useAction(),
    [message, setMessage] = useState("");
  const inventory = tenant.restaurant?.inventory || [];
  const [item, setItem] = useState({
      id: "",
      name: "",
      unit: "g",
      stock: 0,
      costPerUnitCents: 0,
      minimum: 0,
    }),
    [adjust, setAdjust] = useState({ ingredientId: "", quantity: 0, reason: "" });
  const [productId, setProductId] = useState(tenant.products[0]?.id || ""),
    [targetKey, setTargetKey] = useState("product");
  const product = tenant.products.find((p) => p.id === productId);
  const targets = [
    { key: "product", label: "Produto / embalagem", target: { kind: "product" } },
    ...(product?.extras || []).map((e) => ({
      key: `extra:${e.id}`,
      label: `Adicional do produto: ${e.name}`,
      target: { kind: "extra", extraId: e.id },
    })),
    ...(product?.pizza
      ? [
          ...product.pizza.flavors.flatMap((f) =>
            product.pizza.sizes.map((s) => ({
              key: `f:${f.id}:${s.id}`,
              label: `Sabor ${f.name} · ${s.name}`,
              target: { kind: "flavor", id: f.id, sizeId: s.id },
            })),
          ),
          ...product.pizza.doughs.map((d) => ({
            key: `d:${d.id}`,
            label: `Massa: ${d.name}`,
            target: { kind: "dough", id: d.id },
          })),
          ...product.pizza.edges.map((d) => ({
            key: `e:${d.id}`,
            label: `Borda: ${d.name}`,
            target: { kind: "edge", id: d.id },
          })),
          ...product.pizza.flavors.flatMap((f) =>
            (f.extras || []).map((e) => ({
              key: `x:${f.id}:${e.id}`,
              label: `${f.name} · adicional ${e.name}`,
              target: { kind: "flavorExtra", id: f.id, extraId: e.id },
            })),
          ),
        ]
      : []),
  ];
  const chosen = targets.find((v) => v.key === targetKey) || targets[0];
  return (
    <section className="restaurant-stack">
      <div className="restaurant-intro">
        <span>INGREDIENTES E CUSTOS</span>
        <h2>Estoque com ficha técnica.</h2>
        <p>
          As fichas cadastradas baixam ingredientes ao confirmar o pedido. Cancelar antes do preparo
          devolve o saldo; depois do preparo, a baixa é mantida como consumo. Corrija perdas e
          devoluções pelos ajustes com motivo.
        </p>
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {action.error && (
        <p className="form-error" role="alert">
          {action.error}
        </p>
      )}
      <div className="restaurant-grid">
        <form
          className="panel form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            action.run(
              () => services.saveInventoryItem(company.id, { ...item, id: item.id || uuid() }),
              () => {
                setMessage("Ingrediente salvo.");
                setItem({ id: "", name: "", unit: "g", stock: 0, costPerUnitCents: 0, minimum: 0 });
              },
            );
          }}
        >
          <h3>{item.id ? "Editar ingrediente" : "Cadastrar ingrediente"}</h3>
          <label className="field">
            Nome do ingrediente
            <input
              required
              maxLength="80"
              value={item.name}
              onChange={(e) => setItem({ ...item, name: e.target.value })}
            />
          </label>
          <label className="field">
            Unidade
            <select
              disabled={!!item.id}
              value={item.unit}
              onChange={(e) => setItem({ ...item, unit: e.target.value })}
            >
              <option value="g">Gramas</option>
              <option value="ml">Mililitros</option>
              <option value="un">Unidades</option>
            </select>
          </label>
          <label className="field">
            Saldo inicial
            <input
              type="number"
              min="0"
              step="0.0001"
              disabled={!!item.id}
              value={item.stock}
              onChange={(e) => setItem({ ...item, stock: Number(e.target.value) })}
            />
          </label>
          <label className="field">
            Custo em R$ por {item.unit}
            <input
              type="number"
              min="0"
              step="0.000001"
              required
              value={item.costPerUnitCents / 100}
              onChange={(e) =>
                setItem({
                  ...item,
                  costPerUnitCents: Math.round(Number(e.target.value) * 1e8) / 1e6,
                })
              }
            />
            <small>Exemplo: queijo a R$ 40/kg → R$ 0,04 por grama.</small>
          </label>
          <label className="field">
            Alerta de saldo mínimo
            <input
              type="number"
              min="0"
              step="0.0001"
              value={item.minimum}
              onChange={(e) => setItem({ ...item, minimum: Number(e.target.value) })}
            />
          </label>
          <button className="button button-dark" disabled={action.busy}>
            Salvar ingrediente
          </button>
          {item.id && (
            <button
              className="button button-outline"
              type="button"
              onClick={() =>
                setItem({ id: "", name: "", unit: "g", stock: 0, costPerUnitCents: 0, minimum: 0 })
              }
            >
              Cancelar edição
            </button>
          )}
        </form>
        <form
          className="panel form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            action.run(
              () =>
                services.adjustStock(
                  company.id,
                  adjust.ingredientId,
                  adjust.quantity,
                  adjust.reason,
                ),
              () => {
                setMessage("Ajuste registrado.");
                setAdjust({ ...adjust, quantity: 0, reason: "" });
              },
            );
          }}
        >
          <h3>Entrada, perda ou ajuste</h3>
          <label className="field">
            Ingrediente para ajuste
            <select
              required
              value={adjust.ingredientId}
              onChange={(e) => setAdjust({ ...adjust, ingredientId: e.target.value })}
            >
              <option value="">Selecione</option>
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Quantidade (negativa para saída)
            <input
              type="number"
              step="0.0001"
              required
              value={adjust.quantity}
              onChange={(e) => setAdjust({ ...adjust, quantity: Number(e.target.value) })}
            />
          </label>
          <label className="field">
            Motivo do ajuste
            <input
              required
              maxLength="200"
              value={adjust.reason}
              onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })}
            />
          </label>
          <button className="button button-dark" disabled={action.busy}>
            Registrar ajuste de estoque
          </button>
        </form>
      </div>
      <div className="panel">
        <h3>Saldos dos ingredientes</h3>
        {inventory.length === 0 ? (
          <p>Cadastre os ingredientes para começar.</p>
        ) : (
          inventory.map((i) => (
            <div className="kitchen-line" key={i.id}>
              <strong>{i.name}</strong>
              <p className={i.stock <= i.minimum ? "stock-low" : ""}>
                {Number(i.stock.toFixed(4))} {i.unit}
                {i.stock <= i.minimum ? " · Saldo baixo" : ""}
              </p>
              <button
                className="button button-outline button-small"
                onClick={() => setItem({ ...i })}
              >
                Editar {i.name}
              </button>
            </div>
          ))
        )}
      </div>
      <section className="panel restaurant-stack">
        <h3>Ficha técnica</h3>
        <div className="form-grid">
          <label className="field">
            Produto da ficha
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setTargetKey("product");
              }}
            >
              {tenant.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Parte da ficha
            <select value={chosen.key} onChange={(e) => setTargetKey(e.target.value)}>
              {targets.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {product && (
          <RecipeForm
            key={`${product.id}-${chosen.key}`}
            product={product}
            target={chosen.target}
            tenant={tenant}
            services={services}
            storeId={company.id}
          />
        )}
      </section>
      <div className="panel">
        <h3>Últimos movimentos</h3>
        {tenant.restaurant?.movements
          .slice(-30)
          .reverse()
          .map((m) => (
            <p key={m.id}>
              {inventory.find((i) => i.id === m.ingredientId)?.name} · {m.quantity > 0 ? "+" : ""}
              {Number(m.quantity.toFixed(4))} · {m.reason}
            </p>
          ))}
      </div>
    </section>
  );
}
function ComboForm({ product, tenant, onSave, onCancel, busy, error }) {
  const [draftError, setDraftError] = useState("");
  const [draft, setDraft] = useState(
    () =>
      product || {
        id: uuid(),
        name: "",
        priceCents: 0,
        category: "Pizza",
        status: "Disponível",
        description: "",
        ingredients: [],
        extras: [],
        combo: { groups: [] },
      },
  );
  const changeGroup = (id, patch) =>
    setDraft((v) => ({
      ...v,
      combo: { groups: v.combo.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) },
    }));
  const options = tenant.products.filter((p) => !p.combo && p.id !== draft.id);
  const preview = {
    ...draft,
    combo: { groups: draft.combo.groups.filter((g) => g.options.length > 0) },
  };
  const previewPrice = preview.combo.groups.length
    ? comboStartingPrice(preview, tenant.products)
    : null;
  const addGroup = (mode) =>
    setDraft({
      ...draft,
      combo: {
        groups: [...draft.combo.groups, { id: uuid(), name: "", quantity: 1, options: [], mode }],
      },
    });
  return (
    <form
      className="panel form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        setDraftError("");
        onSave(draft);
      }}
    >
      <h3>{product ? "Editar combo" : "Novo combo"}</h3>
      <label className="field">
        Nome do combo
        <input
          required
          maxLength="80"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>
      <label className="field">
        Descrição do combo
        <textarea
          maxLength="500"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </label>
      <label className="field">
        Preço do conjunto (R$)
        <MoneyInput
          cents={draft.priceCents}
          onChange={(priceCents) => setDraft({ ...draft, priceCents })}
        />
      </label>
      <label className="field">
        Situação
        <select
          value={draft.status}
          onChange={(e) => setDraft({ ...draft, status: e.target.value })}
        >
          <option>Disponível</option>
          <option>Indisponível</option>
        </select>
      </label>
      <p className="small-copy muted">
        Item fixo incluído: uma Calabresa + uma Mussarela entram juntas. Grupo de escolha: o cliente
        escolhe Calabresa OU Mussarela. Você pode combinar os dois tipos no mesmo combo. O valor
        inclui as quantidades cadastradas; o acréscimo por escolha é cobrado uma vez por grupo.
        Pizzas usam o tamanho definido aqui. Ao permitir montagem, todos os sabores desse tamanho
        estão incluídos no preço do combo; massas, bordas e adicionais pagos são somados por unidade
        de pizza do grupo. Sem montagem, usa a primeira massa e borda compatíveis, já incluídas no
        conjunto.
      </p>
      <section className="combo-admin-preview" aria-label="Prévia do combo antes de salvar">
        <h3>Confira o que o cliente vai receber</h3>
        {preview.combo.groups.length ? (
          <>
            <div className="combo-admin-preview-body">
              <ComboArtwork product={preview} products={tenant.products} />
              <div>
                <p>
                  {preview.combo.groups.every((g) => comboGroupMode(g) === "included")
                    ? "Todos estes itens entram juntos no combo."
                    : "Os itens fixos entram juntos. Em cada grupo de escolha, o cliente seleciona apenas uma opção."}
                </p>
                <ComboContents product={preview} products={tenant.products} />
                <p>
                  <strong>
                    {previewPrice === null
                      ? "Revise os itens indisponíveis"
                      : `A partir de ${money(previewPrice / 100)}`}
                  </strong>
                </p>
              </div>
            </div>
          </>
        ) : (
          <p>Adicione um item fixo ou um grupo de escolha para ver a composição aqui.</p>
        )}
      </section>
      {draft.combo.groups.map((g, index) => (
        <fieldset key={g.id} className="pizza-count-pricing-size">
          <legend>{g.name || "Grupo de escolha"}</legend>
          <label className="field">
            Funcionamento do grupo {index + 1}
            <select
              value={comboGroupMode(g)}
              onChange={(e) => {
                try {
                  setDraftError("");
                  setDraft({
                    ...draft,
                    combo: {
                      groups: changeComboGroupMode(
                        draft.combo.groups,
                        g.id,
                        e.target.value,
                        tenant.products,
                        uuid,
                      ),
                    },
                  });
                } catch (e) {
                  setDraftError(e.message);
                }
              }}
            >
              <option value="included">Item fixo incluído — entra sempre</option>
              <option value="choice">Grupo de escolha — uma opção</option>
            </select>
          </label>
          <p className="small-copy muted">
            {comboGroupMode(g) === "included"
              ? "Selecione um produto para este item. Para incluir outro produto junto, adicione mais um item fixo."
              : "Marque as alternativas. O cliente escolhe uma delas, na quantidade abaixo. Ao mudar para item fixo, todas as alternativas serão separadas em itens incluídos, cada uma com essa quantidade."}
          </p>
          <label className="field">
            Nome do grupo
            <input
              required
              maxLength="70"
              value={g.name}
              onChange={(e) => changeGroup(g.id, { name: e.target.value })}
            />
          </label>
          <label className="field">
            Unidades incluídas
            <input
              type="number"
              required
              min="1"
              max="10"
              value={g.quantity}
              onChange={(e) => changeGroup(g.id, { quantity: Number(e.target.value) })}
            />
          </label>
          {options.map((p) => {
            const o = g.options.find((o) => o.productId === p.id);
            return (
              <div className="kitchen-line" key={p.id}>
                <label className="checkbox-field">
                  <input
                    type={comboGroupMode(g) === "included" ? "radio" : "checkbox"}
                    name={comboGroupMode(g) === "included" ? `fixed-${g.id}` : undefined}
                    checked={!!o}
                    onChange={(e) =>
                      changeGroup(g.id, {
                        name:
                          comboGroupMode(g) === "included" &&
                          (!g.name ||
                            g.name ===
                              options.find((item) => item.id === g.options[0]?.productId)?.name)
                            ? p.name
                            : g.name,
                        options: e.target.checked
                          ? [
                              ...(comboGroupMode(g) === "included" ? [] : g.options),
                              {
                                productId: p.id,
                                surchargeCents: 0,
                                sizeId: p.pizza?.sizes.find((s) => s.available)?.id,
                                ...(p.pizza ? { customizePizza: p.pizza.flavors.length > 1 } : {}),
                              },
                            ]
                          : g.options.filter((v) => v.productId !== p.id),
                      })
                    }
                  />
                  {p.name}
                </label>
                {o && (
                  <div className="form-grid">
                    <label className="field">
                      Acréscimo por escolha de {p.name}
                      <MoneyInput
                        cents={o.surchargeCents}
                        onChange={(surchargeCents) =>
                          changeGroup(g.id, {
                            options: g.options.map((v) =>
                              v.productId === p.id ? { ...v, surchargeCents } : v,
                            ),
                          })
                        }
                      />
                    </label>
                    {p.pizza && (
                      <div className="form-stack">
                        <label className="checkbox-field">
                          <input
                            type="checkbox"
                            checked={!!o.customizePizza}
                            disabled={p.pizza.flavors.length > 1}
                            onChange={(e) =>
                              changeGroup(g.id, {
                                options: g.options.map((v) =>
                                  v.productId === p.id
                                    ? { ...v, customizePizza: e.target.checked }
                                    : v,
                                ),
                              })
                            }
                          />
                          Permitir escolher sabores, massa e borda de {p.name}
                        </label>
                        <label className="field">
                          Tamanho de {p.name}
                          <select
                            value={o.sizeId || ""}
                            onChange={(e) =>
                              changeGroup(g.id, {
                                options: g.options.map((v) =>
                                  v.productId === p.id ? { ...v, sizeId: e.target.value } : v,
                                ),
                              })
                            }
                          >
                            <option value="">Selecione</option>
                            {p.pizza.sizes
                              .filter((s) => s.available)
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                          </select>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <button
            type="button"
            className="button button-outline button-small"
            onClick={() =>
              setDraft({
                ...draft,
                combo: { groups: draft.combo.groups.filter((v) => v.id !== g.id) },
              })
            }
          >
            Remover grupo {g.name}
          </button>
        </fieldset>
      ))}
      <div className="restaurant-actions">
        <button
          type="button"
          className="button button-outline"
          disabled={draft.combo.groups.length >= 10}
          onClick={() => addGroup("included")}
        >
          Adicionar item fixo incluído
        </button>
        <button
          type="button"
          className="button button-outline"
          disabled={draft.combo.groups.length >= 10}
          onClick={() => addGroup("choice")}
        >
          Adicionar grupo de escolha
        </button>
      </div>
      {draftError && (
        <p className="form-error" role="alert">
          {draftError}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="restaurant-actions">
        <button className="button button-dark" disabled={busy}>
          Salvar combo
        </button>
        <button type="button" className="button button-outline" onClick={onCancel}>
          Cancelar combo
        </button>
      </div>
    </form>
  );
}
function Combos({ tenant, company, services }) {
  const [selected, setSelected] = useState(null),
    [message, setMessage] = useState("");
  const action = useAction();
  return (
    <section className="restaurant-stack">
      <div className="restaurant-intro">
        <span>UM PEDIDO COMPLETO</span>
        <h2>Combos da casa.</h2>
        <p>Crie conjuntos com escolhas de pizzas, bebidas e acompanhamentos.</p>
      </div>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {selected ? (
        <ComboForm
          key={selected.id}
          product={selected.id === "new" ? null : selected}
          tenant={tenant}
          busy={action.busy}
          error={action.error}
          onCancel={() => setSelected(null)}
          onSave={(p) =>
            action.run(
              () => services.saveProduct(company.id, p),
              () => {
                setSelected(null);
                setMessage("Combo salvo no cardápio.");
              },
            )
          }
        />
      ) : (
        <>
          <button className="button button-dark" onClick={() => setSelected({ id: "new" })}>
            Criar combo
          </button>
          <div className="restaurant-grid">
            {tenant.products
              .filter((p) => p.combo)
              .map((p) => (
                <article className="panel" key={p.id}>
                  <h3>{p.name}</h3>
                  <p>
                    {money(p.priceCents / 100)} · {p.combo.groups.length} grupos · {p.status}
                  </p>
                  <button
                    className="button button-outline"
                    onClick={() => {
                      action.setError("");
                      setSelected(p);
                    }}
                  >
                    Editar {p.name}
                  </button>
                </article>
              ))}
          </div>
        </>
      )}
    </section>
  );
}
export default function CatalogOperations(props) {
  if (!props.services.createStaffOrder)
    return (
      <p className="notice">
        Recursos disponíveis localmente; integração remota em etapa posterior.
      </p>
    );
  return props.view === "inventory" ? <Inventory {...props} /> : <Combos {...props} />;
}
