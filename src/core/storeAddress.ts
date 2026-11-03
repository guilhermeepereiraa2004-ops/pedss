import type { Company } from "./model.ts";

export const RESERVED_STORE_ADDRESSES = [
  "admin",
  "www",
  "dashboard",
  "super-admin",
  "login",
  "pedido",
  "menu",
  "store",
  "cadastro",
  "teste-gratis",
  "recuperar",
  "configurar-acesso",
  "api",
  "mail",
  "smtp",
  "imap",
  "pop",
  "ftp",
  "ns1",
  "ns2",
];
export const compactStoreSlug = (slug: string) => slug.replaceAll("-", "");

/** An alias never chooses arbitrarily between two historical stores. */
export function resolveStoreCompany(companies: Company[], address: string) {
  const exact = companies.find((company) => company.id === address || company.slug === address);
  if (exact) return exact;
  const matches = companies.filter((company) => compactStoreSlug(company.slug) === address);
  return matches.length === 1 ? matches[0] : undefined;
}

export function storeSubdomain(hostname: string, base = "pedss.com.br") {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const domain = base.toLowerCase().replace(/\.$/, "");
  const candidate = host.endsWith(".localhost")
    ? host.slice(0, -10)
    : domain && host.endsWith(`.${domain}`)
      ? host.slice(0, -domain.length - 1)
      : "";
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(candidate) &&
    !RESERVED_STORE_ADDRESSES.some((name) => compactStoreSlug(name) === compactStoreSlug(candidate))
    ? candidate
    : "";
}
