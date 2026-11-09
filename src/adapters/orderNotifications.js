const preferenceChanged = "pedss:order-notifications";
const temporaryPreferences = new Map();

async function registerOrderNotificationWorker() {
  const registration = await navigator.serviceWorker.register("/order-notifications.js", {
    scope: "/dashboard",
  });
  const worker = registration.active || registration.installing || registration.waiting;
  if (!worker) throw new Error("Notification worker unavailable");
  if (worker.state === "activated") return registration;

  await new Promise((resolve, reject) => {
    function checkState() {
      if (!["activated", "redundant"].includes(worker.state)) return;
      worker.removeEventListener("statechange", checkState);
      if (worker.state === "activated") resolve();
      else reject(new Error("Notification worker unavailable"));
    }
    worker.addEventListener("statechange", checkState);
    checkState();
  });
  return registration;
}

async function requestOrderPush(command, ...args) {
  const response = await fetch("/api/app", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-Pedss-Client": "web" },
    body: JSON.stringify({ kind: "order-push", command, args }),
  });
  const payload = await response.json();
  if (!response.ok)
    throw new Error(payload.error?.message || "Não foi possível configurar o push.");
  return payload.result;
}

export async function prepareOrderPush(storeId) {
  if (orderNotificationStatus(storeId) === "blocked") return { status: "blocked" };
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  if (ios && !navigator.standalone && !window.matchMedia("(display-mode: standalone)").matches)
    return { status: "install" };
  if (orderNotificationStatus(storeId) === "unavailable" || !window.PushManager)
    return { status: "unavailable" };

  const registration = await registerOrderNotificationWorker();
  const subscription = await registration.pushManager.getSubscription();
  const { publicKey, subscribed } = await requestOrderPush(
    "status",
    storeId,
    subscription?.endpoint || null,
  );
  if (!publicKey) return { status: "unconfigured" };
  return {
    status: subscribed && window.Notification.permission === "granted" ? "on" : "off",
    registration,
    subscription,
    publicKey,
  };
}

export async function toggleOrderPush(storeId, device) {
  if (device.status === "on") {
    // A browser subscription can also be used for other stores on this device.
    await requestOrderPush("unsubscribe", storeId, device.subscription.endpoint);
    return { ...device, status: "off" };
  }

  const rawKey = window.atob(device.publicKey.replaceAll("-", "+").replaceAll("_", "/"));
  const applicationServerKey = Uint8Array.from(rawKey, (char) => char.charCodeAt(0));
  // Start subscribe within the click gesture, which Safari requires.
  const subscription = await device.registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
  await requestOrderPush("subscribe", storeId, subscription.toJSON(), device.publicKey);
  return { ...device, status: "on", subscription };
}

export function orderNotificationStatus(key) {
  if (
    !key ||
    !window.isSecureContext ||
    !window.Notification?.requestPermission ||
    !navigator.serviceWorker ||
    !window.ServiceWorkerRegistration?.prototype.showNotification
  )
    return "unavailable";
  if (window.Notification.permission === "denied") return "blocked";
  if (window.Notification.permission !== "granted") return "off";

  let enabled;
  try {
    enabled = window.localStorage.getItem(key) === "on";
  } catch {
    enabled = temporaryPreferences.get(key);
  }
  return enabled ? "on" : "off";
}

export function subscribeToOrderNotifications(listener) {
  const events = [preferenceChanged, "storage", "focus"];
  for (const event of events) window.addEventListener(event, listener);
  document.addEventListener("visibilitychange", listener);
  return () => {
    for (const event of events) window.removeEventListener(event, listener);
    document.removeEventListener("visibilitychange", listener);
  };
}

export async function setOrderNotifications(key, enabled) {
  if (enabled) {
    if (
      window.Notification.permission !== "granted" &&
      (await window.Notification.requestPermission()) !== "granted"
    ) {
      window.dispatchEvent(new Event(preferenceChanged));
      return false;
    }
    await registerOrderNotificationWorker();
  }
  try {
    if (enabled) window.localStorage.setItem(key, "on");
    else window.localStorage.removeItem(key);
  } catch {
    if (enabled) temporaryPreferences.set(key, true);
    else temporaryPreferences.delete(key);
  }
  window.dispatchEvent(new Event(preferenceChanged));
  return true;
}

export async function showOrderNotifications(key, company, orders) {
  if (orderNotificationStatus(key) !== "on") return;
  // An active registration is enough to display a notification, even before it controls this tab.
  const existing = await navigator.serviceWorker.getRegistration("/dashboard");
  const registration = existing?.active ? existing : await registerOrderNotificationWorker();
  for (const order of orders) {
    const tag = `pedss-order:${company.id}:${order.id}`;
    const show = async () => {
      if (orderNotificationStatus(key) !== "on") return;
      if ((await registration.getNotifications({ tag })).length) return;
      await registration.showNotification("Novo pedido na Peds's", {
        body: `${company.name} · Pedido ${order.number}`,
        icon: "/brand/peds-icon-180-v1.png",
        tag,
        data: { store: company.slug },
      });
    };
    // Serializes the active notification check across open dashboard tabs where supported.
    if (navigator.locks) await navigator.locks.request(tag, show);
    else await show();
  }
}
