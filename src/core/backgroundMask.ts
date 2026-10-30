import { DomainError } from "./errors.ts";

/** U²-Net input: RGB channels first, normalized as in the upstream implementation. */
export function segmentationInput(rgba: Uint8ClampedArray) {
  const size = rgba.length / 4;
  let max = 1;
  for (let i = 0; i < rgba.length; i += 4) max = Math.max(max, rgba[i], rgba[i + 1], rgba[i + 2]);
  const result = new Float32Array(size * 3);
  const mean = [0.485, 0.456, 0.406],
    std = [0.229, 0.224, 0.225];
  for (let channel = 0; channel < 3; channel++)
    for (let i = 0; i < size; i++)
      result[channel * size + i] = (rgba[i * 4 + channel] / max - mean[channel]) / std[channel];
  return result;
}

export function segmentationAlpha(values: Float32Array) {
  let min = Infinity,
    max = -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value))
      throw new DomainError(
        "Não foi possível identificar o produto nesta foto. Tente outra imagem.",
      );
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  if (max - min < 0.00001)
    throw new DomainError(
      "Não foi possível separar o produto do fundo. Tente uma foto com mais contraste.",
    );
  return Uint8ClampedArray.from(values, (value) => Math.round(((value - min) / (max - min)) * 255));
}

export function foregroundBounds(rgba: Uint8ClampedArray, width: number, height: number) {
  let left = width,
    right = -1,
    top = height,
    bottom = -1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] < 24) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  if (right < left)
    throw new DomainError("Não foi possível identificar o produto. Tente outra foto.");
  const padding = Math.ceil(Math.max(right - left + 1, bottom - top + 1) * 0.05);
  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(width - 1, right + padding);
  bottom = Math.min(height - 1, bottom + padding);
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}
