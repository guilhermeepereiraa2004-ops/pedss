self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("push", (event) => {
  let payload;
  try {
    payload = event.data?.json();
  } catch {
    return;
  }
  if (
    payload?.kind !== "pedss-order" ||
    typeof payload.store !== "string" ||
    typeof payload.tag !== "string" ||
    typeof payload.body !== "string"
  ) return;

  event.waitUntil(
    self.registration.showNotification("Novo pedido na Peds's", {
      body: payload.body,
      icon: "/brand/peds-icon-180-v1.png",
      tag: payload.tag,
      data: { store: payload.store },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const store = event.notification.data?.store;
  if (typeof store !== "string" || !store) return;

  const target = new URL("/dashboard", self.location.origin);
  target.search = new URLSearchParams({ store, tab: "orders" });
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const current = windows.find((client) => {
        const url = new URL(client.url);
        return (
          url.origin === target.origin &&
          url.pathname === target.pathname &&
          url.searchParams.get("store") === store &&
          url.searchParams.get("tab") === "orders"
        );
      });
      return current ? current.focus() : self.clients.openWindow(target.href);
    })(),
  );
});
