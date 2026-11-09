import { useEffect, useRef, useState } from "react";
import { prepareOrderPush, toggleOrderPush } from "../application/orderNotifications";

export default function useOrderPush({ storeId, scope, notify }) {
  const [device, setDevice] = useState(null);
  const [busy, setBusy] = useState(false);
  const change = useRef(0);
  const pending = useRef(null);

  useEffect(() => {
    if (!storeId) return;
    let active = true;
    const refresh = async () => {
      if (pending.current === scope) return;
      const version = ++change.current;
      try {
        const prepared = await prepareOrderPush(storeId);
        if (active && version === change.current) setDevice({ scope, ...prepared });
      } catch {
        if (active && version === change.current) setDevice({ scope, status: "error" });
      }
    };
    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      change.current++;
      window.removeEventListener("focus", refresh);
    };
  }, [scope, storeId]);

  const status = device?.scope === scope && device ? device.status : "loading";
  const toggle = async () => {
    if (pending.current || !["off", "on"].includes(status)) return;
    const version = ++change.current;
    pending.current = scope;
    setBusy(true);
    try {
      const updated = await toggleOrderPush(storeId, device);
      if (version === change.current) setDevice(updated);
    } catch (error) {
      if (version !== change.current) return;
      if (window.Notification.permission === "denied") {
        setDevice({ scope, status: "blocked" });
      } else {
        notify(
          error.name === "NotAllowedError"
            ? "Permita as notificações para receber novos pedidos."
            : "Não foi possível configurar as notificações push. Tente novamente.",
        );
      }
    } finally {
      pending.current = null;
      setBusy(false);
    }
  };

  return { status, busy, toggle };
}
