// A view selects data, never permissions. The server resolves the session independently.
export function viewScope(
  location = window.location,
  base = import.meta.env.VITE_PUBLIC_DOMAIN || "",
) {
  const path = location.pathname;
  const match = path.match(/^\/(store|menu)\/([^/]+)/);
  if (match) return { kind: "store", store: decodeURIComponent(match[2]) };
  const tracking = path.match(/^\/pedido\/([^/]+)/);
  if (tracking) return { kind: "tracking", tracking: decodeURIComponent(tracking[1]) };
  if (/^\/(dashboard|admin)(\/|$)/.test(path))
    return { kind: "dashboard", store: new URLSearchParams(location.search).get("store") || "" };
  if (path === "/super-admin") return { kind: "central" };
  if (path === "/") {
    const host = location.hostname;
    const subdomain = host.endsWith(".localhost")
      ? host.slice(0, -10)
      : base && host.endsWith(`.${base}`)
        ? host.slice(0, -base.length - 1)
        : "";
    if (subdomain && !["www", "admin"].includes(subdomain))
      return { kind: "store", store: subdomain };
  }
  return { kind: "auth" };
}
