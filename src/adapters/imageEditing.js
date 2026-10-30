import { DomainError } from "../core/errors.ts";
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 500_000;
export function hasImageTransparency(image) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return false;
    context.drawImage(image, 0, 0, 64, 64);
    const pixels = context.getImageData(0, 0, 64, 64).data;
    let clear = 0,
      visible = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 10) clear++;
      if (pixels[i] > 128) visible++;
    }
    // Reject an opaque rectangle and an entirely empty image, including a tainted canvas.
    return clear >= 41 && visible >= 41;
  } catch {
    return false;
  }
}
export function readImageFile(file, signal) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new DomainError("Escolha uma imagem PNG, JPEG ou WebP.");
  if (file.size > MAX_INPUT_BYTES) throw new DomainError("Escolha uma imagem de até 10 MB.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const cleanup = () => signal?.removeEventListener("abort", abort);
    const abort = () => {
      reader.abort();
      cleanup();
      reject(new DomainError("Leitura cancelada."));
    };
    if (signal?.aborted) return abort();
    signal?.addEventListener("abort", abort, { once: true });
    reader.onload = () => {
      cleanup();
      resolve(String(reader.result));
    };
    reader.onerror = () => {
      cleanup();
      reject(new DomainError("Não foi possível ler a imagem. Tente outro arquivo."));
    };
    reader.readAsDataURL(file);
  });
}
export function loadImageSource(src, signal) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const cleanup = () => {
      signal?.removeEventListener("abort", abort);
      image.onload = null;
      image.onerror = null;
    };
    const abort = () => {
      cleanup();
      image.src = "";
      reject(new DomainError("Leitura cancelada."));
    };
    if (signal?.aborted) return abort();
    signal?.addEventListener("abort", abort, { once: true });
    image.crossOrigin = "anonymous";
    image.onload = () => {
      cleanup();
      if (
        !image.naturalWidth ||
        !image.naturalHeight ||
        image.naturalWidth * image.naturalHeight > 40_000_000
      )
        return reject(new DomainError("Use uma imagem com até 40 megapixels."));
      resolve({ src, width: image.naturalWidth, height: image.naturalHeight, image });
    };
    image.onerror = () => {
      cleanup();
      reject(
        new DomainError(
          "Não foi possível abrir a imagem para recorte. Se for um link externo, baixe a imagem e use Escolher arquivo.",
        ),
      );
    };
    image.src = src;
  });
}
export async function renderImageCrop(src, area, maxWidth) {
  const source = await loadImageSource(src);
  const canvas = document.createElement("canvas");
  let width = Math.max(1, Math.min(maxWidth, Math.round(area.width)));
  for (let attempt = 0; attempt < 7; attempt++) {
    canvas.width = width;
    canvas.height = Math.max(1, Math.round((width * area.height) / area.width));
    const context = canvas.getContext("2d");
    if (!context) throw new DomainError("Seu navegador não conseguiu preparar o recorte.");
    context.drawImage(
      source.image,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    let blob;
    try {
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/webp", Math.max(0.65, 0.9 - attempt * 0.05)),
      );
    } catch {
      throw new DomainError(
        "O site da imagem não permite recortar esse link. Baixe a imagem e selecione o arquivo.",
      );
    }
    if (!blob)
      throw new DomainError("Não foi possível gerar a imagem recortada. Tente outro arquivo.");
    if (blob.size <= MAX_OUTPUT_BYTES)
      return readImageFile(new File([blob], "recorte", { type: blob.type }));
    width = Math.max(1, Math.round(width * 0.75));
  }
  throw new DomainError(
    "A imagem continua muito grande. Escolha outro arquivo ou um recorte menor.",
  );
}
