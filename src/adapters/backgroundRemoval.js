import { DomainError } from "../core/errors.ts";

export function removeImageBackground(src, signal, onProgress) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DomainError("Processamento cancelado."));
    if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined")
      return reject(
        new DomainError(
          "Este navegador não suporta a remoção de fundo. Use uma versão atual do Chrome, Edge, Firefox ou Safari.",
        ),
      );
    const worker = new Worker(new URL("./backgroundRemoval.worker.js", import.meta.url), {
      type: "module",
    });
    let settled = false;
    const finish = (error, blob) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal?.removeEventListener("abort", cancel);
      worker.terminate();
      if (error) reject(new DomainError(error));
      else resolve(blob);
    };
    const cancel = () => finish("Processamento cancelado.");
    const timeout = setTimeout(
      () => finish("A remoção do fundo demorou demais. Tente novamente com uma foto menor."),
      120_000,
    );
    signal?.addEventListener("abort", cancel, { once: true });
    worker.onmessage = ({ data }) => {
      if (data.progress) onProgress?.(data.progress);
      else if (data.error) finish(data.error);
      else if (data.blob instanceof Blob) finish(null, data.blob);
      else finish("Não foi possível gerar a foto sem fundo.");
    };
    worker.onerror = () =>
      finish(
        "Não foi possível carregar o removedor de fundo. Confira a conexão e tente novamente.",
      );
    worker.postMessage({
      src,
      modelUrl: new URL(
        "models/u2netp.onnx",
        new URL(import.meta.env.BASE_URL, window.location.origin),
      ).href,
    });
  });
}
