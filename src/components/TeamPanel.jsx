import { useState } from "react";
import { Plus, ArrowUpRight, Check } from "lucide-react";
import useApplication, { useAction } from "../hooks/useApplication";
import Modal from "./Modal";
const roleNames = { admin: "Administrador", owner: "Gestor", attendant: "Atendente" };
export default function TeamPanel({ storeId = null }) {
  const { state, auth, identity, now, mode } = useApplication(),
    action = useAction();
  const [modal, setModal] = useState(false),
    [link, setLink] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: storeId ? "attendant" : "owner",
    storeId: storeId || state.companies.find((c) => !c.archived)?.id || "",
  });
  const users = state.users.filter((u) => !storeId || u.storeId === storeId);
  const invitations = state.invitations.filter(
    (i) =>
      (!storeId || i.storeId === storeId) && !i.used && Date.parse(i.expiresAt) > now.getTime(),
  );
  return (
    <>
      <div className="section-header-row team-head">
        <p className="small-copy muted">
          {mode === "remote"
            ? "Contas individuais e convites por link. Compartilhe o link diretamente; nenhum e-mail será enviado."
            : "Contas, perfis e convites locais. Nenhum e-mail será enviado."}
        </p>
        <button
          className="button button-dark"
          onClick={() => {
            setLink("");
            action.setError("");
            setModal(true);
          }}
        >
          <Plus size={15} /> Convidar integrante
        </button>
      </div>
      {action.error && !modal && (
        <p className="form-error" role="alert">
          {action.error}
        </p>
      )}
      <section className="panel">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Integrante</th>
                <th>Perfil</th>
                <th>Estabelecimento</th>
                <th>Situação</th>
                <th>Acesso</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </td>
                  <td>
                    {roleNames[user.role]}
                    {user.id.startsWith("demo-") && <small>Perfil de demonstração</small>}
                  </td>
                  <td>
                    {state.companies.find((c) => c.id === user.storeId)?.name || "Plataforma"}
                  </td>
                  <td>
                    <span className={`tag ${user.active ? "" : "neutral"}`}>
                      {user.active ? "Ativo" : "Desativado"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="button button-outline button-small"
                      disabled={
                        action.busy || user.id === identity.id || user.id.startsWith("demo-")
                      }
                      onClick={() => action.run(() => auth.setUserActive(user.id, !user.active))}
                    >
                      {user.active ? "Desativar" : "Reativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && <div className="empty-state">Nenhum integrante cadastrado.</div>}
        </div>
      </section>
      {invitations.length > 0 && (
        <section className="panel pending-invites">
          <div className="panel-head">
            <h2>Convites pendentes</h2>
          </div>
          {invitations.map((i) => (
            <div key={i.id} className="invite-row">
              <strong>{i.name}</strong>
              <span>
                {i.email} · {roleNames[i.role]}
              </span>
              <small>Expira em {new Date(i.expiresAt).toLocaleString("pt-BR")}</small>
            </div>
          ))}
        </section>
      )}
      {modal && (
        <Modal title="Uma nova pessoa na casa." onClose={() => setModal(false)}>
          {link ? (
            <div className="form-stack">
              <p className="notice">
                {mode === "remote"
                  ? "Convite criado. Válido por 24 horas e uma única vez, inclusive em outro dispositivo. Compartilhe apenas com o destinatário."
                  : "Convite local criado. Válido por 24 horas, uma única vez, neste navegador e origem. Nenhum e-mail foi enviado."}
              </p>
              <a className="button button-dark" href={link}>
                Abrir convite <ArrowUpRight size={15} />
              </a>
              <button
                className="button button-outline"
                onClick={() =>
                  action.run(async () => {
                    await navigator.clipboard.writeText(link);
                  })
                }
              >
                {mode === "remote" ? "Copiar link do convite" : "Copiar link local"}
              </button>
              <button className="button button-quiet" onClick={() => setModal(false)}>
                Concluir
              </button>
            </div>
          ) : (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                action.run(
                  () =>
                    auth.invite(
                      form.name,
                      form.email,
                      form.role,
                      form.role === "admin" ? null : form.storeId,
                    ),
                  (token) => setLink(`${window.location.origin}/convite/${token}`),
                );
              }}
            >
              <label className="field">
                Nome
                <input
                  required
                  value={form.name}
                  maxLength={80}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="field">
                E-mail
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="field">
                Perfil
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {(identity.role === "admin"
                    ? ["owner", "attendant", "admin"]
                    : ["attendant"]
                  ).map((role) => (
                    <option key={role} value={role}>
                      {roleNames[role]}
                    </option>
                  ))}
                </select>
              </label>
              {form.role !== "admin" && !storeId && (
                <label className="field">
                  Estabelecimento
                  <select
                    required
                    value={form.storeId}
                    onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                  >
                    {state.companies
                      .filter((c) => !c.archived)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {action.error && (
                <p role="alert" className="form-error">
                  {action.error}
                </p>
              )}
              <button type="submit" className="button button-dark" disabled={action.busy}>
                {action.busy
                  ? "Preparando…"
                  : mode === "remote"
                    ? "Criar convite"
                    : "Criar convite local"}
                <Check size={15} />
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
