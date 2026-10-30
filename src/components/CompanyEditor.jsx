import { useState } from "react";
import { Check } from "lucide-react";
import ImageField from "./ImageField";
import { makeSlug, defaultPlans, planName } from "../lib/data";
import { uuid, iso } from "../core/domain.ts";
import { storefrontTemplates, getStorefrontTemplate } from "../lib/storefrontTemplates";
export default function CompanyEditor({
  company,
  initialPlan = "Essencial",
  initialSegment,
  onSave,
  onClose,
  error,
  busy,
}) {
  const [imageEditing, setImageEditing] = useState(false);
  const [segment, setSegment] = useState(initialSegment || (company ? "burger" : ""));
  const [form, setForm] = useState(
    company || {
      id: uuid(),
      name: "",
      slug: "",
      primaryColor: "#d5f36b",
      logo: "",
      adminEmail: "",
      status: "Ativo",
      plan: initialPlan,
      createdAt: iso().slice(0, 10),
      archived: false,
    },
  );
  const update = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "name" && !company ? { slug: makeSlug(value) } : {}),
    }));
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (imageEditing || !segment) return;
        onSave({ ...form, heroSegment: segment, adminEmail: form.adminEmail.trim().toLowerCase() });
      }}
    >
      <label className="field">
        Nome do estabelecimento
        <input
          required
          maxLength={80}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </label>
      <div className="field">
        <label htmlFor="company-type">Tipo de estabelecimento</label>
        <select
          id="company-type"
          required
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          aria-describedby="company-type-hint"
        >
          <option value="" disabled>
            Selecione o tipo
          </option>
          {Object.entries(storefrontTemplates).map(([key, template]) => (
            <option key={key} value={key}>
              {template.label}
            </option>
          ))}
        </select>
        <small id="company-type-hint">
          Define o visual inicial da loja e a categoria sugerida ao cadastrar produtos. Pode ser
          ajustado depois nas configurações.
        </small>
        {segment && (
          <div className="company-type-preview">
            <img
              src={getStorefrontTemplate(segment).image}
              alt={`Modelo de ${getStorefrontTemplate(segment).label.toLowerCase()}`}
              width="76"
              height="76"
            />
            <span>
              <strong>{getStorefrontTemplate(segment).label}</strong>
              <small>{getStorefrontTemplate(segment).title.join(" ")}</small>
            </span>
          </div>
        )}
      </div>
      <label className="field">
        Endereço da loja
        <div className="slug-input">
          <span>/store/</span>
          <input
            aria-label="Endereço da loja"
            required
            value={form.slug}
            disabled={!!company}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={60}
            onChange={(e) => update("slug", e.target.value)}
          />
        </div>
        <small>
          {company
            ? "Endereço fixo para preservar os links da loja."
            : "Use letras minúsculas, números e hífens."}
        </small>
      </label>
      <label className="field">
        E-mail de contato
        <input
          type="email"
          required
          value={form.adminEmail}
          onChange={(e) => update("adminEmail", e.target.value)}
        />
      </label>
      <div className="form-grid">
        <label className="field">
          Cor da marca
          <input
            type="color"
            value={form.primaryColor}
            onChange={(e) => update("primaryColor", e.target.value)}
          />
        </label>
        <label className="field">
          Plano de referência
          <select value={planName(form.plan)} onChange={(e) => update("plan", e.target.value)}>
            {defaultPlans.map((p) => (
              <option key={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      </div>
      <ImageField
        label="Logo do estabelecimento"
        kind="logo"
        value={form.logo}
        onChange={(value) => update("logo", value)}
        onEditingChange={setImageEditing}
      />
      <label className="field">
        Situação
        <select value={form.status} onChange={(e) => update("status", e.target.value)}>
          <option>Ativo</option>
          <option>Pausado</option>
        </select>
      </label>
      <p className="notice">
        O cadastro começa com cardápio e pedidos vazios. Configure entrega ou retirada antes de
        abrir. Convide o gestor na área Equipe.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button type="button" className="button button-outline" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" disabled={busy || imageEditing} className="button button-dark">
          {busy ? "Salvando…" : "Salvar estabelecimento"}
          <Check size={15} />
        </button>
      </div>
    </form>
  );
}
