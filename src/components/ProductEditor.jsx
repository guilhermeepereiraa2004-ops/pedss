import { useState } from "react";
import ListInput from "./ListInput";
import { Check, Plus, Trash2 } from "lucide-react";
import ImageField from "./ImageField";
import MoneyInput from "./MoneyInput";
import PizzaConfigEditor from "./PizzaConfigEditor";
import { categories } from "../lib/data";
import { uuid } from "../core/domain.ts";
const blank = {
  id: "",
  sku: "",
  name: "",
  priceCents: 0,
  costCents: null,
  category: "Hamburguer",
  description: "",
  image: "",
  cutoutImage: "",
  model3dUrl: "",
  status: "Disponível",
  featured: false,
  ingredients: [],
  extras: [],
};
export default function ProductEditor({
  product,
  catalog = [],
  defaultCategory = "Hamburguer",
  onSave,
  onClose,
  busy,
  error,
}) {
  const [form, setForm] = useState(product || { ...blank, category: defaultCategory, id: uuid() });
  const [imageEditing, setImageEditing] = useState(false);
  const [cutoutEditing, setCutoutEditing] = useState(false);
  const [price, setPrice] = useState(product ? String(product.priceCents / 100) : "");
  const [ingredients, setIngredients] = useState(product?.ingredients.join(", ") || "");
  const change = (key, value) =>
    setForm((v) => ({
      ...v,
      [key]: value,
      ...(key === "image" && value !== v.image ? { cutoutImage: "", model3dUrl: "" } : {}),
    }));
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (imageEditing || cutoutEditing) return;
        onSave({
          ...form,
          pizza: form.category === "Pizza" ? form.pizza : undefined,
          priceCents: Math.round(Number(price) * 100),
          ingredients: ingredients
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }}
    >
      <label className="field">
        Nome do produto
        <input
          value={form.name}
          required
          maxLength={80}
          onChange={(e) => change("name", e.target.value)}
        />
      </label>
      <label className="field">
        Código do produto (opcional)
        <input
          value={form.sku || ""}
          maxLength={60}
          pattern="[A-Za-z0-9][A-Za-z0-9._-]*"
          onChange={(e) => change("sku", e.target.value.toUpperCase())}
          placeholder="BURGER-001"
        />
        <small>Identifica o produto nas importações de planilha.</small>
      </label>
      <div className="form-grid">
        <label className="field">
          {form.pizza ? "Preço calculado pelo montador" : "Preço (R$)"}
          <input
            type="number"
            min="0.01"
            max="99999"
            step=".01"
            required={!form.pizza}
            disabled={!!form.pizza}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
        <label className="field">
          Categoria
          <select value={form.category} onChange={(e) => change("category", e.target.value)}>
            {categories.slice(1).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {form.category === "Pizza" && (
        <PizzaConfigEditor
          product={form}
          catalog={catalog}
          onChange={(pizza) => change("pizza", pizza)}
        />
      )}
      <label className="field">
        Custo de produção por unidade (R$)
        <MoneyInput
          cents={form.costCents}
          onChange={(costCents) =>
            change("costCents", Number.isFinite(costCents) ? costCents : null)
          }
        />
        <small>
          Preencha o custo para calcular a margem dos próximos pedidos. Se desconhecido, deixe
          vazio. Veja os resultados em Financeiro → Custos e margem. Não altera pedidos anteriores.
        </small>
      </label>
      <label className="field">
        Descrição
        <textarea
          value={form.description}
          maxLength={500}
          onChange={(e) => change("description", e.target.value)}
        />
      </label>
      <ImageField
        label="Foto do produto"
        disabled={cutoutEditing}
        value={form.image}
        onChange={(value) => change("image", value)}
        onEditingChange={setImageEditing}
        onCutoutChange={(value) => change("cutoutImage", value)}
      />
      <ImageField
        label="Foto sem fundo do produto"
        disabled={imageEditing}
        kind="cutout"
        value={form.cutoutImage || ""}
        onChange={(value) => change("cutoutImage", value)}
        onEditingChange={setCutoutEditing}
        sourceImage={form.image}
      />
      <p className="small-copy muted">
        Esta foto aparece no cardápio e nos detalhes deste produto. Ao enviar a foto do produto no
        campo acima, a versão sem fundo é gerada automaticamente. Você também pode enviar outra foto
        aqui ou gerar a partir de um endereço já cadastrado.
      </p>
      {form.category === "Hamburguer" && (
        <label className="field">
          Modelo 3D do produto (GLB)
          <input
            value={form.model3dUrl || ""}
            maxLength={2048}
            onChange={(e) => change("model3dUrl", e.target.value)}
            placeholder="https://.../hamburguer.glb"
          />
          <small>
            Um modelo 3D permite ver o produto em 360°. Use um endereço permanente do arquivo GLB.
            Sem modelo, o cardápio mostra a foto sem fundo com movimento.
          </small>
        </label>
      )}
      <label className="field">
        Ingredientes que o cliente pode retirar
        <input
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Cebola, picles, molho"
        />
        <small>Separe por vírgulas. A retirada não altera o preço.</small>
      </label>
      <div className="editor-section">
        <div className="section-header-row">
          <h3>Adicionais</h3>
          <button
            type="button"
            className="button button-outline button-small"
            onClick={() =>
              change("extras", [
                ...form.extras,
                { id: uuid(), name: "", priceCents: 0, costCents: null, available: true },
              ])
            }
          >
            <Plus size={13} /> Adicionar
          </button>
        </div>
        {form.extraSelection && (
          <div className="form-grid">
            <label className="field">
              Título das opções
              <input
                required
                maxLength={60}
                value={form.extraSelection.label}
                onChange={(e) =>
                  change("extraSelection", { ...form.extraSelection, label: e.target.value })
                }
              />
            </label>
            <label className="field">
              Mínimo de escolhas
              <input
                type="number"
                required
                min={0}
                max={form.extraSelection.max}
                value={form.extraSelection.min}
                onChange={(e) =>
                  change("extraSelection", { ...form.extraSelection, min: Number(e.target.value) })
                }
              />
            </label>
            <label className="field">
              Máximo de escolhas
              <input
                type="number"
                required
                min={Math.max(1, form.extraSelection.min)}
                max={30}
                value={form.extraSelection.max}
                onChange={(e) =>
                  change("extraSelection", { ...form.extraSelection, max: Number(e.target.value) })
                }
              />
            </label>
          </div>
        )}
        {form.extras.map((extra, index) => (
          <div className="extra-editor cost-extra-editor" key={extra.id}>
            <label className="field">
              Nome
              <input
                required
                value={extra.name}
                maxLength={60}
                onChange={(e) =>
                  change(
                    "extras",
                    form.extras.map((v, i) => (i === index ? { ...v, name: e.target.value } : v)),
                  )
                }
              />
            </label>
            <label className="field">
              Valor (R$)
              <MoneyInput
                required
                cents={extra.priceCents}
                onChange={(priceCents) =>
                  change(
                    "extras",
                    form.extras.map((v, i) => (i === index ? { ...v, priceCents } : v)),
                  )
                }
              />
            </label>
            <label className="field">
              Custo adicional (R$)
              <MoneyInput
                cents={extra.costCents}
                onChange={(costCents) =>
                  change(
                    "extras",
                    form.extras.map((v, i) =>
                      i === index
                        ? { ...v, costCents: Number.isFinite(costCents) ? costCents : null }
                        : v,
                    ),
                  )
                }
              />
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={extra.available}
                onChange={(e) =>
                  change(
                    "extras",
                    form.extras.map((v, i) =>
                      i === index ? { ...v, available: e.target.checked } : v,
                    ),
                  )
                }
              />{" "}
              Ativo
            </label>
            <button
              className="icon-button danger"
              type="button"
              aria-label={`Remover adicional ${index + 1}`}
              onClick={() =>
                change(
                  "extras",
                  form.extras.filter((v) => v.id !== extra.id),
                )
              }
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="form-grid">
        <label className="field">
          Disponibilidade
          <select value={form.status} onChange={(e) => change("status", e.target.value)}>
            <option>Disponível</option>
            <option>Indisponível</option>
          </select>
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => change("featured", e.target.checked)}
          />{" "}
          Favorito da casa
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <label className="field">
        Alergênicos (separados por vírgula)
        <ListInput
          value={form.allergens}
          onChange={(allergens) => change("allergens", allergens)}
          placeholder="Leite, trigo, ovos"
        />
        <small>
          Informação fornecida pela loja. Inclua riscos de contaminação cruzada na descrição.
        </small>
      </label>
      <div className="modal-actions">
        <button type="button" className="button button-outline" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="submit"
          className="button button-dark"
          disabled={busy || imageEditing || cutoutEditing}
        >
          {busy ? "Salvando…" : "Salvar produto"}
          <Check size={15} />
        </button>
      </div>
    </form>
  );
}
