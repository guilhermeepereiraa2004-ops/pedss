import { DomainError } from "../core/errors.ts";
import { downloadCatalogFile } from "../adapters/catalogDownload.js";
const MAX_WORKBOOK_BYTES = 2 * 1024 * 1024;
export const CATALOG_TEMPLATE_URL = "/templates/modelo-cardapio-brasa.xlsx";
export async function readCatalogFile(file, signal) {
  if (!/\.xlsx$/i.test(file.name))
    throw new DomainError(
      "Selecione um arquivo .xlsx. Baixe o modelo para preencher no Excel ou Google Planilhas.",
    );
  if (file.size > MAX_WORKBOOK_BYTES) throw new DomainError("Use uma planilha de até 2 MB.");
  const buffer = await file.arrayBuffer();
  return runCatalogWorker(buffer, [buffer], signal);
}
function runCatalogWorker(payload, transfer, signal, exporting = false) {
  if (signal?.aborted) throw new DomainError("Leitura cancelada.");
  if (typeof Worker === "undefined") {
    throw new DomainError(
      "Este navegador não suporta a leitura de planilhas. Use uma versão atual do Chrome, Edge, Firefox ou Safari.",
    );
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../adapters/catalogImport.worker.js", import.meta.url), {
      type: "module",
    });
    let timer;
    const finish = (error, result) => {
      clearTimeout(timer);
      worker.terminate();
      signal?.removeEventListener("abort", abort);
      error ? reject(error) : resolve(result);
    };
    const abort = () => finish(new DomainError("Leitura cancelada."));
    signal?.addEventListener("abort", abort, { once: true });
    timer = setTimeout(
      () =>
        finish(
          new DomainError("O processamento demorou demais. Tente novamente com um arquivo menor."),
        ),
      exporting ? 60000 : 20000,
    );
    worker.onmessage = (event) =>
      event.data.error
        ? finish(new DomainError(event.data.error))
        : finish(null, exporting ? event.data.file : event.data.document);
    worker.onerror = () =>
      finish(new DomainError("Não foi possível processar a planilha. Tente novamente."));
    worker.postMessage(payload, transfer);
  });
}

export async function exportCatalogFile(snapshot, signal) {
  const response = await fetch(CATALOG_TEMPLATE_URL, { signal });
  if (!response.ok)
    throw new DomainError("Não foi possível carregar o formato da planilha. Tente novamente.");
  const template = await response.arrayBuffer();
  return runCatalogWorker({ operation: "export", snapshot, template }, [template], signal, true);
}

export async function downloadCurrentCatalog(services, storeId, signal) {
  const snapshot = await services.exportCatalog(storeId);
  const file = await exportCatalogFile(snapshot, signal);
  if (signal?.aborted) throw new DomainError("Exportação cancelada.");
  downloadCatalogFile(file);
  return { ...file, buffer: undefined, codesAssigned: snapshot.codesAssigned };
}
