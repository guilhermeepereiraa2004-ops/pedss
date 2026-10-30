const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
function luminance(rgb) {
  const linear = rgb.map((v) =>
    v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4,
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function readableOnWhite(rgb, minimum) {
  const ink = channels("#30231d");
  for (let step = 0; step <= 20; step++) {
    const mixed = rgb.map((value, i) => Math.round(value * (1 - step / 20) + (ink[i] * step) / 20));
    if (1.05 / (luminance(mixed) + 0.05) >= minimum)
      return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  }
  return "#30231d";
}
export function storeColors(color) {
  const accent = /^#[a-f0-9]{6}$/i.test(color) ? color : "#d5f36b";
  const rgb = channels(accent);
  let onAccent = "#ffffff";
  if (1.05 / (luminance(rgb) + 0.05) < 4.5) {
    const ink = channels("#252820");
    for (let step = 0; step <= 20; step++) {
      const candidate = ink.map((value) => Math.round(value * (1 - step / 20)));
      if ((luminance(rgb) + 0.05) / (luminance(candidate) + 0.05) >= 4.5) {
        onAccent = `#${candidate.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
        break;
      }
    }
  }
  return {
    accent,
    onAccent,
    headline: readableOnWhite(rgb, 3.8),
    text: readableOnWhite(rgb, 5.6),
  };
}
