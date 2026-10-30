import { useState } from "react";
import { Truck, MapPin, Route, Plus, Trash2 } from "lucide-react";
import MoneyInput from "./MoneyInput";
import { useAction } from "../hooks/useApplication";
import { digits, uuid } from "../core/domain.ts";
import { money } from "../lib/data";
import { deliveryConfigured } from "../core/shipping.ts";
import "./ShippingPanel.css";
export default function ShippingPanel({ company, tenant, services }) {
  const s = tenant.settings,
    action = useAction(),
    simulation = useAction();
  const [form, setForm] = useState({
    deliveryEnabled: s.deliveryEnabled,
    pickupEnabled: s.pickupEnabled,
    address: s.address,
    areas: s.areas,
    shipping: s.shipping || {
      mode: s.areas.length ? "areas" : "fixed",
      originPostalCode: "",
      fixedFeeCents: s.deliveryFeeCents,
      perKmCents: 200,
      baseFeeCents: 0,
      minimumFeeCents: 0,
      maxDistanceKm: 10,
    },
  });
  const [destination, setDestination] = useState(""),
    [quote, setQuote] = useState(null),
    [message, setMessage] = useState(""),
    [dirty, setDirty] = useState(false);
  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setQuote(null);
    setMessage("");
    action.setError("");
    simulation.setError("");
  };
  const rule = (key, value) => update("shipping", { ...form.shipping, [key]: value });
  return (
    <section className="panel shipping-panel">
      <div className="shipping-panel-heading">
        <span>
          <Truck size={26} />
        </span>
        <div>
          <h2>Uma entrega do seu jeito.</h2>
          <p>Defina como cobrar e até onde sua loja entrega.</p>
        </div>
      </div>
      {!s.pickupEnabled && !deliveryConfigured(s) && (
        <p className="notice" role="status">
          <strong>O atendimento ainda não está configurado.</strong> Escolha entrega com a taxa de
          frete ou retirada com o endereço da loja e clique em Salvar frete. Os valores sugeridos
          abaixo só passam a valer depois de salvar.
        </p>
      )}
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          action.run(
            () => services.saveShipping(company.id, form),
            () => {
              setDirty(false);
              setMessage("Frete e atendimento salvos.");
            },
          );
        }}
      >
        <div className="inline-checks">
          <label>
            <input
              type="checkbox"
              checked={form.deliveryEnabled}
              onChange={(e) => update("deliveryEnabled", e.target.checked)}
            />{" "}
            Entrega
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.pickupEnabled}
              onChange={(e) => update("pickupEnabled", e.target.checked)}
            />{" "}
            Retirada na loja
          </label>
        </div>
        <label className="field">
          Endereço da loja
          <input
            value={form.address}
            maxLength={200}
            required={form.pickupEnabled}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Rua, número, bairro e cidade"
          />
          <small>Também exibido ao cliente que escolher retirada.</small>
        </label>
        <fieldset className="shipping-modes">
          <legend>Como você quer cobrar o frete?</legend>
          {[
            ["fixed", "Valor único", "A mesma taxa em cada entrega."],
            ["distance", "Por quilômetro", "Percurso pelas ruas entre os CEPs."],
            ["areas", "Por bairro", "Preserve suas áreas e taxas atuais."],
          ].map(([v, t, d]) => (
            <label key={v} className={form.shipping.mode === v ? "selected" : ""}>
              <input
                type="radio"
                name="shipping-mode"
                value={v}
                checked={form.shipping.mode === v}
                onChange={() => rule("mode", v)}
              />
              <strong>{t}</strong>
              <small>{d}</small>
            </label>
          ))}
        </fieldset>
        {form.shipping.mode === "fixed" && (
          <label className="field">
            Taxa única (R$)
            <MoneyInput
              required
              cents={form.shipping.fixedFeeCents}
              onChange={(v) => rule("fixedFeeCents", v)}
            />
            <small>Esse valor será usado em todas as entregas, sem cálculo de distância.</small>
          </label>
        )}
        {form.shipping.mode === "distance" && (
          <>
            <div className="form-grid">
              <label className="field">
                CEP de saída da loja
                <input
                  inputMode="numeric"
                  autoComplete="postal-code"
                  required
                  pattern="[0-9]{8}"
                  maxLength={8}
                  value={form.shipping.originPostalCode}
                  onChange={(e) => rule("originPostalCode", digits(e.target.value))}
                />
              </label>
              <label className="field">
                Valor por km (R$)
                <MoneyInput
                  required
                  cents={form.shipping.perKmCents}
                  onChange={(v) => rule("perKmCents", v)}
                />
              </label>
              <label className="field">
                Taxa de saída (R$)
                <MoneyInput
                  cents={form.shipping.baseFeeCents}
                  onChange={(v) => rule("baseFeeCents", v)}
                />
              </label>
              <label className="field">
                Frete mínimo (R$)
                <MoneyInput
                  cents={form.shipping.minimumFeeCents}
                  onChange={(v) => rule("minimumFeeCents", v)}
                />
              </label>
              <label className="field">
                Distância máxima de entrega (km)
                <input
                  type="number"
                  required
                  min="0.1"
                  max="300"
                  step="0.1"
                  value={form.shipping.maxDistanceKm}
                  onChange={(e) => rule("maxDistanceKm", Number(e.target.value))}
                />
              </label>
            </div>
            <p className="notice small-copy">
              Frete = taxa de saída + distância × valor por km, respeitando o mínimo e o limite de
              atendimento. A rota é uma estimativa entre localizações dos CEPs; o número do imóvel
              não entra no percurso. Para ativar, a central precisa configurar a chave de rotas no
              servidor.
            </p>
          </>
        )}
        {form.shipping.mode === "areas" && (
          <div className="editor-section">
            <div className="section-header-row">
              <h3>Áreas atendidas</h3>
              <button
                type="button"
                className="button button-outline button-small"
                onClick={() =>
                  update("areas", [...form.areas, { id: uuid(), name: "", feeCents: 0 }])
                }
              >
                <Plus size={14} /> Nova área
              </button>
            </div>
            {form.areas.map((a, i) => (
              <div key={a.id} className="area-editor">
                <label className="field">
                  Área / bairro
                  <input
                    required
                    maxLength={60}
                    value={a.name}
                    onChange={(e) =>
                      update(
                        "areas",
                        form.areas.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                      )
                    }
                  />
                </label>
                <label className="field">
                  Taxa (R$)
                  <MoneyInput
                    required
                    cents={a.feeCents}
                    onChange={(v) =>
                      update(
                        "areas",
                        form.areas.map((x, j) => (j === i ? { ...x, feeCents: v } : x)),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  className="icon-button danger"
                  aria-label={`Remover área ${i + 1}`}
                  onClick={() =>
                    update(
                      "areas",
                      form.areas.filter((x) => x.id !== a.id),
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        {action.error && (
          <p className="form-error" role="alert">
            {action.error}
          </p>
        )}
        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}
        <button type="submit" className="button button-dark" disabled={action.busy}>
          {action.busy ? "Salvando…" : "Salvar frete"}
        </button>
      </form>
      {form.shipping.mode === "distance" && (
        <section className="shipping-simulator">
          <h3>
            <Route size={18} /> Simule uma entrega
          </h3>
          <p>Salve as regras e informe um CEP de destino para conferir a rota e o valor.</p>
          <label className="field">
            CEP para simulação
            <input
              inputMode="numeric"
              maxLength={9}
              value={destination}
              onChange={(e) => {
                setDestination(digits(e.target.value));
                setQuote(null);
                simulation.setError("");
              }}
            />
          </label>
          <button
            className="button button-outline"
            disabled={dirty || simulation.busy || destination.length !== 8}
            onClick={() =>
              simulation.run(() => services.quoteShipping(company.id, destination), setQuote)
            }
          >
            {simulation.busy ? "Calculando…" : "Calcular frete"}
          </button>
          {dirty && <small>Salve suas alterações antes de simular.</small>}
          {simulation.error && (
            <p role="alert" className="form-error">
              {simulation.error}
            </p>
          )}
          {quote && (
            <div className="shipping-result" role="status">
              <MapPin size={20} />
              <div>
                <strong>{money(quote.feeCents / 100)}</strong>
                <span>
                  {(quote.distanceMeters / 1000).toLocaleString("pt-BR", {
                    maximumFractionDigits: 2,
                  })}{" "}
                  km pelas ruas · {quote.address.city}/{quote.address.state}
                </span>
              </div>
            </div>
          )}
          <small>
            CEP: BrasilAPI · Rotas:{" "}
            <a href="https://openrouteservice.org/" target="_blank" rel="noreferrer">
              openrouteservice
            </a>{" "}
            · Dados{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
              © OpenStreetMap contributors
            </a>
            .
          </small>
        </section>
      )}
    </section>
  );
}
