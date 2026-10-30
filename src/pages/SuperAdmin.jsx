import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Building2,
  Users,
  Layers,
  Settings,
  Plus,
  Search,
  ArrowUpRight,
  Pencil,
  Archive,
  RotateCcw,
  Store,
  Check,
  Flame,
  CircleCheck,
  Palette,
} from "lucide-react";
import AdminShell from "../components/AdminShell";
import Metrics from "../components/Metrics";
import Modal from "../components/Modal";
import TeamPanel from "../components/TeamPanel";
import CompanyEditor from "../components/CompanyEditor";
import useApplication, { useAction } from "../hooks/useApplication";
import useToast from "../hooks/useToast";
import { defaultPlans, money, planName } from "../lib/data";
import { getStorefrontTemplate } from "../lib/storefrontTemplates";
import { trialState } from "../core/trials.ts";
import "./SuperAdmin.css";
import "./Operations.css";
function PlatformSettings({ value, onSave, busy, error }) {
  const [form, setForm] = useState(value);
  return (
    <section className="panel settings-panel">
      <h2>Os detalhes da central.</h2>
      <p>Informações de referência da plataforma.</p>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
      >
        <label className="field">
          Nome da central
          <input
            required
            value={form.name}
            maxLength={60}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="field">
          E-mail de suporte
          <input
            type="email"
            value={form.supportEmail}
            onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
          />
        </label>
        <label className="field">
          Descrição
          <textarea
            value={form.description}
            maxLength={180}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="button button-dark" type="submit" disabled={busy}>
          Salvar preferências <Check size={15} />
        </button>
      </form>
    </section>
  );
}
export default function SuperAdmin() {
  const { state, services } = useApplication(),
    action = useAction();
  const [params, setParams] = useSearchParams();
  const [toast, notify] = useToast();
  const nav = [
    { id: "companies", label: "Estabelecimentos", icon: Building2 },
    { id: "admins", label: "Equipe", icon: Users },
    { id: "plans", label: "Planos", icon: Layers },
    { id: "settings", label: "Configurações", icon: Settings },
  ];
  const requested = params.get("tab") || (params.has("plan") ? "plans" : "companies"),
    active = nav.some((n) => n.id === requested) ? requested : "companies";
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("Todos"),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState(null),
    [deleting, setDeleting] = useState(null),
    [chosenPlan, setChosenPlan] = useState("Essencial");
  const companies = state.companies.filter((c) => !c.archived),
    platform = state.platform;
  const filtered = state.companies.filter(
    (c) =>
      (filter === "Arquivados"
        ? c.archived
        : !c.archived && (filter === "Todos" || c.status === filter)) &&
      `${c.name} ${c.slug} ${c.adminEmail} ${getStorefrontTemplate(state.tenants[c.id]?.settings.heroSegment).label}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const openNew = (plan) => {
    setChosenPlan(plan || "Essencial");
    setEditing(null);
    action.setError("");
    setModal(true);
  };
  const titles = {
    companies: [
      "Cada negócio, uma nova história.",
      "Estabelecimentos, identidade e acesso à operação.",
    ],
    admins: ["Gente que faz acontecer.", "Convites, perfis e desativação de acessos locais."],
    plans: [
      "Espaço para cada fase.",
      "Referências de plano; sem cobrança ou assinatura automática.",
    ],
    settings: ["A sua operação, organizada.", "Informações de referência da central."],
  };
  const month = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
  return (
    <AdminShell
      central
      centralName={platform.name}
      active={active}
      items={nav}
      onNavigate={(tab) => {
        action.setError("");
        setParams({ tab });
      }}
      toast={toast}
    >
      <div className="admin-page-head">
        <div>
          <h1>{titles[active][0]}</h1>
          <p>{titles[active][1]}</p>
        </div>
        {active === "companies" && (
          <div className="head-actions">
            <button className="button button-dark" onClick={() => openNew()}>
              <Plus size={16} /> Novo estabelecimento
            </button>
          </div>
        )}
      </div>
      {action.error && !modal && !deleting && active !== "settings" && (
        <p className="form-error" role="alert">
          {action.error}
        </p>
      )}
      {active === "companies" && (
        <>
          <Metrics
            items={[
              {
                label: "Estabelecimentos",
                value: String(companies.length).padStart(2, "0"),
                detail: "Dados isolados por ID imutável",
                icon: Store,
              },
              {
                label: "Em atividade",
                value: String(companies.filter((c) => c.status === "Ativo").length).padStart(
                  2,
                  "0",
                ),
                detail: "Sem pausa pela central",
                icon: CircleCheck,
              },
              {
                label: "Novos neste mês",
                value: String(
                  companies.filter((c) => c.createdAt.slice(0, 7) === month).length,
                ).padStart(2, "0"),
                detail: "Cadastros deste mês",
                icon: Building2,
              },
              {
                label: "Identidades únicas",
                value: String(new Set(companies.map((c) => c.primaryColor)).size).padStart(2, "0"),
                detail: "Marcas com personalidade",
                icon: Palette,
              },
            ]}
          />
          <div className="table-toolbar">
            <div className="filter-tabs">
              {["Todos", "Ativo", "Pausado", "Arquivados"].map((f) => (
                <button
                  key={f}
                  className={filter === f ? "active" : ""}
                  onClick={() => setFilter(f)}
                >
                  {f === "Ativo" ? "Em atividade" : f}
                </button>
              ))}
            </div>
            <label className="search-field">
              <Search size={15} />
              <input
                aria-label="Buscar estabelecimento"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, endereço ou contato..."
              />
            </label>
          </div>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Os negócios da casa</h2>
                <p>Abra a loja ou entre na sua operação.</p>
              </div>
              <span className="tag neutral">{filtered.length} estabelecimentos</span>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Estabelecimento</th>
                    <th>Tipo</th>
                    <th>Contato</th>
                    <th>Plano</th>
                    <th>Situação</th>
                    <th>Gerenciar</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="table-person">
                          <span className="cell-brand" style={{ background: c.primaryColor }}>
                            {c.logo ? (
                              <img
                                src={c.logo}
                                alt={`Logo de ${c.name}`}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              c.name.slice(0, 2).toUpperCase()
                            )}
                          </span>
                          <div>
                            <Link to={`/store/${c.slug}`} className="company-name-link">
                              <strong>{c.name}</strong>
                              <ArrowUpRight size={11} />
                            </Link>
                            <small>/store/{c.slug}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {getStorefrontTemplate(state.tenants[c.id]?.settings.heroSegment).label}
                      </td>
                      <td>{c.adminEmail}</td>
                      <td>
                        {planName(c.plan)}
                        {trialState(c) && (
                          <small className="trial-company-label">
                            {trialState(c).expired
                              ? "Teste encerrado"
                              : `Teste · ${trialState(c).daysLeft} dias`}
                          </small>
                        )}
                      </td>
                      <td>
                        <span
                          className={`tag ${c.archived ? "neutral" : c.status === "Ativo" ? "" : "warning"}`}
                        >
                          {c.archived
                            ? "Arquivado"
                            : c.status === "Ativo"
                              ? "Em atividade"
                              : "Pausado"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          {c.archived ? (
                            <button
                              className="button button-outline button-small"
                              disabled={action.busy}
                              onClick={() =>
                                action.run(
                                  () => services.restoreCompany(c.id),
                                  () => notify("Estabelecimento restaurado em pausa."),
                                )
                              }
                            >
                              <RotateCcw size={13} /> Restaurar
                            </button>
                          ) : (
                            <>
                              {trialState(c) && (
                                <button
                                  className="button button-outline button-small"
                                  aria-label={`Ativar plano de ${c.name}`}
                                  title="Ativação manual de acesso. Não realiza cobrança."
                                  disabled={action.busy}
                                  onClick={() =>
                                    action.run(
                                      () =>
                                        services.activatePlan(
                                          c.id,
                                          c.plan === "Rede" ? "Rede" : "Essencial",
                                        ),
                                      () =>
                                        notify(
                                          "Plano ativado. Nenhuma cobrança automática foi realizada.",
                                        ),
                                    )
                                  }
                                >
                                  Ativar acesso
                                </button>
                              )}
                              <Link
                                className="icon-button"
                                aria-label={`Gerenciar ${c.name}`}
                                to={`/dashboard?store=${c.slug}`}
                              >
                                <ArrowUpRight size={14} />
                              </Link>
                              <button
                                className="icon-button"
                                aria-label={`Editar ${c.name}`}
                                onClick={() => {
                                  setEditing(c);
                                  action.setError("");
                                  setModal(true);
                                }}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                className="icon-button danger"
                                disabled={c.slug === "demo"}
                                aria-label={`Arquivar ${c.name}`}
                                onClick={() => {
                                  action.setError("");
                                  setDeleting(c);
                                }}
                              >
                                <Archive size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <div className="empty-state">
                  <Search size={28} />
                  <h3>Nenhum estabelecimento encontrado.</h3>
                </div>
              )}
            </div>
          </section>
          <div className="central-banner central-bottom">
            <div>
              <h2>Uma marca própria. Infinitas receitas.</h2>
              <p>
                Arquivo preserva pedidos e catálogo. Endereços antigos não são reutilizados por
                outra empresa.
              </p>
            </div>
            <Flame size={45} strokeWidth={1.2} />
          </div>
        </>
      )}
      {active === "admins" && <TeamPanel />}
      {active === "plans" && (
        <>
          <div className="admin-plans">
            {defaultPlans.map((plan) => (
              <article className={`admin-plan ${plan.featured ? "selected" : ""}`} key={plan.id}>
                <h2>{plan.name}</h2>
                <p>{plan.description}</p>
                <strong>
                  {money(plan.priceCents / 100)}
                  <small> /mês</small>
                </strong>
                <button
                  className="button button-dark button-full"
                  onClick={() => openNew(plan.name)}
                >
                  Criar estabelecimento <ArrowUpRight size={15} />
                </button>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={13} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="notice" style={{ marginTop: 24 }}>
            Planos são referências locais. Nenhuma contratação, cobrança ou limite comercial é
            aplicado sem o backend de assinaturas.
          </div>
        </>
      )}
      {active === "settings" && (
        <PlatformSettings
          value={platform}
          busy={action.busy}
          error={action.error}
          onSave={(value) =>
            action.run(
              () => services.savePlatform(value),
              () => notify("Preferências salvas."),
            )
          }
        />
      )}
      {modal && (
        <Modal
          title={editing ? "Ajustar os detalhes." : "Uma nova casa na Pedss."}
          onClose={() => setModal(false)}
        >
          <CompanyEditor
            company={editing}
            initialPlan={chosenPlan}
            initialSegment={editing ? state.tenants[editing.id]?.settings.heroSegment : undefined}
            error={action.error}
            busy={action.busy}
            onClose={() => setModal(false)}
            onSave={(company) =>
              action.run(
                () => services.saveCompany(company),
                () => {
                  setModal(false);
                  notify("Estabelecimento salvo.");
                },
              )
            }
          />
        </Modal>
      )}
      {deleting && (
        <Modal title="Arquivar estabelecimento?" onClose={() => setDeleting(null)}>
          <p className="small-copy muted">
            “{deleting.name}” sairá da operação e os acessos serão encerrados. O histórico e o
            cardápio serão preservados para restauração.
          </p>
          {action.error && (
            <p className="form-error" role="alert">
              {action.error}
            </p>
          )}
          <div className="modal-actions">
            <button className="button button-outline" onClick={() => setDeleting(null)}>
              Manter loja
            </button>
            <button
              className="button button-dark"
              disabled={action.busy}
              onClick={() =>
                action.run(
                  () => services.archiveCompany(deleting.id),
                  () => {
                    setDeleting(null);
                    notify("Estabelecimento arquivado.");
                  },
                )
              }
            >
              Arquivar
            </button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
