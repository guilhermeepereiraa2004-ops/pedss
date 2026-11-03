import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Printer, ArrowUpRight, ScanLine } from "lucide-react";
import { useAction } from "../hooks/useApplication";
import { localMenuUrl } from "../lib/menu";
import { publishedMenuUrl, storeHref } from "../application/storeAddress";
import StoreLogo from "./StoreLogo";
import "./MenuQrPanel.css";
function saveFile(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function MenuQrPanel({ company, mode = "local" }) {
  const svgRef = useRef(null),
    action = useAction(),
    [message, setMessage] = useState("");
  let url = "",
    problem = "";
  try {
    url = publishedMenuUrl(
      import.meta.env.VITE_PUBLIC_MENU_ORIGIN || window.location.origin,
      company.slug,
    );
  } catch {
    problem = "Revise VITE_PUBLIC_MENU_ORIGIN: use um endereço HTTP ou HTTPS válido.";
  }
  const isLocal = url && localMenuUrl(url);
  const qr = (ref) =>
    url && (
      <QRCodeSVG
        ref={ref}
        value={url}
        size={256}
        marginSize={4}
        level="M"
        bgColor="#ffffff"
        fgColor="#000000"
        title={`QR code do cardápio de ${company.name}`}
      />
    );
  const png = async () => {
    const blob = new Blob([new XMLSerializer().serializeToString(svgRef.current)], {
        type: "image/svg+xml;charset=utf-8",
      }),
      objectUrl = URL.createObjectURL(blob);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = objectUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1024;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas indisponível");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, 1024, 1024);
      context.drawImage(image, 0, 0, 1024, 1024);
      const output = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!output) throw new Error("Imagem indisponível");
      saveFile(output, `cardapio-${company.slug}.png`);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };
  return (
    <section className="menu-qr-panel">
      <div className="qr-editor-copy">
        <span className="section-kicker">Da tela para a mesa</span>
        <h2>
          Um QR code.
          <br />
          Todo o seu cardápio.
        </h2>
        <p>
          Deixe na mesa, no balcão ou na entrada. O cliente aponta a câmera e encontra os sabores da
          sua casa, sem precisar instalar um aplicativo.
        </p>
        <div className="qr-feature">
          <ScanLine size={20} />
          <div>
            <strong>Sempre o mesmo endereço.</strong>
            <span>Os produtos e preços acompanham o cadastro do estabelecimento.</span>
          </div>
        </div>
        <label className="field">
          Link do cardápio presencial
          <input readOnly value={url} aria-describedby="qr-local-note" />
        </label>
        {problem && (
          <p className="form-error" role="alert">
            {problem}
          </p>
        )}
        <div className="qr-actions">
          <Link className="button button-dark" to={storeHref(company.slug, "menu")}>
            Visualizar cardápio <ArrowUpRight size={14} />
          </Link>
          <button
            className="button button-outline"
            disabled={!url || action.busy}
            onClick={() =>
              action.run(
                () => navigator.clipboard.writeText(url),
                () => setMessage("Link do cardápio copiado."),
              )
            }
          >
            <Copy size={14} />
            Copiar link
          </button>
        </div>
        <p className="notice small-copy" id="qr-local-note">
          {isLocal
            ? "Prévia local: este QR aponta para localhost e não abre no celular de um cliente. "
            : ""}
          {mode === "remote"
            ? "O cardápio é sincronizado com o servidor. Use o endereço publicado para acesso dos clientes."
            : "O uso pelos clientes depende da publicação e dos dados compartilhados do backend. Nesta etapa, o catálogo permanece salvo neste navegador."}
        </p>
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        {action.error && (
          <p role="alert" className="form-error">
            {action.error}
          </p>
        )}
      </div>
      <div className="qr-preview-column">
        <div className="qr-placard" style={{ "--store-accent": company.primaryColor }}>
          <div className="qr-placard-brand">
            <StoreLogo company={company} />
            <strong>{company.name}</strong>
          </div>
          <span className="section-kicker">A casa é sua.</span>
          <h3>
            O que vai
            <br />
            ser hoje?
          </h3>
          <div className="qr-code-frame">{qr(svgRef)}</div>
          <p>
            Aponte a câmera e<br />
            explore nosso cardápio.
          </p>
          <small>{url ? new URL(url).host : ""}</small>
          {isLocal && <small className="qr-preview-label">Prévia local</small>}
        </div>
        <div className="qr-downloads">
          <button
            className="button button-outline button-small"
            disabled={!url || action.busy}
            onClick={() =>
              action.run(async () => {
                saveFile(
                  new Blob([new XMLSerializer().serializeToString(svgRef.current)], {
                    type: "image/svg+xml;charset=utf-8",
                  }),
                  `cardapio-${company.slug}.svg`,
                );
              })
            }
          >
            <Download size={13} />
            SVG
          </button>
          <button
            className="button button-outline button-small"
            disabled={!url || action.busy}
            onClick={() => action.run(png)}
          >
            <Download size={13} />
            PNG
          </button>
          <button
            className="button button-dark button-small"
            disabled={!url}
            onClick={() => window.print()}
          >
            <Printer size={13} />
            Imprimir placa
          </button>
        </div>
        <p className="qr-file-note">
          SVG para impressão em qualquer tamanho. PNG com 1024 × 1024 px.
        </p>
      </div>
      {url &&
        createPortal(
          <div className="qr-print-area" aria-hidden="true">
            <div className="qr-placard">
              <div className="qr-placard-brand">
                <strong>{company.name}</strong>
              </div>
              <span className="section-kicker">A casa é sua.</span>
              <h3>
                O que vai
                <br />
                ser hoje?
              </h3>
              <div className="qr-code-frame">{qr()}</div>
              <p>
                Aponte a câmera e<br />
                explore nosso cardápio.
              </p>
              <small>{url}</small>
              {isLocal && <small>Prévia local: localhost não abre no celular dos clientes.</small>}
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
