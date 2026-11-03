import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useApplication, { useAction } from "../hooks/useApplication";
import { ArrowUpRight, ChevronRight, Menu, X, Sparkles, CircleHelp, Check } from "lucide-react";
import Brand from "./Brand";
import { storeHref } from "../application/storeAddress";
import "./AdminShell.css";
export default function AdminShell({
  central = false,
  centralName = "Central Peds's",
  items,
  active,
  onNavigate,
  children,
  storeName = "Pedss Burger",
  storeId = "demo",
  toast,
}) {
  const [open, setOpen] = useState(false);
  const { identity, auth, mode } = useApplication();
  const navigate = useNavigate(),
    accessAction = useAction();
  const title = items.find((item) => item.id === active)?.label || "Visão geral";
  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <div className="admin-brand">
          <Brand />
          <button
            className="icon-button sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Fechar navegação"
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-switch">
          <div className="workspace-icon">
            {central ? (
              <img src="/brand/peds-icon-64-v1.png" alt="" width="28" height="28" />
            ) : (
              storeName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <strong>{central ? centralName : storeName}</strong>
            <span>{central ? "Gestão da plataforma" : "Seu espaço de gestão"}</span>
          </div>
          <ChevronRight size={14} />
        </div>
        <span className="sidebar-label">{central ? "PLATAFORMA" : "OPERAÇÃO"}</span>
        <nav aria-label="Navegação do painel">
          {items.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              className={`admin-nav-item ${active === id ? "active" : ""}`}
              onClick={() => {
                onNavigate(id);
                setOpen(false);
              }}
              aria-current={active === id ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.7} />
              <span>{label}</span>
              {count > 0 && <b>{count}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span>
              <Sparkles size={17} /> Seu delivery, aceso.
            </span>
            <p>
              {central
                ? "Cada loja tem seu jeito. A gestão tem um só lugar."
                : "O sabor é seu. A organização fica por nossa conta."}
            </p>
            <Link to={central ? "/dashboard" : storeHref(storeId)}>
              {central ? "Explorar painel da loja" : "Abrir minha loja"} <ArrowUpRight size={13} />
            </Link>
          </div>
          <Link className="sidebar-back" to="/">
            <CircleHelp size={16} /> Conheça a Peds's <ArrowUpRight size={12} />
          </Link>
          <div className="sidebar-user">
            <span className="avatar">{central ? "AD" : storeName.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{identity?.name}</strong>
              <span>
                {
                  { admin: "Administrador", owner: "Gestor", attendant: "Atendente" }[
                    identity?.role
                  ]
                }{" "}
                · {mode === "remote" ? "acesso individual" : "acesso local"}
              </span>
              <div className="profile-actions">
                <Link to="/login">Trocar acesso</Link>
                <button
                  disabled={accessAction.busy}
                  onClick={() =>
                    accessAction.run(
                      () => auth.signOut(),
                      () => navigate("/login", { replace: true }),
                    )
                  }
                >
                  Sair
                </button>
              </div>
              {accessAction.error && <small role="alert">{accessAction.error}</small>}
            </div>
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-scrim"
          onClick={() => setOpen(false)}
          aria-label="Fechar navegação"
        />
      )}
      <div className="admin-body">
        <header className="admin-topbar">
          <div className="breadcrumb">
            <button
              className="icon-button admin-menu"
              onClick={() => setOpen(true)}
              aria-label="Abrir navegação"
            >
              <Menu size={18} />
            </button>
            <span>{central ? centralName : storeName}</span>
            <ChevronRight size={12} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-indicator">
              <i /> {mode === "remote" ? "Conectado" : "Demonstração"}
            </span>
            <Link to={central ? "/dashboard" : storeHref(storeId)} className="topbar-store">
              {central ? "Painel da loja" : "Ver minha loja"} <ArrowUpRight size={14} />
            </Link>
            <span className="avatar">{central ? "AD" : "BB"}</span>
          </div>
        </header>
        <main className="admin-content reveal" key={active}>
          {children}
        </main>
        <footer className="admin-footer">
          <span>
            Peds's. <span>Feito para o seu negócio.</span>
          </span>
          <span>
            {mode === "remote"
              ? "Dados sincronizados com o servidor."
              : "Dados salvos neste navegador."}
          </span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
