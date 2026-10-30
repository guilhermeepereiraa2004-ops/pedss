export const menuPath = (slug) => `/menu/${encodeURIComponent(slug)}`;
export function menuUrl(origin, slug) {
  const base = new URL(origin);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password)
    throw new Error("Use um endereço HTTP ou HTTPS para o cardápio.");
  return new URL(menuPath(slug), base.origin).href;
}
export const localMenuUrl = (url) => {
  const host = new URL(url).hostname;
  return (
    host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1" || host === "[::1]"
  );
};
export const matchesMenuSearch = (product, search) => {
  const normalize = (value) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  return normalize(`${product.name} ${product.description}`).includes(normalize(search.trim()));
};
