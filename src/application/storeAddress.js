import { compactStoreSlug, storeSubdomain } from "../core/storeAddress.ts";

export const publicDomain = () => import.meta.env.VITE_PUBLIC_DOMAIN || "pedss.com.br";
export const currentStoreAddress = (location = window.location) =>
  storeSubdomain(location.hostname, publicDomain());

/** Keep local and legacy URLs usable; published store links use the store's hostname. */
export function storeHref(slug, kind = "store", location = window.location) {
  const base = publicDomain();
  const host = location.hostname.toLowerCase();
  const suffix = kind === "store" ? "/" : `/${kind}`;
  const address = currentStoreAddress(location);
  const ownHost = address === slug || address === compactStoreSlug(slug);
  const ready = (import.meta.env.VITE_PUBLIC_STORE_SLUGS || "")
    .split(",")
    .map((value) => compactStoreSlug(value.trim()))
    .includes(compactStoreSlug(slug));
  if ((host === base || host.endsWith(`.${base}`)) && (ready || ownHost))
    return `https://${ready ? `${compactStoreSlug(slug)}.${base}` : host}${suffix}`;
  if (ownHost) return suffix;
  return kind === "dashboard"
    ? `/dashboard?store=${encodeURIComponent(slug)}`
    : `/${kind}/${encodeURIComponent(slug)}`;
}

export function publishedMenuUrl(origin, slug) {
  const base = new URL(origin);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password)
    throw new Error("Use um endereço HTTP ou HTTPS para o cardápio.");
  return new URL(storeHref(slug, "menu", base), base.origin).href;
}
