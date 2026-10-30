import { useState } from "react";
import { Pizza, Plus, Check } from "lucide-react";
import PizzaConfigEditor from "./PizzaConfigEditor";
import { createPizzaConfig } from "../application/pizzaDraft.ts";
import { useAction } from "../hooks/useApplication";
import { uuid } from "../core/domain.ts";
import { money } from "../lib/data";
import "./PizzaManagement.css";

function PricingForm({ product, catalog, onSave, onDirty, onSaved, isNew, onCancelNew }) {
  const [draft, setDraft] = useState(product);
  const [message, setMessage] = useState("");
  const [editorVersion, setEditorVersion] = useState(0);
  const [section, setSection] = useState("general");
  const [dirty, setDirty] = useState(!!isNew);
  const action = useAction();
  const change = (patch) => {
    setDraft((v) => ({ ...v, ...patch }));
    setDirty(true);
    onDirty(true);
    setMessage("");
    action.setError("");
  };
  return (
    <form
      className="form-stack pizza-pricing-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.pizza) {
          action.setError("Ative a configuração de pizza para definir tamanhos e preços.");
          return;
        }
        action.run(
          () => onSave(draft),
          () => {
            setDirty(false);
            onDirty(false);
            setMessage("Tamanhos e preços salvos.");
            onSaved();
          },
        );
      }}
    >
      <div className="pizza-management-form-heading">
        <div>
          <span className="section-kicker">CONFIGURAÇÃO DO PRODUTO</span>
          <h2>{draft.name}</h2>
        </div>
        <span className="tag">
          {draft.pizza ? `${draft.pizza.sizes.length} tamanhos` : "Preço único"}
        </span>
      </div>
      <label className="field">
        Nome da pizza ou montador
        <input
          required
          maxLength={80}
          value={draft.name}
          onChange={(e) => change({ name: e.target.value })}
        />
      </label>
      <div className="pizza-management-tabs" role="tablist" aria-label="Configurações da pizzaria">
        {[
          ["general", "Como cobrar"],
          ["prices", "Preços por tamanho"],
          ["sizes", "Tamanhos e fatias"],
          ["counts", "Preços por sabores"],
          ["options", "Massas e bordas"],
          ["rules", "Combinações e ingredientes"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={section === key}
            onClick={() => setSection(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <PizzaConfigEditor
        key={editorVersion}
        section={section}
        product={draft}
        catalog={catalog}
        onChange={(pizza) => change({ pizza })}
      />
      {!draft.pizza && (
        <p className="notice">
          Este produto usa preço único de {money(draft.priceCents / 100)}. Ative a configuração
          acima para cadastrar preços por tamanho. As mudanças só entram em vigor ao salvar.
        </p>
      )}
      {action.error && (
        <p className="form-error" role="alert">
          {action.error}
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <div className="pizza-management-save">
        <span className="muted small-copy">
          {dirty
            ? "Você tem alterações ainda não salvas."
            : "Os valores salvos são usados no cardápio e no pedido."}
        </span>
        <div>
          <button
            type="button"
            className="button button-outline"
            disabled={action.busy || !dirty}
            onClick={() => {
              if (isNew) {
                onCancelNew();
                return;
              }
              setDraft(product);
              setEditorVersion((v) => v + 1);
              setDirty(false);
              onDirty(false);
              setMessage("");
              action.setError("");
            }}
          >
            Descartar alterações
          </button>
          <button className="button button-dark" disabled={action.busy || !dirty}>
            <Check size={16} />
            {action.busy ? "Salvando…" : "Salvar tamanhos e preços"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function PizzaManagement({ company, products, services, onSaved }) {
  const pizzas = products.filter((p) => p.category === "Pizza");
  const [selectedId, setSelectedId] = useState(
    () =>
      pizzas.find((p) => p.pizza?.menuPlacement === "builder")?.id ||
      pizzas.find((p) => p.pizza)?.id ||
      pizzas[0]?.id ||
      "",
  );
  const [newProduct, setNewProduct] = useState(null);
  const [dirty, setDirty] = useState(false);
  const linking = useAction();
  const [catalogVersion, setCatalogVersion] = useState(0);
  const selected = newProduct || pizzas.find((p) => p.id === selectedId);
  return (
    <section className="panel pizza-management">
      <div className="pizza-management-heading">
        <span>
          <Pizza size={28} />
        </span>
        <div>
          <h2>O tamanho certo. O preço do seu jeito.</h2>
          <p>Fatias, sabores, massas e bordas em um só lugar.</p>
        </div>
      </div>
      <div className="pizza-management-guide">
        <div>
          <strong>01 · Tamanhos e fatias</strong>
          <p>Cadastre brotinho, pequena, média ou grande, com 3, 4 ou quantas fatias precisar.</p>
        </div>
        <div>
          <strong>02 · Valores por tamanho</strong>
          <p>Defina quanto custa cada sabor em cada tamanho.</p>
        </div>
        <div>
          <strong>03 · Combinações</strong>
          <p>Preço fixo ou acréscimo para pizzas com 2, 3 ou 4 sabores.</p>
        </div>
      </div>
      <div className="pizza-management-picker">
        <label className="field">
          Qual produto você quer configurar?
          <select
            disabled={dirty}
            value={newProduct ? "new" : selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setNewProduct(null);
            }}
          >
            {!pizzas.length && <option value="">Nenhuma pizza cadastrada</option>}
            {newProduct && <option value="new">Novo montador</option>}
            {pizzas.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
                {p.pizza ? " · tamanhos configurados" : " · preço único"}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button button-outline"
          disabled={dirty || !!newProduct}
          onClick={() => {
            const product = {
              id: uuid(),
              name: "Monte sua pizza",
              priceCents: 0,
              category: "Pizza",
              status: "Disponível",
              ingredients: [],
              extras: [],
              description: "",
              image: "",
              cutoutImage: "",
              model3dUrl: "",
              featured: false,
            };
            setNewProduct({
              ...product,
              pizza: { ...createPizzaConfig(product), menuPlacement: "builder" },
            });
            setDirty(true);
          }}
        >
          <Plus size={15} />
          Novo montador
        </button>
      </div>
      <p className="small-copy muted">
        Vincule os sabores para usar o mesmo cadastro no cardápio e no montador. Após vincular,
        nomes, disponibilidade, preços por tamanho e personalizações são compartilhados. Cadastros
        antigos continuam independentes até você fazer o vínculo. Salve antes de vincular.
      </p>
      {selected?.pizza && selected.pizza.flavors.length > 1 && services.linkPizzaCatalog && (
        <div className="notice">
          <strong>Cadastro único de sabores</strong>
          <p>
            Este montador tem {selected.pizza.flavors.filter((f) => f.sourceProductId).length} de{" "}
            {selected.pizza.flavors.length} sabores vinculados. Vincular usa os preços e regras
            deste montador nas pizzas individuais com o mesmo nome; cria os sabores que ainda não
            existem. Fotos e descrições dos produtos são preservadas. Adicionais antigos de tamanho
            e borda ficam preservados no cadastro, mas deixam de ser oferecidos e cobrados junto ao
            montador para evitar cobrança duplicada. Configure os valores correspondentes nas abas
            Tamanhos e Massas e bordas antes de vincular.
          </p>
          <button
            type="button"
            className="button button-outline"
            disabled={dirty || linking.busy}
            onClick={() =>
              linking.run(
                () => services.linkPizzaCatalog(company.id, selected.id),
                () => {
                  setCatalogVersion((v) => v + 1);
                  onSaved?.();
                },
              )
            }
          >
            Vincular sabores ao cardápio
          </button>
          {linking.error && <p role="alert">{linking.error}</p>}
        </div>
      )}
      {selected && (
        <PricingForm
          key={`${selected.id}-${catalogVersion}`}
          product={selected}
          isNew={!!newProduct}
          onCancelNew={() => {
            setNewProduct(null);
            setDirty(false);
          }}
          catalog={products}
          onDirty={setDirty}
          onSaved={() => {
            setSelectedId(selected.id);
            setNewProduct(null);
            onSaved?.();
          }}
          onSave={(product) => services.saveProduct(company.id, product)}
        />
      )}
    </section>
  );
}
