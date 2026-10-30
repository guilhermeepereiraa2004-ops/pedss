import { readImageFile, loadImageSource, renderImageCrop } from "../adapters/imageEditing.js";
import { removeImageBackground } from "../adapters/backgroundRemoval.js";
import { DomainError } from "../core/errors.ts";
export async function prepareImageFile(file, signal) {
  return prepareCropSource(await readImageFile(file, signal), signal);
}
export async function prepareCropSource(src, signal) {
  const { width, height } = await loadImageSource(src, signal);
  return { src, width, height };
}
export const applyImageCrop = renderImageCrop;
export { hasImageTransparency } from "../adapters/imageEditing.js";

export async function prepareCutoutSource(src, signal, onProgress) {
  const blob = await removeImageBackground(src, signal, onProgress);
  if (signal?.aborted) throw new DomainError("Processamento cancelado.");
  const result = await readImageFile(
    new File([blob], "produto-sem-fundo.png", { type: blob.type }),
    signal,
  );
  return prepareCropSource(result, signal);
}

export async function prepareCutoutFile(file, signal, onProgress) {
  return prepareCutoutSource(await readImageFile(file, signal), signal, onProgress);
}

export async function createProductCutout(src, signal, onProgress) {
  const source = await prepareCutoutSource(src, signal, onProgress);
  const result = await renderImageCrop(
    source.src,
    { x: 0, y: 0, width: source.width, height: source.height },
    1600,
  );
  if (signal?.aborted) throw new DomainError("Processamento cancelado.");
  return result;
}
