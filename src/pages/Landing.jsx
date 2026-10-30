import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ShoppingBag,
  LayoutGrid,
  SlidersHorizontal,
  Plus,
  Minus,
  Sparkles,
  QrCode,
  Palette,
  Store,
  ClipboardCheck,
  Send,
  TicketPercent,
  ChevronRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import LandingBrand from "../components/LandingBrand";
import LandingHero from "../components/LandingHero";
import { defaultPlans, money } from "../lib/data";
import "./Landing.css";
const mascot = "/brand/peds-mascot-hero-640-v1.webp";
const burger = "/images/optimized/menu-brasa-only-480-56a19166d52f.webp";
const faqs = [
  [
    "Posso testar antes de decidir?",
    "Sim. Cadastre sua conta e sua loja para usar todas as funcionalidades por 7 dias, sem cartão e sem cobrança automática. Ao terminar o teste, seus dados ficam preservados e você pode solicitar a ativação de um plano à central.",
  ],
  [
    "A loja fica com a minha marca?",
    "Sim. Cada estabelecimento tem nome, cor e endereço próprios. Você pode personalizar a identidade da loja no cadastro de empresas.",
  ],
  [
    "Preciso instalar algum aplicativo?",
    "Não. O cardápio e os painéis funcionam diretamente no navegador do computador ou celular.",
  ],
  [
    "Como os pedidos chegam para mim?",
    "Os pedidos finalizados na loja aparecem no painel do estabelecimento. Você também pode cadastrar o WhatsApp da loja para que o cliente envie o resumo do pedido.",
  ],
];
const steps = [
  [
    Store,
    "01",
    "Sua loja, seu jeito.",
    "Cadastre o estabelecimento e escolha as cores que fazem a sua marca ser reconhecida.",
  ],
  [
    ClipboardCheck,
    "02",
    "Capriche no cardápio.",
    "Adicione fotos, preços e opções. Deixe cada produto pronto para ser o próximo favorito.",
  ],
  [
    Send,
    "03",
    "Pode espalhar.",
    "Compartilhe o link ou o QR code e acompanhe os pedidos da sua loja pelo painel.",
  ],
];
function ProductPreview() {
  return (
    <div className="lp-panel" aria-label="Exemplo ilustrativo do painel de pedidos">
      <div className="lp-panel-bar">
        <img
          src="/brand/peds-logo-green-v1.webp"
          alt="Peds's"
          width="108"
          height="36"
          loading="lazy"
        />
        <span>
          <i /> Loja aberta
        </span>
      </div>
      <div className="lp-panel-body">
        <div className="lp-panel-rail" aria-hidden="true">
          <LayoutGrid size={18} />
          <ShoppingBag size={18} />
          <SlidersHorizontal size={18} />
        </div>
        <div className="lp-panel-content">
          <div className="lp-panel-greeting">
            <span>VISÃO GERAL</span>
            <strong>Bom movimento por aqui.</strong>
          </div>
          <div className="lp-panel-metrics">
            <div>
              <span>Vendas do dia</span>
              <strong>
                R$ 1.248<small>,90</small>
              </strong>
            </div>
            <div>
              <span>Pedidos recebidos</span>
              <strong>
                28 <ShoppingBag size={21} />
              </strong>
            </div>
          </div>
          <div className="lp-panel-orders">
            <strong>
              Últimos pedidos <span>Hoje</span>
            </strong>
            {[
              ["#1024", "Preparando", "R$ 59,80"],
              ["#1023", "A caminho", "R$ 56,90"],
              ["#1022", "Entregue", "R$ 36,90"],
            ].map(([id, status, total]) => (
              <div key={id}>
                <span>{id}</span>
                <span className="lp-status">{status}</span>
                <b>{total}</b>
              </div>
            ))}
          </div>
          <span className="lp-example">Valores e pedidos ilustrativos</span>
        </div>
      </div>
    </div>
  );
}
function MenuPreview() {
  return (
    <div className="lp-menu-scene">
      <span className="lp-scene-spark" aria-hidden="true">
        ✳
      </span>
      <div className="lp-phone" aria-label="Exemplo ilustrativo de cardápio digital">
        <div className="lp-phone-top">
          <span />
          <span />
          <span />
        </div>
        <div className="lp-phone-store">
          <span>
            <Store size={16} />
          </span>{" "}
          Sua loja aqui <span>Aberto</span>
        </div>
        <div className="lp-phone-title">
          Deu fome?
          <br />
          <strong>Escolha seu favorito.</strong>
        </div>
        <div className="lp-phone-photo">
          <img
            src={burger}
            alt="Hambúrguer ilustrativo sem fundo"
            width="480"
            height="480"
            loading="lazy"
            decoding="async"
          />
          <span>FEITO NO CAPRICHO</span>
        </div>
        <div className="lp-phone-product">
          <strong>O favorito da casa</strong>
          <span>Pão macio, queijo e muito sabor.</span>
          <div>
            <b>R$ 29,90</b>
            <span aria-hidden="true">
              <Plus size={16} />
            </span>
          </div>
        </div>
        <div className="lp-phone-bag">
          <ShoppingBag size={14} /> Seu próximo pedido <ArrowRight size={14} />
        </div>
        <span className="lp-phone-note">Prévia ilustrativa</span>
      </div>
      <div className="lp-qr-sticker">
        <QrCode size={29} strokeWidth={1.6} />
        <span>
          Da tela
          <br />
          <strong>para a mesa.</strong>
        </span>
      </div>
    </div>
  );
}
export default function Landing() {
  const [openFaq, setOpenFaq] = useState(0);
  return (
    <div className="landing">
      <Navbar />
      <main>
        <LandingHero />
        <div className="lp-promise-strip">
          <div className="container">
            <span>Seu cardápio.</span>
            <img
              src="/brand/peds-icon-64-v1.png"
              alt=""
              aria-hidden="true"
              width="32"
              height="32"
              loading="lazy"
            />
            <span>Seus pedidos.</span>
            <img
              src="/brand/peds-icon-64-v1.png"
              alt=""
              aria-hidden="true"
              width="32"
              height="32"
              loading="lazy"
            />
            <span>Seu jeito.</span>
          </div>
        </div>
        <section
          className="lp-platform container"
          id="plataforma"
          aria-labelledby="lp-platform-title"
        >
          <div className="lp-section-head">
            <div>
              <span className="lp-kicker">UMA PARCERIA QUE DÁ CERTO</span>
              <h2 id="lp-platform-title">
                Menos correria.
                <br />
                <span className="lp-highlight">Mais controle.</span>
              </h2>
            </div>
            <p>
              Do primeiro clique ao pedido pronto.
              <br />
              Tudo conectado para você cuidar
              <br className="desktop-break" /> do que faz de melhor.
            </p>
          </div>
          <article className="lp-operations">
            <div className="lp-feature-copy">
              <span className="lp-number-label">
                <span>01</span> A CASA ORGANIZADA
              </span>
              <h3>
                O movimento cresce.
                <br />
                Você acompanha.
              </h3>
              <p>
                Pedidos, cardápio e resultados no mesmo lugar. Uma visão clara do dia, sem perder o
                fio da operação.
              </p>
              <ul className="lp-check-list">
                <li>
                  <Check size={16} /> Pedidos e status à vista
                </li>
                <li>
                  <Check size={16} /> Receitas, despesas e ticket médio
                </li>
                <li>
                  <Check size={16} /> Produtos e equipe organizados
                </li>
              </ul>
              <Link to="/dashboard" className="lp-text-link">
                Conhecer o painel <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="lp-dashboard-scene">
              <span className="lp-scene-label">
                <span /> TUDO NO SEU LUGAR
              </span>
              <ProductPreview />
              <div className="lp-panel-sticker">
                <ClipboardCheck size={19} />
                <span>
                  Mais clareza.
                  <br />
                  <strong>Menos malabarismo.</strong>
                </span>
                <Check size={17} />
              </div>
            </div>
          </article>
          <article className="lp-store-feature">
            <MenuPreview />
            <div className="lp-feature-copy">
              <span className="lp-number-label">
                <span>02</span> UMA VITRINE COM A SUA CARA
              </span>
              <h3>
                Abre o cardápio.
                <br />
                <span>Abre o apetite.</span>
              </h3>
              <p>
                Fotos que dão vontade, opções para escolher e um caminho simples até o pedido. No
                delivery ou na mesa da sua loja.
              </p>
              <div className="lp-feature-tags">
                <span>
                  <ShoppingBag size={15} /> Delivery
                </span>
                <span>
                  <QrCode size={15} /> QR code na mesa
                </span>
                <span>
                  <TicketPercent size={15} /> Cupons
                </span>
              </div>
              <Link to="/store/demo" className="lp-button lp-button-dark">
                Ver um cardápio <ArrowUpRight size={19} />
              </Link>
            </div>
          </article>
          <div className="lp-brand-note">
            <div className="lp-brand-mascot" aria-hidden="true">
              <img src={mascot} alt="" width="160" height="160" loading="lazy" decoding="async" />
            </div>
            <div>
              <span className="lp-kicker">O SABOR É SEU. A IDENTIDADE TAMBÉM.</span>
              <h3>
                A sua marca na frente.
                <br />A Peds's do seu lado.
              </h3>
            </div>
            <div className="lp-brand-note-action">
              <div className="lp-brand-swatches" aria-hidden="true">
                <span />
                <span />
                <span />
                <Palette size={20} />
              </div>
              <Link to="/cadastro" className="lp-text-link">
                Personalizar minha loja <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </section>
        <section className="lp-how" id="como-funciona" aria-labelledby="lp-how-title">
          <div className="container">
            <div className="lp-section-head">
              <div>
                <span className="lp-kicker">DA IDEIA AO PRIMEIRO PEDIDO</span>
                <h2 id="lp-how-title">
                  Bora colocar
                  <br />a casa pra <span className="lp-highlight">rodar?</span>
                </h2>
              </div>
              <Link to="/cadastro" className="lp-button lp-button-dark">
                Bora começar <ArrowUpRight size={19} />
              </Link>
            </div>
            <ol className="lp-steps">
              {steps.map(([Icon, number, title, text]) => (
                <li key={number}>
                  <div className="lp-step-top">
                    <span>{number}</span>
                    <Icon size={28} strokeWidth={1.5} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <span className="lp-step-arrow" aria-hidden="true">
                    <ArrowRight size={19} />
                  </span>
                </li>
              ))}
            </ol>
            <p className="lp-how-note">
              <Check size={17} /> No navegador. No computador ou no celular. Do seu jeito.
            </p>
          </div>
        </section>
        <section className="lp-trial container" id="teste-gratis" aria-labelledby="lp-trial-title">
          <div className="lp-trial-copy">
            <span className="lp-kicker">CONHEÇA NA PRÁTICA</span>
            <h2 id="lp-trial-title">
              7 dias.
              <br />
              Sua loja.
              <br />
              <span>Tudo liberado.</span>
            </h2>
            <p>Crie sua conta, configure a sua loja e experimente a Peds&apos;s com a sua marca.</p>
            <ul>
              <li>
                <Check size={16} /> Cardápio, pedidos e QR code
              </li>
              <li>
                <Check size={16} /> Financeiro, cupons e equipe
              </li>
              <li>
                <Check size={16} /> Configuração do seu jeito
              </li>
            </ul>
            <Link className="lp-button lp-button-dark" to="/cadastro">
              Começar meus 7 dias <ArrowUpRight size={19} />
            </Link>
            <small>Sem cartão. Sem cobrança automática. Seus dados preservados.</small>
          </div>
          <div className="lp-trial-art" aria-hidden="true">
            <span>
              UM BOM COMEÇO
              <br />
              <strong>muda tudo.</strong>
            </span>
            <img src={mascot} alt="" width="640" height="640" loading="lazy" />
            <b>
              7
              <span>
                dias para testar
                <br />
                de verdade.
              </span>
            </b>
          </div>
        </section>
        <section className="lp-pricing container" id="planos" aria-labelledby="lp-pricing-title">
          <div className="lp-section-head">
            <div>
              <span className="lp-kicker">TEM ESPAÇO PARA CRESCER</span>
              <h2 id="lp-pricing-title">
                Cada fase tem
                <br />
                seu <span className="lp-highlight">próximo passo.</span>
              </h2>
            </div>
            <p>
              Do começo aos novos planos.
              <br />
              Encontre o que combina
              <br className="desktop-break" /> com o seu momento.
            </p>
          </div>
          <div className="lp-plans">
            {defaultPlans.map((plan) => (
              <article
                key={plan.id}
                className={`lp-plan ${plan.featured ? "lp-plan-featured" : ""}`}
              >
                <div className="lp-plan-name">
                  <h3>{plan.name}</h3>
                  {plan.featured ? (
                    <span>
                      <Sparkles size={13} /> PARA IR ALÉM
                    </span>
                  ) : (
                    <ArrowUpRight size={20} />
                  )}
                </div>
                <p>{plan.description}</p>
                <div className="lp-plan-price">
                  {money(plan.priceCents / 100)}
                  <small>/mês</small>
                </div>
                <Link
                  to={`/super-admin?plan=${plan.id}`}
                  className={`lp-button ${plan.featured ? "lp-button-dark" : "lp-button-outline"}`}
                >
                  Explorar {plan.name} <ArrowUpRight size={18} />
                </Link>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="lp-pricing-note">
            Planos de referência. Ambiente demonstrativo, sem cobrança nesta versão.
          </p>
        </section>
        <section className="lp-faq container" aria-labelledby="lp-faq-title">
          <div className="lp-faq-intro">
            <span className="lp-kicker">TUDO ÀS CLARAS</span>
            <h2 id="lp-faq-title">
              Pode
              <br />
              <span className="lp-highlight">perguntar.</span>
            </h2>
            <div className="lp-faq-mascot">
              <img src={mascot} alt="" aria-hidden="true" width="96" height="96" loading="lazy" />
              <span>
                Sem complicar.
                <br />
                <strong>Direto ao ponto.</strong>
              </span>
            </div>
          </div>
          <div className="lp-faq-list">
            {faqs.map(([question, answer], i) => (
              <article key={question} className={openFaq === i ? "is-open" : ""}>
                <h3>
                  <button
                    type="button"
                    id={`faq-question-${i}`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-${i}`}
                  >
                    <span>{question}</span>
                    <span className="lp-faq-toggle" aria-hidden="true">
                      {openFaq === i ? <Minus size={18} /> : <Plus size={18} />}
                    </span>
                  </button>
                </h3>
                {openFaq === i && (
                  <div id={`faq-${i}`} role="region" aria-labelledby={`faq-question-${i}`}>
                    <p>{answer}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
        <section className="lp-closing container" aria-labelledby="lp-closing-title">
          <div className="lp-closing-copy">
            <span className="lp-kicker">VAMOS NESSA?</span>
            <h2 id="lp-closing-title">
              O próximo
              <br />
              <span>pedido</span>
              <br />
              começa aqui.
            </h2>
            <p>
              A sua marca. O seu sabor.
              <br />
              Um parceiro para tudo se conectar.
            </p>
            <Link to="/dashboard" className="lp-button lp-button-dark">
              Conhecer a plataforma <ArrowUpRight size={20} />
            </Link>
          </div>
          <div className="lp-closing-art" aria-hidden="true">
            <span className="lp-closing-orbit" />
            <span className="lp-closing-speech">Partiu?</span>
            <img
              src="/brand/peds-mascot-hero-960-v1.webp"
              srcSet={`${mascot} 640w, /brand/peds-mascot-hero-960-v1.webp 960w`}
              sizes="(max-width: 760px) 95vw, 620px"
              alt=""
              width="960"
              height="960"
              loading="lazy"
              decoding="async"
            />
            <Sparkles size={34} strokeWidth={1.4} />
            <span className="lp-closing-stamp">
              <Check size={16} /> TAMO JUNTO.
            </span>
          </div>
        </section>
      </main>
      <footer className="lp-footer container">
        <div className="lp-footer-main">
          <div>
            <LandingBrand />
            <p>Um parceiro para cada novo pedido.</p>
          </div>
          <nav aria-label="Rodapé">
            <a href="#plataforma">
              A plataforma <ChevronRight size={14} />
            </a>
            <a href="#como-funciona">
              Como funciona <ChevronRight size={14} />
            </a>
            <Link to="/store/demo">
              Ver demonstração <ArrowUpRight size={14} />
            </Link>
            <Link to="/login">
              Acessar painel <ArrowUpRight size={14} />
            </Link>
          </nav>
        </div>
        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} Peds's. Feito para o seu negócio.</span>
          <span>
            Seu negócio. No ritmo dos pedidos. <Sparkles size={14} />
          </span>
        </div>
      </footer>
    </div>
  );
}
