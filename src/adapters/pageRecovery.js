// The cart already persists separately. This guard stores only a public build filename.
// Never reload merely because the network failed: first confirm a different HTML entry.
export async function reloadNewVersion({
  fetcher = fetch,
  page = document,
  location = window.location,
  storage,
  reload = () => location.reload(),
} = {}) {
  let timer;
  try {
    const saved = storage || window.sessionStorage;
    const entry = page.querySelector('script[type="module"][src]')?.getAttribute("src");
    if (!entry) return false;
    const current = new URL(entry, location.href);
    if (current.origin !== location.origin || !current.pathname.startsWith("/assets/"))
      return false;
    const controller = new AbortController();
    timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetcher("/", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
      headers: { Accept: "text/html" },
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return false;
    const html = await response.text();
    if (html.length > 100000) return false;
    const nextEntry = new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector('script[type="module"][src]')
      ?.getAttribute("src");
    if (!nextEntry) return false;
    const next = new URL(nextEntry, location.href);
    if (
      next.origin !== current.origin ||
      !next.pathname.startsWith("/assets/") ||
      next.pathname === current.pathname
    )
      return false;
    const key = "pedss.page-reload.v1";
    if (saved.getItem(key) === next.pathname) return false;
    saved.setItem(key, next.pathname);
    reload();
    return true;
  } catch {
    // Offline, storage blocked or no valid new build: keep the explicit recovery screen.
    return false;
  } finally {
    clearTimeout(timer);
  }
}
