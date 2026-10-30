import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock3, Power } from "lucide-react";
import { storeOpeningStatus } from "../core/storeOpening.ts";
import { useAction } from "../hooks/useApplication";
import Modal from "./Modal";
import "./StoreAvailabilityControl.css";

export default function StoreAvailabilityControl({
  company,
  tenant,
  now,
  canManage,
  isAdmin,
  services,
  onNavigate,
  onNotice,
}) {
  const [explaining, setExplaining] = useState(false);
  const action = useAction();
  const { availability, blockers, schedule } = storeOpeningStatus(company, tenant, now);
  const issues = blockers.length ? blockers : schedule ? [schedule] : [];
  const label = availability.open
    ? "Loja aberta"
    : company.status === "Pausado"
      ? "Pausada pela central"
      : blockers.length
        ? "Abrir loja"
        : tenant.online && schedule
          ? "Atendimento programado"
          : "Abrir loja";
  const Icon = availability.open ? CheckCircle2 : issues.length ? AlertCircle : Clock3;
  const changeOnline = (online) => {
    action.run(
      () => services.setOnline(company.id, online),
      () => {
        setExplaining(false);
        onNotice?.(
          !online
            ? "Loja fechada para novos pedidos."
            : schedule
              ? "Atendimento ativado. A loja abrirá nos horários configurados."
              : "Loja aberta para receber pedidos.",
        );
      },
    );
  };
  const instructions = (
    <ul className="store-opening-reasons">
      {issues.map((issue) => (
        <li key={issue.code}>
          <strong>{issue.title}</strong>
          <p>{issue.message}</p>
        </li>
      ))}
    </ul>
  );
  const corrections = (
    <div className="store-opening-links">
      {canManage &&
        issues
          .filter((issue, index) => issues.findIndex((i) => i.target === issue.target) === index)
          .map((issue) =>
            issue.target === "central" ? (
              isAdmin ? (
                <Link key={issue.target} className="text-link" to="/super-admin">
                  {issue.action} <ArrowUpRight size={14} />
                </Link>
              ) : (
                <p key={issue.target}>Entre em contato com o administrador da plataforma.</p>
              )
            ) : (
              <button
                key={issue.target}
                type="button"
                className="text-link"
                onClick={() => {
                  setExplaining(false);
                  onNavigate(issue.target);
                }}
              >
                {issue.action} <ArrowUpRight size={14} />
              </button>
            ),
          )}
      {!canManage && !availability.open && <p>Peça a um gestor para ajustar o atendimento.</p>}
    </div>
  );
  return (
    <>
      <section className="store-opening-panel" aria-label="Atendimento da loja">
        <div className="store-opening-copy" role="status">
          <Icon size={21} aria-hidden="true" />
          <div>
            {issues.length ? (
              <>
                {instructions}
                {corrections}
              </>
            ) : (
              <>
                <strong>
                  {availability.open ? "Recebendo pedidos" : "Atendimento desativado"}
                </strong>
                <p>
                  {availability.open
                    ? "O cardápio está disponível para novos pedidos."
                    : "Clique em Abrir loja quando estiver pronto para receber novos pedidos."}
                </p>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          className={`store-status-button ${availability.open ? "online" : ""}`}
          disabled={!canManage || action.busy}
          aria-label={label}
          onClick={() => {
            action.setError("");
            if (blockers.length || (tenant.online && schedule)) setExplaining(true);
            else changeOnline(!tenant.online);
          }}
        >
          <Power size={14} aria-hidden="true" />
          {action.busy ? "Salvando…" : label}
          <span aria-hidden="true" />
        </button>
      </section>
      {action.error && !explaining && (
        <p className="form-error" role="alert">
          {action.error} A alteração não foi concluída.
        </p>
      )}
      {explaining && (
        <Modal
          title={blockers.length ? "Ainda não é possível abrir a loja" : "Atendimento por horário"}
          onClose={() => !action.busy && setExplaining(false)}
        >
          <div className="store-opening-dialog">
            {instructions}
            {corrections}
            {action.error && (
              <p className="form-error" role="alert">
                {action.error}
              </p>
            )}
            <div className="modal-actions">
              {tenant.online && !blockers.length && (
                <button
                  type="button"
                  className="button button-outline"
                  disabled={action.busy}
                  onClick={() => changeOnline(false)}
                >
                  Desativar atendimento
                </button>
              )}
              <button
                type="button"
                className="button button-dark"
                disabled={action.busy}
                onClick={() => setExplaining(false)}
              >
                Entendi
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
