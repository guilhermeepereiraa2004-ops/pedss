import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import Brand from "../components/Brand";
import useApplication, { useAction } from "../hooks/useApplication";
import "./Auth.css";
export default function Auth({ mode = "login" }) {
  const { auth, state, identity, mode: runtimeMode } = useApplication();
  const cloud = runtimeMode === "remote";
  const { token } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const action = useAction();
  const [localLink, setLocalLink] = useState("");
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { setupToken: mode === "setup" && cloud ? window.location.hash.slice(1) : "" },
  });
  const home = () => {
    const user = auth.current();
    const requested = params.get("next");
    if (
      requested &&
      /^\/(dashboard|admin|super-admin)(?:[/?]|$)/.test(requested) &&
      !requested.includes("\\")
    )
      return requested;
    const c = state.companies.find((c) => c.id === user?.storeId);
    return user?.role === "admin" ? "/super-admin" : `/dashboard?store=${c?.slug || "demo"}`;
  };
  const submit = handleSubmit((values) =>
    action.run(async () => {
      if (mode === "setup")
        await auth.setup(values.name, values.email, values.password, values.setupToken);
      else if (mode === "forgot") {
        const raw = await auth.requestReset(values.email);
        setMessage(
          "Solicitação processada. No modo local, o link aparece abaixo somente para uma conta existente. Nenhum e-mail foi enviado.",
        );
        if (raw) setLocalLink(`${window.location.origin}/redefinir/${raw}`);
        return;
      } else if (mode === "reset") await auth.reset(token, values.password);
      else if (mode === "invite") await auth.acceptInvitation(token, values.password);
      else await auth.signIn(values.email, values.password);
      if (mode === "reset") {
        setMessage("Senha local redefinida. Entre novamente.");
        return;
      }
      navigate(home(), { replace: true });
    }),
  );
  const titles = {
    login: ["Bom ter você por aqui.", "Entre no seu espaço de gestão."],
    setup: ["Prepare a sua central.", "Crie a primeira conta administrativa local."],
    forgot: ["Vamos recuperar o acesso.", "Informe o e-mail cadastrado neste navegador."],
    reset: ["Um novo acesso.", "Defina a nova senha da sua conta local."],
    invite: ["Você faz parte da casa.", "Aceite o convite com uma senha de acesso local."],
  };
  const password = register("password", {
    required: "Informe a senha.",
    ...(mode !== "login"
      ? {
          minLength: { value: 10, message: "Use ao menos 10 caracteres." },
          validate: (v) => (/[a-z]/i.test(v) && /\d/.test(v)) || "Use letras e números.",
        }
      : {}),
  });
  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Brand />
        <div>
          <img
            className="auth-mascot"
            src="/brand/peds-mascot-hero-640-v1.webp"
            alt=""
            aria-hidden="true"
            width="640"
            height="640"
            decoding="async"
          />
          <h2>
            Seu negócio.
            <br />
            Seu próximo passo.
          </h2>
          <p>
            Organização para a operação.
            <br />
            Mais tempo para o sabor.
          </p>
        </div>
        <span>{cloud ? "PEDS'S / GESTÃO CONECTADA" : "PEDS'S / GESTÃO LOCAL"}</span>
      </section>
      <section className="auth-form-panel">
        <Link to="/" className="text-link">
          Voltar ao site <ArrowUpRight size={13} />
        </Link>
        <div className="auth-card">
          <span className="eyebrow">Seu delivery, aceso.</span>
          <h1>{titles[mode][0]}</h1>
          <p>
            {cloud
              ? {
                  login: "Entre no seu espaço de gestão.",
                  setup: "Crie a primeira conta com seu código privado de configuração.",
                  forgot: "Solicite a recuperação ao administrador.",
                  reset: "Defina uma nova senha.",
                  invite: "Defina sua senha para aceitar o convite.",
                }[mode]
              : titles[mode][1]}
          </p>
          <div className="notice">
            {cloud
              ? "Acesso individual. Seus dados são sincronizados com o servidor."
              : "Modo de demonstração: contas e senhas são independentes da produção e ficam neste navegador e endereço. Para explorar sem senha, use os botões abaixo."}
          </div>
          {!identity && mode === "login" && (
            <Link className="text-link" to="/cadastro">
              Teste a Peds&apos;s por 7 dias
            </Link>
          )}
          {identity && mode === "login" && (
            <Link className="button button-outline button-full" to={home()}>
              Continuar como {identity.name} <ArrowUpRight size={15} />
            </Link>
          )}
          <form className="form-stack" onSubmit={submit} noValidate>
            {cloud && mode === "setup" && (
              <label className="field">
                Código privado de configuração
                <input
                  type="password"
                  autoComplete="off"
                  {...register("setupToken", { required: "Informe o código privado." })}
                />
                {errors.setupToken && <small role="alert">{errors.setupToken.message}</small>}
              </label>
            )}
            {mode === "setup" && (
              <label className="field">
                Seu nome
                <input
                  {...register("name", {
                    required: "Informe seu nome.",
                    minLength: { value: 2, message: "Use pelo menos 2 caracteres." },
                  })}
                  autoComplete="name"
                />
                {errors.name && <small role="alert">{errors.name.message}</small>}
              </label>
            )}
            {!["reset", "invite"].includes(mode) && (
              <label className="field">
                E-mail
                <input
                  type="email"
                  {...register("email", {
                    required: "Informe o e-mail.",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Informe um e-mail válido.",
                    },
                  })}
                  autoComplete="email"
                />
                {errors.email && <small role="alert">{errors.email.message}</small>}
              </label>
            )}
            {mode !== "forgot" && (
              <label className="field">
                Senha
                <input
                  type="password"
                  {...password}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                {errors.password && <small role="alert">{errors.password.message}</small>}
              </label>
            )}
            {action.error && (
              <p className="form-error" role="alert">
                {action.error}
              </p>
            )}
            {message && (
              <div className="notice" role="status">
                {message}
              </div>
            )}
            {!message && (
              <button
                className="button button-dark button-full"
                disabled={action.busy}
                type="submit"
              >
                {action.busy
                  ? "Aguarde…"
                  : cloud
                    ? {
                        login: "Entrar",
                        setup: "Criar conta administrativa",
                        forgot: "Solicitar recuperação",
                        reset: "Redefinir senha",
                        invite: "Aceitar convite",
                      }[mode]
                    : {
                        login: "Entrar",
                        setup: "Criar acesso local",
                        forgot: "Gerar recuperação local",
                        reset: "Redefinir senha local",
                        invite: "Aceitar convite local",
                      }[mode]}
                <ArrowUpRight size={16} />
              </button>
            )}
            {mode === "login" && !cloud && (
              <Link className="text-link" to="/recuperar">
                Esqueci minha senha
              </Link>
            )}
            {["reset", "forgot"].includes(mode) && (
              <Link className="text-link" to="/login">
                Voltar para entrar
              </Link>
            )}
          </form>
          {localLink && (
            <div className="local-link-box">
              <strong>Simulação local de recuperação</strong>
              <p>O link expira em 15 minutos e pode ser usado uma vez.</p>
              <Link to={new URL(localLink).pathname}>
                Abrir redefinição <ArrowUpRight size={13} />
              </Link>
              <button
                className="text-link"
                onClick={() =>
                  action.run(async () => {
                    await navigator.clipboard.writeText(localLink);
                    setMessage("Link copiado. Válido somente neste navegador e origem.");
                  })
                }
              >
                <Copy size={12} /> Copiar link local
              </button>
            </div>
          )}
          {mode === "login" && !cloud && (
            <>
              <div className="auth-demo">
                <span className="section-kicker">Explorar sem criar uma conta</span>
                {[
                  ["admin", "Administrador da plataforma"],
                  ["owner", "Gestor da loja demo"],
                  ["attendant", "Atendente da loja demo"],
                ].map(([role, label]) => (
                  <button
                    key={role}
                    className="button button-outline button-full"
                    disabled={action.busy}
                    onClick={() =>
                      action.run(
                        () => auth.startDemo(role),
                        () => navigate(home(), { replace: true }),
                      )
                    }
                  >
                    {label}
                    <ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
              {!state.users.some((u) => u.role === "admin" && !u.id.startsWith("demo-")) && (
                <Link className="text-link" to="/configurar-acesso">
                  Configurar minha primeira conta local <ArrowUpRight size={13} />
                </Link>
              )}
            </>
          )}
          {cloud && mode === "login" && auth.setupAvailable && (
            <Link className="text-link" to="/configurar-acesso">
              Configurar primeira conta com código privado
            </Link>
          )}
          {cloud && mode === "login" && (
            <p className="small-copy muted">
              Para recuperar o acesso, entre em contato com o administrador.
            </p>
          )}
        </div>
        <small className="auth-footnote">
          <Check size={11} />{" "}
          {cloud
            ? "Dados sincronizados. Nenhum envio automático de e-mail."
            : "Nenhum banco de dados ou serviço de e-mail conectado."}
        </small>
      </section>
    </main>
  );
}
