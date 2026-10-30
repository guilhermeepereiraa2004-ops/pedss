import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, Check, ClipboardCheck, Sparkles } from "lucide-react";
import "./LandingHero.css";

export default function LandingHero() {
  return (
    <section className="peds-hero container" aria-labelledby="peds-hero-title">
      <div className="peds-hero-intro">
        <span className="peds-hero-kicker">
          <span /> SEU DELIVERY, EM BOAS MÃOS
        </span>
        <h1 id="peds-hero-title">
          <span>Seu negócio.</span>
          <span>No ritmo dos</span>
          <span className="peds-hero-highlight">
            pedidos<span className="peds-hero-period">.</span>
          </span>
        </h1>
      </div>
      <div className="peds-mascot-stage">
        <div className="peds-mascot-backdrop" aria-hidden="true" />
        <span className="peds-mascot-orbit" aria-hidden="true" />
        <Sparkles className="peds-mascot-spark" size={35} strokeWidth={1.4} aria-hidden="true" />
        <div className="peds-mascot-speech" aria-hidden="true">
          Pode deixar
          <br />
          <strong>comigo.</strong>
          <svg viewBox="0 0 76 56" fill="none">
            <path d="M6 6C52 0 69 24 53 48m-10-9 10 10 13-7" />
          </svg>
        </div>
        <div className="peds-mascot-shadow" aria-hidden="true" />
        <img
          className="peds-mascot-photo"
          src="/brand/peds-mascot-hero-960-v1.webp"
          srcSet="/brand/peds-mascot-hero-640-v1.webp 640w, /brand/peds-mascot-hero-960-v1.webp 960w"
          sizes="(max-width: 760px) 95vw, (max-width: 1100px) 48vw, 560px"
          alt="Mascote da Peds's: uma comanda sorridente pronta para ajudar com os pedidos"
          width="960"
          height="960"
          fetchPriority="high"
          loading="eager"
          decoding="async"
        />
        <div className="peds-hero-order" aria-hidden="true">
          <span className="peds-hero-order-icon">
            <ClipboardCheck size={24} strokeWidth={1.7} />
          </span>
          <div>
            <small>TUDO NO SEU LUGAR</small>
            <strong>Pedido recebido.</strong>
            <span>Da sua loja, direto para o painel.</span>
          </div>
          <span className="peds-hero-order-check">
            <Check size={15} strokeWidth={2.5} />
          </span>
        </div>
        <span className="peds-mascot-caption">UM PARCEIRO PARA CADA NOVO PEDIDO.</span>
      </div>
      <div className="peds-hero-details">
        <p>
          Você cuida do sabor. A gente conecta o resto.
          <br className="desktop-break" /> Cardápio, pedidos e gestão em um só lugar, com a sua
          marca.
        </p>
        <div className="peds-hero-actions">
          <Link to="/cadastro" className="button peds-hero-primary">
            Testar grátis por 7 dias <ArrowUpRight size={20} />
          </Link>
          <Link to="/store/demo" className="peds-hero-demo">
            Ver um cardápio{" "}
            <span>
              <ArrowRight size={18} />
            </span>
          </Link>
        </div>
        <ul className="peds-hero-benefits">
          <li>
            <Check size={14} /> A sua marca em destaque
          </li>
          <li>
            <Check size={14} /> A operação no seu controle
          </li>
        </ul>
      </div>
    </section>
  );
}
