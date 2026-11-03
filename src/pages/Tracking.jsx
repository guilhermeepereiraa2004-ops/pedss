import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, Flame, ArrowUpRight, Copy, Clock3, Send } from "lucide-react";
import LandingBrand from "../components/LandingBrand";
import useApplication, { useAction } from "../hooks/useApplication";
import { money } from "../lib/data";
import { orderStatusLabel } from "../lib/orderActions";
import "./Tracking.css";
export default function Tracking() {
  const { token } = useParams(),
    { state, mode, refresh, services } = useApplication(),
    navigate = useNavigate(),
    action = useAction();
  const [link, setLink] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (token) refresh?.().catch(() => {});
  }, [token, refresh]);
  let order, company, settings;
  if (token) {
    for (const c of state.companies) {
      const t = state.tenants[c.id],
        found = t?.orders.find((o) => o.trackingToken === token);
      if (found) {
        order = found;
        company = c;
        settings = t.settings;
        break;
      }
    }
  }
  const lookup = (e) => {
    e.preventDefault();
    action.setError("");
    let value = link.trim();
    try {
      if (/^https?:\/\//i.test(value))
        value = new URL(value).pathname.split("/").filter(Boolean).at(-1) || "";
      if (!/^[a-f0-9-]{36,100}$/i.test(value)) {
        action.setError("Cole o link de acompanhamento recebido na confirmação.");
        return;
      }
      navigate(`/pedido/${value}`);
    } catch {
      action.setError("Link inválido. Confira o endereço.");
    }
  };
  const history = order?.history.filter((e) => e.kind === "order") || [];
  const whatsapp =
    order && settings?.whatsapp
      ? `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Olá, ${company.name}! Pedido ${order.number}\n${order.lines.map((l) => `${l.quantity} × ${l.name}${l.pizzaSummary ? " — " + l.pizzaSummary : ""}${l.extras.length ? " + " + l.extras.map((e) => e.name).join(", ") : ""}${l.removedIngredients.length ? " (sem " + l.removedIngredients.join(", ") + ")" : ""}${l.notes ? " — " + l.notes : ""}`).join("\n") || order.legacyItems}\nCliente: ${order.customer.name}\nTelefone: ${order.customer.phone}\n${[order.address.street, order.address.number, order.address.neighborhood, order.address.complement, order.address.reference].filter(Boolean).join(", ")}\nObservações: ${order.notes || "Nenhuma"}\nPagamento: ${order.paymentMethod}\nTotal: ${money(order.totalCents / 100)}\nAcompanhamento: ${window.location.origin}/pedido/${order.trackingToken}`)}`
      : "";
  return (
    <div className="tracking-page">
      <header className="tracking-header">
        <LandingBrand />
        <Link
          className="text-link"
          to={company && !company.archived ? `/store/${company.slug}` : "/store/demo"}
        >
          Voltar ao cardápio <ArrowUpRight size={13} />
        </Link>
      </header>
      <main className="tracking-card">
        {!token ? (
          <>
            <Flame size={43} strokeWidth={1.3} />
            <h1>Seu pedido, por aqui.</h1>
            <p>Cole o link de acompanhamento recebido na confirmação.</p>
            <form className="form-stack" onSubmit={lookup}>
              <label className="field">
                Link de acompanhamento
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  required
                  placeholder="Cole o link completo"
                />
              </label>
              {action.error && (
                <p className="form-error" role="alert">
                  {action.error}
                </p>
              )}
              <button className="button button-dark" type="submit">
                Acompanhar <ArrowUpRight size={15} />
              </button>
            </form>
          </>
        ) : !order ? (
          <>
            <Clock3 size={40} />
            <h1>Não encontramos esse pedido.</h1>
            <p>
              {mode === "remote"
                ? "Confira o link de acompanhamento recebido ao concluir o pedido."
                : "Confira o link e use o mesmo navegador e endereço em que realizou o pedido. O acompanhamento ainda é local."}
            </p>
            <Link className="button button-dark" to="/acompanhar">
              Conferir outro link
            </Link>
          </>
        ) : (
          <>
            <div className={`tracking-symbol ${order.status === "Cancelado" ? "cancelled" : ""}`}>
              <Check size={29} />
            </div>
            <span className="section-kicker">
              {company.name} · {order.number}
            </span>
            <h1>
              {order.status === "Cancelado"
                ? "Pedido cancelado."
                : order.status === "Entregue"
                  ? "Bom apetite. Até a próxima!"
                  : order.status === "Pendente"
                    ? "Já está no painel da loja."
                    : "Seu pedido está andando."}
            </h1>
            <p>{order.customer.name.split(" ")[0]}, acompanhe cada etapa por este link.</p>
            <div className="tracking-badges">
              <span className={`tag ${order.status === "Cancelado" ? "danger" : ""}`}>
                {orderStatusLabel(order)}
              </span>
            </div>
            <div className="notice">
              {mode === "remote"
                ? "As etapas são atualizadas automaticamente. O pagamento é conferido pelo estabelecimento; não há cobrança online automática."
                : "Demonstração local. Não houve cobrança automática. As atualizações aparecem neste navegador e em abas da mesma origem."}
            </div>
            <section className="tracking-timeline">
              {history.map((event, i) => (
                <div key={event.id} className={i === history.length - 1 ? "current" : ""}>
                  <span />
                  <div>
                    <strong>{orderStatusLabel({ status: event.to })}</strong>
                    <small>
                      {new Date(event.at).toLocaleString("pt-BR", { timeZone: "America/Bahia" })}
                    </small>
                    {event.reason && <p>{event.reason}</p>}
                  </div>
                </div>
              ))}
            </section>
            <section className="tracking-summary">
              <h2>O que vem por aí.</h2>
              {order.lines.map((line, i) => (
                <div key={i}>
                  <strong>
                    {line.quantity} × {line.name}
                  </strong>
                  <span>{money(line.totalCents / 100)}</span>
                  {line.pizzaSummary && <small>{line.pizzaSummary}</small>}
                  {line.extras.length > 0 && (
                    <small>+ {line.extras.map((e) => e.name).join(", ")}</small>
                  )}
                  {line.removedIngredients.length > 0 && (
                    <small>Sem {line.removedIngredients.join(", ")}</small>
                  )}
                  {line.notes && <small>{line.notes}</small>}
                </div>
              ))}
              {!order.lines.length && <p>{order.legacyItems}</p>}
              <div>
                <span>Entrega</span>
                <span>{money(order.deliveryFeeCents / 100)}</span>
              </div>
              {order.coupon && (
                <div>
                  <span>Cupom {order.coupon.code}</span>
                  <span>−{money(order.coupon.discountCents / 100)}</span>
                </div>
              )}
              <div className="tracking-total">
                <strong>Total</strong>
                <strong>{money(order.totalCents / 100)}</strong>
              </div>
              <p>
                {order.fulfillment === "pickup" ? "Retirada em: " : "Entrega em: "}
                {[
                  order.address.street,
                  order.address.number,
                  order.address.neighborhood,
                  order.address.complement,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p>
                Pagamento escolhido: {order.paymentMethod}
                {order.changeForCents !== null
                  ? ` · Troco para ${money(order.changeForCents / 100)}`
                  : ""}
              </p>
              {order.notes && <p>Observações: {order.notes}</p>}
            </section>
            {order.scheduledAt && (
              <p className="notice">
                Agendado para{" "}
                {new Date(order.scheduledAt).toLocaleString("pt-BR", { timeZone: "America/Bahia" })}
              </p>
            )}
            {services.repeatOrder && order.lines.every((l) => l.selection) && (
              <>
                <button
                  className="button button-dark button-full"
                  disabled={action.busy}
                  onClick={() =>
                    action.run(
                      () => services.repeatOrder(company.id, order.trackingToken),
                      () =>
                        setMessage(
                          "Itens adicionados à sacola com os preços atuais. Confira antes de confirmar.",
                        ),
                    )
                  }
                >
                  Pedir novamente
                </button>
                <small>
                  A disponibilidade e os valores atuais serão conferidos; o pedido anterior não será
                  alterado.
                </small>
              </>
            )}
            {whatsapp && (
              <a
                className="button button-lime button-full"
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
              >
                Enviar resumo pelo WhatsApp <Send size={15} />
              </a>
            )}
            <button
              className="button button-outline button-full"
              onClick={() =>
                action.run(async () => {
                  await navigator.clipboard.writeText(window.location.href);
                  setMessage("Link copiado. Guarde-o para acompanhar este pedido.");
                })
              }
            >
              <Copy size={14} /> Copiar acompanhamento
            </button>
            {message && (
              <p className="notice" role="status">
                {message}
              </p>
            )}
            {action.error && (
              <p className="form-error" role="alert">
                {action.error}
              </p>
            )}
            <p className="tracking-privacy">
              O link dá acesso aos detalhes deste pedido. Compartilhe apenas com quem precisa
              acompanhar.
            </p>
          </>
        )}
      </main>
      <footer className="tracking-footer">Peds's. Seu delivery, aceso.</footer>
    </div>
  );
}
