import { expect, it } from "vitest";
import {
  segmentationInput,
  segmentationAlpha,
  foregroundBounds,
} from "../src/core/backgroundMask.ts";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

it("BG-01 normaliza canais RGB, cria alpha suave e rejeita máscaras vazias/inválidas", () => {
  const input = segmentationInput(new Uint8ClampedArray([255, 128, 0, 255, 0, 255, 128, 255]));
  expect(input).toHaveLength(6);
  expect(input[0]).toBeCloseTo((1 - 0.485) / 0.229);
  expect(input[3]).toBeCloseTo((1 - 0.456) / 0.224);
  expect([...segmentationAlpha(new Float32Array([0.1, 0.5, 0.9]))]).toEqual([0, 128, 255]);
  expect(() => segmentationAlpha(new Float32Array([1, 1]))).toThrow(/separar/);
  expect(() => segmentationAlpha(new Float32Array([NaN, 1]))).toThrow(/identificar/);
});

it("BG-02 centraliza o conteúdo útil com margem e mantém os limites da foto", () => {
  const rgba = new Uint8ClampedArray(20 * 20 * 4);
  for (let y = 6; y <= 10; y++) for (let x = 4; x <= 8; x++) rgba[(y * 20 + x) * 4 + 3] = 255;
  expect(foregroundBounds(rgba, 20, 20)).toEqual({ x: 3, y: 5, width: 7, height: 7 });
  expect(() => foregroundBounds(new Uint8ClampedArray(16), 2, 2)).toThrow(/identificar/);
  expect(foregroundBounds(new Uint8ClampedArray(16).fill(255), 2, 2)).toEqual({
    x: 0,
    y: 0,
    width: 2,
    height: 2,
  });
});

it("BG-03 distribui o modelo compacto com checksum upstream e licença", async () => {
  const model = await readFile("public/models/u2netp.onnx");
  expect(createHash("md5").update(model).digest("hex")).toBe("8e83ca70e441ab06c318d82300c84806");
  expect(model.length).toBeLessThan(5_000_000);
  expect(await readFile("public/models/U2NET-LICENSE.txt", "utf8")).toContain("Apache License");
});
