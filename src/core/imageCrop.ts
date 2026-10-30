import { DomainError } from "./errors.ts";
export type CropArea = { x: number; y: number; width: number; height: number };
export function imageCrop(
  width: number,
  height: number,
  aspect: number,
  zoom = 1,
  horizontal = 50,
  vertical = 50,
): CropArea {
  if (
    ![width, height, aspect, zoom, horizontal, vertical].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0 ||
    aspect <= 0
  )
    throw new DomainError("As dimensões da imagem são inválidas.");
  const scale = Math.max(1, Math.min(3, zoom));
  const cropWidth = Math.min(width, height * aspect) / scale,
    cropHeight = cropWidth / aspect;
  return {
    x: ((width - cropWidth) * Math.max(0, Math.min(100, horizontal))) / 100,
    y: ((height - cropHeight) * Math.max(0, Math.min(100, vertical))) / 100,
    width: cropWidth,
    height: cropHeight,
  };
}
