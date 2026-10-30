import { useState } from "react";
import { Check } from "lucide-react";
import ImageField from "./ImageField";
import "./HeroAppearance.css";
import { storeColors } from "../lib/storeColors";
import { storefrontTemplates, getStorefrontTemplate } from "../lib/storefrontTemplates";
import { digits } from "../core/domain.ts";
const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export default function SettingsEditor({ company, settings, onSave, busy, error, onShipping }) {
  const [logoEditing, setLogoEditing] = useState(false),
    [coverEditing, setCoverEditing] = useState(false);
  const [form, setForm] = useState(settings),
    [brand, setBrand] = useState({
      name: company.name,
      logo: company.logo,
      primaryColor: company.primaryColor,
    });
  const update = (key, value) => setForm((v) => ({ ...v, [key]: value }));
  const template = getStorefrontTemplate(form.heroSegment);
  return (
    <section className="panel settings-panel wide-settings">
      <h2>A casa, do seu jeito.</h2>
      <p>
        Identidade, atendimento e entrega. Todos os valores são conferidos novamente ao confirmar o
        pedido.
      </p>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (logoEditing || coverEditing) return;
          onSave({ ...form, whatsapp: digits(form.whatsapp) }, brand);
        }}
      >
        <div className="form-grid">
          <label className="field">
            Nome da loja
            <input
              required
              maxLength={80}
              value={brand.name}
              onChange={(e) => setBrand({ ...brand, name: e.target.value })}
            />
          </label>
          <div className="field">
            <label htmlFor="brand-color">Cor da marca</label>
            <div className="brand-color-controls">
              <input
                id="brand-color"
                type="color"
                value={storeColors(brand.primaryColor).accent}
                onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })}
              />
              <input
                aria-label="Cor em hexadecimal"
                required
                pattern="#[0-9a-fA-F]{6}"
                maxLength={7}
                value={brand.primaryColor}
                onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })}
                placeholder="#ff6825"
              />
            </div>
          </div>
        </div>
        <fieldset className="hero-appearance">
          <legend>Visual da loja</legend>
          <p>
            Escolha o modelo do seu estabelecimento. A cor da marca personaliza os destaques, o
            botão e o selo de preço.
          </p>
          <div className="field hero-segment-field">
            <label htmlFor="store-segment">Segmento da loja</label>
            <select
              id="store-segment"
              aria-describedby="store-segment-hint"
              value={form.heroSegment || "burger"}
              onChange={(e) => update("heroSegment", e.target.value)}
            >
              {Object.entries(storefrontTemplates).map(([key, model]) => (
                <option key={key} value={key}>
                  {model.label}
                </option>
              ))}
            </select>
            <small id="store-segment-hint">
              {form.heroSegment === "burger"
                ? "A hero usa uma imagem ilustrativa fixa e mostra o menor preço dos hambúrgueres disponíveis. As fotos próprias sem fundo aparecem no cardápio e nos detalhes de cada produto."
                : `O selo mostra o menor preço de ${template.plural.toLowerCase()} disponíveis. Cadastre os produtos nessa categoria para exibir o preço.`}
            </small>
          </div>
          <div className="hero-background-options">
            {[
              ["white", "Branco"],
              ["brand", "Cor da marca (suave)"],
            ].map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="heroBackground"
                  value={value}
                  checked={(form.heroBackground || "white") === value}
                  onChange={() => update("heroBackground", value)}
                />
                <span
                  className="hero-background-swatch"
                  style={{
                    background:
                      value === "white"
                        ? "#fff"
                        : `color-mix(in srgb, ${brand.primaryColor} 9%, white)`,
                  }}
                  aria-hidden="true"
                />
                {label}
              </label>
            ))}
          </div>
          <div
            className="hero-appearance-preview"
            style={{
              background:
                form.heroBackground === "brand"
                  ? `color-mix(in srgb, ${brand.primaryColor} 9%, white)`
                  : "#fff",
              "--preview-accent": brand.primaryColor,
              "--preview-headline": storeColors(brand.primaryColor).headline,
            }}
          >
            <div>
              <small>PRÉVIA DAS CORES</small>
              <strong>
                {template.title[0]}
                <br />
                {template.title[1]} <span>{template.title[2]}</span>
              </strong>
              <i aria-hidden="true" />
            </div>
            <img
              src={template.image}
              alt={`Prévia ilustrativa do modelo de ${template.label.toLowerCase()}`}
              width={template.width}
              height={template.height}
              loading="lazy"
            />
          </div>
        </fieldset>
        <ImageField
          label="Logo da loja"
          kind="logo"
          value={brand.logo}
          onChange={(value) => setBrand({ ...brand, logo: value })}
          onEditingChange={setLogoEditing}
        />
        <ImageField
          label="Capa da loja"
          kind="cover"
          value={form.banner}
          onChange={(value) => update("banner", value)}
          onEditingChange={setCoverEditing}
        />
        <p className="small-copy muted">
          A capa aparece no cardápio presencial por QR code. A página de pedidos usa o modelo de
          segmento escolhido acima.
        </p>
        <label className="field">
          Descrição
          <textarea
            maxLength={180}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
          <small>
            Edite para personalizar o texto da hero. A descrição padrão acompanha o modelo
            escolhido.
          </small>
        </label>
        <div className="form-grid">
          <label className="field">
            WhatsApp da loja
            <input
              type="tel"
              value={form.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              placeholder="55 71 99999-9999"
            />
            <small>Inclua 55, DDD e número. O resumo é enviado manualmente pelo cliente.</small>
          </label>
          <label className="field">
            Prazo estimado
            <input
              required
              value={form.deliveryTime}
              maxLength={50}
              onChange={(e) => update("deliveryTime", e.target.value)}
            />
          </label>
        </div>
        <p className="notice">
          Taxas, áreas atendidas, entrega e retirada agora ficam no módulo{" "}
          {onShipping ? (
            <button type="button" className="text-link" onClick={onShipping}>
              Frete
            </button>
          ) : (
            "Frete"
          )}
          .
        </p>
        <div className="editor-section">
          <h3>Formas de pagamento no recebimento</h3>
          <div className="inline-checks">
            {["Dinheiro", "Pix", "Cartão na entrega"].map((method) => (
              <label key={method}>
                <input
                  type="checkbox"
                  checked={form.paymentMethods.includes(method)}
                  onChange={(e) =>
                    update(
                      "paymentMethods",
                      e.target.checked
                        ? [...form.paymentMethods, method]
                        : form.paymentMethods.filter((m) => m !== method),
                    )
                  }
                />
                {method}
              </label>
            ))}
          </div>
          <p className="small-copy muted">
            Escolher Pix ou cartão não processa nem confirma pagamento online.
          </p>
        </div>
        <div className="editor-section">
          <h3>Horários — America/Bahia</h3>
          <label className="checkbox-field schedule-switch">
            <input
              type="checkbox"
              checked={form.scheduleEnabled}
              onChange={(e) => update("scheduleEnabled", e.target.checked)}
            />{" "}
            Abrir e fechar automaticamente pelos horários
          </label>
          <div className="hours-list">
            {form.hours.map((hour, index) => (
              <div className="hour-editor" key={hour.day}>
                <label>
                  <input
                    type="checkbox"
                    checked={hour.enabled}
                    onChange={(e) =>
                      update(
                        "hours",
                        form.hours.map((v, i) =>
                          i === index ? { ...v, enabled: e.target.checked } : v,
                        ),
                      )
                    }
                  />
                  {days[hour.day]}
                </label>
                <input
                  aria-label={`Abertura ${days[hour.day]}`}
                  type="time"
                  value={hour.open}
                  disabled={!hour.enabled}
                  required
                  onChange={(e) =>
                    update(
                      "hours",
                      form.hours.map((v, i) => (i === index ? { ...v, open: e.target.value } : v)),
                    )
                  }
                />
                <span>às</span>
                <input
                  aria-label={`Fechamento ${days[hour.day]}`}
                  type="time"
                  value={hour.close}
                  disabled={!hour.enabled}
                  required
                  onChange={(e) =>
                    update(
                      "hours",
                      form.hours.map((v, i) => (i === index ? { ...v, close: e.target.value } : v)),
                    )
                  }
                />
              </div>
            ))}
          </div>
          <p className="small-copy muted">
            Fechamento anterior à abertura indica atendimento após a meia-noite.
          </p>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button button-dark"
          disabled={busy || logoEditing || coverEditing}
          type="submit"
        >
          {busy ? "Salvando…" : "Salvar configuração"} <Check size={15} />
        </button>
      </form>
    </section>
  );
}
