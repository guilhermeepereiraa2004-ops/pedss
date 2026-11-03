import { storeSubdomain } from "../core/storeAddress.ts";
// A view selects data, never permissions. The server resolves the session independently.
export function viewScope(
  location = window.location,
  base = import.meta.env.VITE_PUBLIC_DOMAIN || "pedss.com.br",
) {
  const path = location.pathname;
  const address = storeSubdomain(location.hostname, base);
  const match = path.match(/^\/(store|menu)\/([^/]+)/);
  if (match) return { kind: "store", store: decodeURIComponent(match[2]) };
  const tracking = path.match(/^\/pedido\/([^/]+)/);
  if (tracking) return { kind: "tracking", tracking: decodeURIComponent(tracking[1]) };
  if (/^\/(dashboard|admin)(\/|$)/.test(path))
    return {
      kind: "dashboard",
      store: address || new URLSearchParams(location.search).get("store") || "",
    };
  if (path === "/super-admin") return { kind: "central" };
  if (["/", "/menu", "/menu/"].includes(path) && address) return { kind: "store", store: address };
  return { kind: "auth" };
}
