import MoneyInput from "./MoneyInput";
import { uuid } from "../core/domain.ts";
import ListInput from "./ListInput";

export default function PizzaAdvancedEditor({ config, onChange }) {
  const flavorChange = (id, patch) =>
    onChange({
      ...config,
      flavors: config.flavors.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  return (
    <div className="form-stack">
      <h3>Combinações e personalização</h3>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={config.allowMixedKinds !== false}
          onChange={(e) => onChange({ ...config, allowMixedKinds: e.target.checked })}
        />
        Permitir doces e salgadas na mesma pizza
      </label>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={!!config.allowUnequalParts}
          onChange={(e) => onChange({ ...config, allowUnequalParts: e.target.checked })}
        />
        Permitir partes diferentes (metade e quartos)
      </label>
      <p className="small-copy muted">
        Na média, o preço acompanha a proporção de cada sabor. No maior valor e no fixo, a proporção
        não altera a regra. Os adicionais abaixo são cobrados uma vez na parte escolhida, sem
        dividir seu valor.
      </p>
      {config.flavors.map((f) => (
        <fieldset key={f.id} className="pizza-count-pricing-size">
          <legend>{f.name}</legend>
          {f.sourceProductId && <small>Sabor vinculado ao catálogo.</small>}
          {f.sourceProductId && config.flavors.length > 1 && (
            <button
              type="button"
              className="button button-outline button-small"
              onClick={() => flavorChange(f.id, { sourceProductId: undefined })}
            >
              Desvincular {f.name} do catálogo
            </button>
          )}
          <label className="field">
            Tipo do sabor
            <select
              value={f.kind || "savory"}
              onChange={(e) => flavorChange(f.id, { kind: e.target.value })}
            >
              <option value="savory">Salgado</option>
              <option value="sweet">Doce</option>
            </select>
          </label>
          <label className="field">
            Ingredientes que o cliente pode retirar
            <ListInput
              value={f.ingredients}
              onChange={(ingredients) => flavorChange(f.id, { ingredients })}
              placeholder="Cebola, azeitona"
            />
          </label>
          <label className="field">
            Alergênicos informados pela loja
            <ListInput
              value={f.allergens}
              onChange={(allergens) => flavorChange(f.id, { allergens })}
              placeholder="Leite, trigo, ovos"
            />
          </label>
          <small>
            Informe também riscos de contaminação cruzada na descrição. O sistema não deduz
            alergênicos.
          </small>
          {(f.extras || []).map((extra) => (
            <div className="form-grid" key={extra.id}>
              <label className="field">
                Nome do adicional
                <input
                  value={extra.name}
                  onChange={(e) =>
                    flavorChange(f.id, {
                      extras: f.extras.map((v) =>
                        v.id === extra.id ? { ...v, name: e.target.value } : v,
                      ),
                    })
                  }
                />
              </label>
              <label className="field">
                Valor do adicional (R$)
                <MoneyInput
                  cents={extra.priceCents}
                  onChange={(priceCents) =>
                    flavorChange(f.id, {
                      extras: f.extras.map((v) => (v.id === extra.id ? { ...v, priceCents } : v)),
                    })
                  }
                />
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={extra.available}
                  onChange={(e) =>
                    flavorChange(f.id, {
                      extras: f.extras.map((v) =>
                        v.id === extra.id ? { ...v, available: e.target.checked } : v,
                      ),
                    })
                  }
                />
                Disponível
              </label>
              <button
                type="button"
                className="button button-outline button-small"
                onClick={() =>
                  flavorChange(f.id, { extras: f.extras.filter((v) => v.id !== extra.id) })
                }
              >
                Excluir adicional de {f.name}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button button-outline button-small"
            disabled={(f.extras?.length || 0) >= 30}
            onClick={() =>
              flavorChange(f.id, {
                extras: [
                  ...(f.extras || []),
                  { id: uuid(), name: "Novo adicional", priceCents: 0, available: true },
                ],
              })
            }
          >
            Adicionar opção para {f.name}
          </button>
        </fieldset>
      ))}
    </div>
  );
}
