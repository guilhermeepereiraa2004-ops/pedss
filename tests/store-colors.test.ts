import { expect, it } from "vitest";
import { storeColors } from "../src/lib/storeColors.js";

const luminance = (hex: string) => {
  const linear = [1, 3, 5].map((i) => {
    const n = parseInt(hex.slice(i, i + 2), 16) / 255;
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};
const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

it("COLOR-01 a cor da loja mantém contraste legível em tons claros, médios e escuros", () => {
  const palette = ["#ff6800", "#2563eb", "#7c3aed", "#d5f36b", "#ffff00", "#ffffff", "#000000"];
  for (let channel = 0; channel <= 255; channel++)
    palette.push(`#${channel.toString(16).padStart(2, "0").repeat(3)}`);
  for (const color of palette) {
    const colors = storeColors(color);
    expect(colors.accent).toBe(color);
    expect(contrast(color, colors.onAccent), color).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#ffffff", colors.text), color).toBeGreaterThanOrEqual(5.6);
  }
  expect(storeColors("inválida").accent).toBe("#d5f36b");
});
