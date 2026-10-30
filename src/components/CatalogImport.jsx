import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload, Check, RefreshCw, AlertCircle } from "lucide-react";
import { CATALOG_TEMPLATE_URL, readCatalogFile } from "../application/catalogTransfer";
import { catalogFingerprint, planCatalogImport } from "../core/catalogImport.ts";
import { useAction } from "../hooks/useApplication";
import { money } from "../lib/data";
import "./CatalogImport.css";

export default function CatalogImport({ products, onImport, onImported }) {
  const action = useAction(),
    controller = useRef(null),
    [source, setSource] = useState(null),
    [fileName, setFileName] = useState(""),
    [allowUpdates, setAllowUpdates] = useState(false),
    [confirmed, setConfirmed] = useState(false);
  useEffect(() => () => controller.current?.abort(), []);
  const plan = useMemo(() => {
    let index = 0;
    return source
      ? planCatalogImport(
          source.document,
          source.products,
          allowUpdates,
          () => `preview-${index++}`,
        )
      : null;
  }, [source, allowUpdates]);
  const stale = source && source.fingerprint !== catalogFingerprint(products);
  const selectFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    controller.current?.abort();
    controller.current = new AbortController();
    const current = controller.current;
    setSource(null);
    setConfirmed(false);
    setFileName(file.name);
    action.run(async () => {
      const document = await readCatalogFile(file, current.signal);
      if (current.signal.aborted) return;
      setSource({
        document,
        products: structuredClone(products),
        fingerprint: catalogFingerprint(products),
      });
    });
  };
  return (
    <div className="catalog-import">
      <div className="import-guide">
        <span className="import-step">1</span>
        <div>
          <h3>Baixe e preencha o modelo</h3>
          <p>
            Use a aba Produtos para o cardápio e Adicionais para as opções de cada item. A aba
            Instruções explica os campos. Substitua os exemplos pelos produtos da loja. Para editar
            pizzas por tamanho, exporte o cardápio atual e use a aba Preços das pizzas. Preserve
            códigos e IDs. Fichas técnicas, alergênicos, combos e regras existentes serão mantidos
            ao atualizar a mesma loja.
          </p>
          <a
            className="button button-outline button-small"
            href={CATALOG_TEMPLATE_URL}
            download="modelo-cardapio-pedss.xlsx"
          >
            <Download size={14} />
            Baixar planilha modelo
          </a>
        </div>
      </div>
      <div className="import-guide">
        <span className="import-step">2</span>
        <div>
          <h3>Selecione a planilha preenchida</h3>
          <p>
            Arquivo .xlsx de até 2 MB, com até 500 produtos e 1.500 adicionais. Fotos por URL. A
            leitura acontece neste navegador.
          </p>
          <label className={`import-file-picker ${action.busy ? "is-busy" : ""}`}>
            <FileSpreadsheet size={25} />
            <span>
              <strong>{fileName || "Escolher arquivo .xlsx"}</strong>
              <small>{action.busy ? "Processando…" : "Clique para selecionar a planilha"}</small>
            </span>
            <Upload size={17} />
            <input
              aria-label="Selecionar planilha de cardápio"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={action.busy}
              onChange={selectFile}
            />
          </label>
        </div>
      </div>
      <label className="checkbox-field import-update-option">
        <input
          type="checkbox"
          checked={allowUpdates}
          disabled={action.busy}
          onChange={(e) => {
            setAllowUpdates(e.target.checked);
            setConfirmed(false);
          }}
        />
        Atualizar produtos existentes com o mesmo código
      </label>
      <p className="import-update-help">
        Produtos sem código podem ser identificados pelo mesmo nome e categoria. Atualizações
        substituem os campos da planilha, incluindo preço, custo, descrição, foto e ingredientes. A
        aba Adicionais substitui as opções desses produtos; se essa aba estiver ausente, as opções
        atuais são mantidas. Produtos fora do arquivo permanecem no cardápio.
      </p>
      {action.error && (
        <p className="form-error" role="alert">
          {action.error}
        </p>
      )}
      {source && plan && (
        <section className="import-preview" aria-label="Prévia da importação">
          <div className="import-preview-heading">
            <div>
              <span className="import-step">3</span>
              <h3>Confira antes de importar</h3>
            </div>
            <div className="import-counts">
              <span>
                <b>{plan.created}</b> novos
              </span>
              <span>
                <b>{plan.updated}</b> atualizações
              </span>
              <span>
                <b>{plan.issues.length}</b> erros
              </span>
            </div>
          </div>
          {stale && (
            <div className="notice import-stale" role="alert">
              <p>
                O cardápio mudou desde a leitura do arquivo. Atualize a prévia para conferir a
                versão atual.
              </p>
              <button
                className="button button-outline button-small"
                disabled={action.busy}
                onClick={() => {
                  setSource({
                    ...source,
                    products: structuredClone(products),
                    fingerprint: catalogFingerprint(products),
                  });
                  setConfirmed(false);
                  action.setError("");
                }}
              >
                <RefreshCw size={13} />
                Atualizar prévia
              </button>
            </div>
          )}
          {plan.issues.length > 0 && (
            <div className="import-issues" role="alert">
              <h4>
                <AlertCircle size={16} />
                Corrija os erros para liberar a importação
              </h4>
              <ul>
                {plan.issues.slice(0, 100).map((issue, i) => (
                  <li key={i}>
                    <strong>
                      {issue.sheet} · linha {issue.line} · {issue.column}:
                    </strong>{" "}
                    {issue.message}
                  </li>
                ))}
              </ul>
              {plan.issues.length > 100 && (
                <p>Mostrando os primeiros 100 de {plan.issues.length} erros.</p>
              )}
            </div>
          )}
          {plan.entries.length > 0 && (
            <div
              className="import-preview-table"
              tabIndex={0}
              role="region"
              aria-label="Produtos da planilha"
            >
              <table>
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Código / Produto</th>
                    <th>Categoria</th>
                    <th>Preço</th>
                    <th>Custo</th>
                    <th>Opções</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.entries.map((entry, index) => (
                    <tr key={`${entry.product.sku}-${index}`}>
                      <td>{entry.line}</td>
                      <td>
                        <small>{entry.product.sku}</small>
                        <strong>{entry.product.name}</strong>
                        <span>
                          {entry.product.status}
                          {entry.product.featured ? " · Destaque" : ""}
                        </span>
                      </td>
                      <td>{entry.product.category}</td>
                      <td>{money(entry.product.priceCents / 100)}</td>
                      <td>
                        {entry.product.costCents === null
                          ? "Não informado"
                          : money(entry.product.costCents / 100)}
                      </td>
                      <td>
                        {entry.product.extras.length} adicionais
                        <br />
                        {entry.product.ingredients.length} ingredientes
                      </td>
                      <td>
                        <span className={`tag ${entry.action === "create" ? "" : "neutral"}`}>
                          {entry.action === "create" ? "Adicionar" : "Atualizar"}
                        </span>
                        {entry.match === "name" && <small>Mesmo nome e categoria</small>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="import-preserve-note">
            {plan.unchanged} produtos atuais ficam fora deste lote. IDs e pedidos anteriores são
            preservados. A gravação só acontece após sua confirmação e se todas as linhas forem
            válidas.
          </p>
          <label className="checkbox-field import-confirm">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={action.busy || plan.issues.length > 0 || !!stale}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Revisei a prévia e quero importar estes produtos.
          </label>
          <button
            className="button button-dark button-full"
            disabled={
              action.busy || !confirmed || !!stale || plan.issues.length > 0 || !plan.entries.length
            }
            onClick={() =>
              action.run(
                () =>
                  onImport(source.document, {
                    allowUpdates,
                    expectedFingerprint: source.fingerprint,
                  }),
                onImported,
              )
            }
          >
            <Check size={15} />
            {action.busy
              ? "Importando…"
              : `Confirmar importação de ${plan.entries.length} produtos`}
          </button>
        </section>
      )}
    </div>
  );
}
