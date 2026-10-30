import { expect, it } from "vitest";
import { imageCrop } from "../src/core/imageCrop.ts";
it("CROP-01 recorte respeita proporção, limites e posição em imagens largas e altas", () => {
  expect(imageCrop(1600, 900, 1)).toEqual({ x: 350, y: 0, width: 900, height: 900 });
  expect(imageCrop(600, 1200, 4 / 3, 2, 0, 100)).toEqual({ x: 0, y: 975, width: 300, height: 225 });
  for (const [w, h] of [
    [600, 1200],
    [1600, 900],
    [1, 1],
  ])
    for (const aspect of [1, 4 / 3, 16 / 9])
      for (const zoom of [1, 1.75, 3]) {
        const crop = imageCrop(w, h, aspect, zoom, 100, 100);
        expect(crop.width / crop.height).toBeCloseTo(aspect, 8);
        expect(crop.x).toBeGreaterThanOrEqual(0);
        expect(crop.y).toBeGreaterThanOrEqual(0);
        expect(crop.x + crop.width).toBeLessThanOrEqual(w + 1e-8);
        expect(crop.y + crop.height).toBeLessThanOrEqual(h + 1e-8);
      }
  expect(imageCrop(1000, 1000, 1, 9, -50, 300)).toEqual(imageCrop(1000, 1000, 1, 3, 0, 100));
  expect(() => imageCrop(0, 100, 1)).toThrow(/inválidas/);
  expect(() => imageCrop(100, 100, NaN)).toThrow(/inválidas/);
});
