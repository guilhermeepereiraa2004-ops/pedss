import { Link } from "react-router-dom";
import { Clock3, ArrowUpRight } from "lucide-react";
import { trialState } from "../core/trials.ts";
import "./TrialAccess.css";

export default function TrialAccess({ company, now, welcome = false }) {
  const trial = trialState(company, now);
  if (!trial) return null;
  const end = new Date(trial.endsAt).toLocaleString("pt-BR", {
    timeZone: "America/Bahia",
    dateStyle: "short",
    timeStyle: "short",
  });
  return trial.expired ? (
    <section className="trial-expired panel">
      <img src="/brand/peds-icon-180-v1.png" alt="" width="72" height="72" />
      <h1>Seus 7 dias de teste terminaram.</h1>
      <p>
        O teste terminou em {end}. Sua loja, seus produtos e seu histórico continuam preservados.
      </p>
      <p>
        Para voltar a gerenciar e receber novos pedidos, escolha um plano e solicite a ativação à
        central Peds&apos;s. Não há cobrança automática.
      </p>
      <Link to="/#planos" className="button button-dark">
        Conhecer os planos <ArrowUpRight size={16} />
      </Link>
    </section>
  ) : (
    <aside className="trial-access-banner" role="status">
      <Clock3 size={22} />
      <div>
        <strong>
          {welcome
            ? "Sua loja está pronta para começar."
            : "Você está no teste completo da Peds's."}
        </strong>
        <p>
          {trial.daysLeft} {trial.daysLeft === 1 ? "dia restante" : "dias restantes"} · Acesso
          completo até {end}. Sem cobrança automática.
        </p>
        {welcome && (
          <small>
            Configure sua identidade e atendimento abaixo. Depois, cadastre os produtos e
            compartilhe o link ou QR code.
          </small>
        )}
      </div>
    </aside>
  );
}
