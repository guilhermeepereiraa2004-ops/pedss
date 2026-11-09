import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  orderNotificationStatus,
  setOrderNotifications,
  showOrderNotifications,
  subscribeToOrderNotifications,
} from "../application/orderNotifications";
import useOrderPush from "./useOrderPush";

export default function useOrderAlerts({ company, orders, identity, canManage, notify, remote }) {
  const scope = company && identity ? JSON.stringify([identity.id, company.id]) : null;
  const key = scope && canManage ? `pedss:order-notifications:${scope}` : null;
  const getStatus = useCallback(() => orderNotificationStatus(key), [key]);
  const notificationStatus = useSyncExternalStore(subscribeToOrderNotifications, getStatus);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const push = useOrderPush({ scope, storeId: remote && key ? company.id : null, notify });
  const [sound, setSound] = useState(false);
  const audio = useRef(null);
  const previous = useRef(null);

  useEffect(() => {
    const snapshot = previous.current;
    if (!scope || snapshot?.scope !== scope) {
      previous.current = scope ? { scope, seen: new Set(orders.map((order) => order.id)) } : null;
      return;
    }

    const fresh = orders.filter(
      (order) => !snapshot.seen.has(order.id) && order.status === "Pendente" && !order.demo,
    );
    for (const order of orders) snapshot.seen.add(order.id);
    if (!fresh.length) return;

    const message =
      fresh.length === 1 ? "Novo pedido recebido." : `${fresh.length} novos pedidos recebidos.`;
    queueMicrotask(() => notify(message));
    if (!remote) void showOrderNotifications(key, company, fresh).catch(() => {});

    const context = audio.current;
    if (!sound || context?.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.4);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.4);
  }, [scope, key, company, orders, sound, notify, remote]);

  useEffect(
    () => () => {
      void audio.current?.close().catch(() => {});
      audio.current = null;
    },
    [],
  );

  const toggleSound = async () => {
    if (sound) {
      setSound(false);
      return;
    }
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audio.current ||= new Audio();
      await audio.current.resume();
      setSound(true);
    } catch {
      notify("Não foi possível ativar o som neste navegador.");
    }
  };

  const toggleNotifications = async () => {
    if (!key || notificationBusy || ["blocked", "unavailable"].includes(notificationStatus)) return;
    setNotificationBusy(true);
    try {
      const enabled = notificationStatus !== "on";
      if (!(await setOrderNotifications(key, enabled)))
        notify("Permita as notificações do site para receber avisos fora da aba.");
    } catch {
      notify("Não foi possível ativar as notificações neste navegador.");
    } finally {
      setNotificationBusy(false);
    }
  };

  return {
    sound,
    toggleSound,
    notificationStatus: remote ? push.status : notificationStatus,
    notificationBusy: remote ? push.busy : notificationBusy,
    toggleNotifications: remote ? push.toggle : toggleNotifications,
  };
}
