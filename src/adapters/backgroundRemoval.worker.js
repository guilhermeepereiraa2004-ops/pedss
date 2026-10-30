import { InferenceSession, Tensor, env } from "onnxruntime-web/wasm";
import wasmUrl from "onnxruntime-web/ort-wasm-simd-threaded.wasm?url";
import wasmModuleUrl from "onnxruntime-web/ort-wasm-simd-threaded.mjs?url";
import { segmentationInput, segmentationAlpha, foregroundBounds } from "../core/backgroundMask.ts";

env.wasm.numThreads = 1;
env.wasm.proxy = false;
env.wasm.wasmPaths = { wasm: wasmUrl, mjs: wasmModuleUrl };
const progress = (message) => self.postMessage({ progress: message });

self.onmessage = async ({ data: { src, modelUrl } }) => {
  let session, bitmap;
  try {
    progress("Preparando a foto…");
    const response = await fetch(src);
    if (!response.ok) throw new Error("image");
    const imageBlob = await response.blob();
    if (imageBlob.size > 10 * 1024 * 1024) throw new Error("size");
    bitmap = await createImageBitmap(imageBlob, { imageOrientation: "from-image" });
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40_000_000)
      throw new Error("dimensions");
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, width, height);
    // Already cut-out photos keep their alpha and do not need model inference.
    const pixels = ctx.getImageData(0, 0, width, height).data;
    let border = 0,
      transparent = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        if (x !== 0 && y !== 0 && x !== width - 1 && y !== height - 1) continue;
        border++;
        if (pixels[(y * width + x) * 4 + 3] < 10) transparent++;
      }
    if (transparent / border < 0.95) {
      progress("Carregando o removedor de fundo…");
      session = await InferenceSession.create(modelUrl, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });
      const inputCanvas = new OffscreenCanvas(320, 320);
      const inputContext = inputCanvas.getContext("2d", { willReadFrequently: true });
      inputContext.fillStyle = "white";
      inputContext.fillRect(0, 0, 320, 320);
      inputContext.drawImage(bitmap, 0, 0, 320, 320);
      const tensor = new Tensor(
        "float32",
        segmentationInput(inputContext.getImageData(0, 0, 320, 320).data),
        [1, 3, 320, 320],
      );
      progress("Removendo o fundo da foto…");
      const output = await session.run({ [session.inputNames[0]]: tensor });
      const alpha = segmentationAlpha(output[session.outputNames[0]].data);
      const mask = inputContext.createImageData(320, 320);
      for (let i = 0; i < alpha.length; i++) {
        mask.data[i * 4] = mask.data[i * 4 + 1] = mask.data[i * 4 + 2] = 255;
        mask.data[i * 4 + 3] = alpha[i];
      }
      inputContext.putImageData(mask, 0, 0);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(inputCanvas, 0, 0, width, height);
    }
    progress("Preparando a prévia sem fundo…");
    const bounds = foregroundBounds(ctx.getImageData(0, 0, width, height).data, width, height);
    const trimmed = new OffscreenCanvas(bounds.width, bounds.height);
    trimmed
      .getContext("2d")
      .drawImage(
        canvas,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        0,
        0,
        bounds.width,
        bounds.height,
      );
    self.postMessage({ blob: await trimmed.convertToBlob({ type: "image/png" }) });
  } catch (error) {
    self.postMessage({
      error:
        error.name === "DomainError"
          ? error.message
          : "Não foi possível remover o fundo. Tente novamente ou use outra foto. A imagem anterior foi mantida.",
    });
  } finally {
    bitmap?.close();
    await session?.release();
  }
};
