import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Store, Clock3 } from "lucide-react";
import Brand from "../components/Brand";
import useApplication, { useAction } from "../hooks/useApplication";
import { trialRegistrationSchema } from "../core/model.ts";
import { makeSlug } from "../lib/data";
import { storefrontTemplates } from "../lib/storefrontTemplates";
import "./TrialSignup.css";

export default function TrialSignup() {
  const { auth, identity, state, mode } = useApplication();
  const navigate = useNavigate();
  const action = useAction();
  const [step, setStep] = useState(1);
  const [confirm, setConfirm] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
    slug: "",
    heroSegment: "",
    primaryColor: "#d5f36b",
  });
  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    action.setError("");
  };
  const submit = (event) => {
    event.preventDefault();
    const input = { ...form, email: form.email.trim() };
    const schema =
      step === 1
        ? trialRegistrationSchema.pick({ name: true, email: true, password: true })
        : trialRegistrationSchema;
    const values =
      step === 1 ? { name: input.name, email: input.email, password: input.password } : input;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      action.setError(parsed.error.issues[0]?.message || "Confira os dados.");
      return;
    }
    if (form.password !== confirm) {
      action.setError("As senhas precisam ser iguais.");
      return;
    }
    if (step === 1) {
      action.setError("");
      setStep(2);
      return;
    }
    action.run(
      () => auth.registerTrial(input),
      (result) => {
        navigate(`/dashboard?store=${encodeURIComponent(result.slug)}&tab=settings&welcome=trial`, {
          replace: true,
        });
      },
    );
  };
  const currentStore = state.companies.find((c) => c.id === identity?.storeId);
  return (
    <main className="trial-signup-page">
      <aside className="trial-signup-story">
        <Brand />
        <div>
          <span className="trial-pill">
            <Clock3 size={15} /> 7 dias para experimentar
          </span>
          <h1>
            Sua loja.
            <br />
            Seu próximo
            <br />
            <em>bom começo.</em>
          </h1>
          <p>Conheça a Peds&apos;s na prática, com a sua marca e o seu cardápio.</p>
          <ul>
            <li>
              <Check size={16} /> Todas as funcionalidades da sua loja
            </li>
            <li>
              <Check size={16} /> Sem cartão e sem cobrança automática
            </li>
            <li>
              <Check size={16} /> Seus dados preservados ao fim do teste
            </li>
          </ul>
        </div>
        <img
          src="/brand/peds-mascot-hero-640-v1.webp"
          alt="Mascote da Peds's dando as boas-vindas"
          width="640"
          height="640"
          decoding="async"
        />
      </aside>
      <section className="trial-signup-content" aria-label="Cadastro para teste de 7 dias">
        <Link to="/" className="text-link">
          <ArrowLeft size={14} /> Voltar ao site
        </Link>
        {identity ? (
          <div className="trial-signup-card">
            <h2>Você já está na sua conta.</h2>
            <p>Acesse sua loja ou saia para cadastrar outra conta de teste.</p>
            <Link
              className="button button-dark button-full"
              to={
                identity.role === "admin"
                  ? "/super-admin"
                  : `/dashboard?store=${currentStore?.slug || "demo"}`
              }
            >
              Ir para o meu painel <ArrowRight size={16} />
            </Link>
            <button
              className="button button-outline button-full"
              disabled={action.busy}
              onClick={() => action.run(() => auth.signOut())}
            >
              Sair da conta atual
            </button>
            {action.error && (
              <p className="form-error" role="alert">
                {action.error}
              </p>
            )}
          </div>
        ) : (
          <div className="trial-signup-card">
            <ol className="trial-signup-steps" aria-label="Etapas do cadastro">
              <li aria-current={step === 1 ? "step" : undefined}>
                <b>{step === 2 ? <Check size={13} /> : "1"}</b> Sua conta
              </li>
              <li aria-current={step === 2 ? "step" : undefined}>
                <b>2</b> Sua loja
              </li>
            </ol>
            <h2>{step === 1 ? "Bora começar?" : "Agora, a sua loja."}</h2>
            <p>
              {step === 1
                ? "Crie seu acesso de gestor. O teste começa quando concluir o cadastro."
                : "Dê a sua identidade à loja. Depois, configure atendimento, entrega e cardápio no painel."}
            </p>
            {mode !== "remote" && (
              <div className="notice">
                Demonstração local: esta conta e sua loja ficam neste navegador, separadas da
                produção. Nenhum e-mail será enviado.
              </div>
            )}
            <form className="form-stack" onSubmit={submit}>
              {step === 1 ? (
                <>
                  <label className="field">
                    Seu nome
                    <input
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={80}
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    E-mail
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Crie sua senha
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={10}
                      maxLength={128}
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                    />
                    <small>De 10 a 128 caracteres, com letras e números.</small>
                  </label>
                  <label className="field">
                    Confirme a senha
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={10}
                      maxLength={128}
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        action.setError("");
                      }}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="field">
                    Nome da loja
                    <input
                      required
                      minLength={2}
                      maxLength={80}
                      value={form.storeName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setForm((f) => ({
                          ...f,
                          storeName: name,
                          ...(!slugEdited ? { slug: makeSlug(name).slice(0, 60) } : {}),
                        }));
                        action.setError("");
                      }}
                    />
                  </label>
                  <label className="field">
                    Tipo de estabelecimento
                    <select
                      required
                      value={form.heroSegment}
                      onChange={(e) => update("heroSegment", e.target.value)}
                    >
                      <option value="">Selecione o tipo</option>
                      {Object.entries(storefrontTemplates).map(([key, s]) => (
                        <option key={key} value={key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Endereço da loja
                    <div className="trial-slug-field">
                      <span>/store/</span>
                      <input
                        required
                        minLength={2}
                        maxLength={60}
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        value={form.slug}
                        onChange={(e) => {
                          setSlugEdited(true);
                          update("slug", e.target.value);
                        }}
                      />
                    </div>
                    <small>
                      O endereço fica reservado para sua loja e não pode ser alterado depois.
                    </small>
                  </label>
                  <div className="field trial-color-field">
                    <label htmlFor="trial-brand-color">Cor da marca</label>
                    <div className="trial-color-controls">
                      <input
                        id="trial-brand-color"
                        type="color"
                        value={
                          /^#[0-9a-f]{6}$/i.test(form.primaryColor) ? form.primaryColor : "#d5f36b"
                        }
                        onChange={(e) => update("primaryColor", e.target.value)}
                      />
                      <input
                        aria-label="Cor da marca em hexadecimal"
                        required
                        maxLength={7}
                        pattern="#[0-9A-Fa-f]{6}"
                        placeholder="#d5f36b"
                        value={form.primaryColor}
                        onChange={(e) => update("primaryColor", e.target.value)}
                      />
                    </div>
                    <small>
                      Logo, fotos e outros detalhes podem ser ajustados nas configurações.
                    </small>
                  </div>
                  <div className="trial-signup-summary">
                    <Store size={18} />
                    <span>
                      Loja própria, acesso de gestor e 7 dias completos.
                      <small>
                        Ao fim do teste, escolha um plano com a central para continuar. Sem cobrança
                        automática.
                      </small>
                    </span>
                  </div>
                </>
              )}
              {action.error && (
                <p className="form-error" role="alert">
                  {action.error}
                </p>
              )}
              <button
                type="submit"
                className="button button-dark button-full"
                disabled={action.busy}
              >
                {action.busy
                  ? "Preparando sua loja…"
                  : step === 1
                    ? "Continuar"
                    : "Criar conta e configurar minha loja"}
                <ArrowRight size={17} />
              </button>
              {step === 2 && (
                <button
                  type="button"
                  className="text-link"
                  disabled={action.busy}
                  onClick={() => {
                    setStep(1);
                    action.setError("");
                  }}
                >
                  <ArrowLeft size={14} /> Voltar para os dados da conta
                </button>
              )}
            </form>
            <p className="trial-login-link">
              Já tem uma conta? <Link to="/login">Entrar no meu painel</Link>
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
