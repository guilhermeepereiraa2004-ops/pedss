import webPush from "web-push";
import { trialState } from "../src/core/trials.ts";

const fail = (message, status) => Object.assign(new Error(message), { status });

function pushEndpoint(value) {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.port || url.username || url.password || url.hash)
      return false;
    const host = url.hostname;
    return (
      (host === "fcm.googleapis.com" && url.pathname.startsWith("/fcm/send/")) ||
      (host === "updates.push.services.mozilla.com" && url.pathname.startsWith("/wpush/")) ||
      host.endsWith(".push.apple.com") ||
      host.endsWith(".notify.windows.com") ||
      host.endsWith(".wns.windows.com")
    );
  } catch {
    return false;
  }
}

function isKey(value, length) {
  return (
    typeof value === "string" &&
    value.length === Math.ceil((length * 8) / 6) &&
    /^[\w-]+$/.test(value) &&
    Buffer.from(value, "base64url").toString("base64url") === value
  );
}

function vapidFromEnv() {
  return {
    subject: process.env.PEDSS_PUSH_SUBJECT || "https://www.pedss.com.br",
    publicKey: process.env.PEDSS_PUSH_PUBLIC_KEY,
    privateKey: process.env.PEDSS_PUSH_PRIVATE_KEY,
  };
}

export function createOrderPush({
  getDatabase,
  send = webPush.sendNotification,
  config = vapidFromEnv,
}) {
  function vapid() {
    const details = config();
    return isKey(details?.publicKey, 65) && isKey(details?.privateKey, 32) ? details : null;
  }

  async function command(action, identity, [storeId, device, publicKey]) {
    if (!identity || identity.demo) throw fail("Entre na sua conta para continuar.", 401);
    if (
      typeof storeId !== "string" ||
      !storeId ||
      storeId.length > 120 ||
      !(identity.role === "admin" || (identity.role === "owner" && identity.storeId === storeId))
    )
      throw fail("Você não pode configurar avisos para esta loja.", 403);
    if (!["status", "subscribe", "unsubscribe"].includes(action))
      throw fail("Ação de notificações inválida.", 400);

    const keys = vapid();
    if (!keys && action === "status") return { publicKey: null, subscribed: false };
    if (action === "subscribe" && (!keys || publicKey !== keys.publicKey))
      throw fail("Configuração de notificações atualizada. Reabra o painel.", 409);

    const endpoint = action === "subscribe" ? device?.endpoint : device;
    if ((endpoint !== null || action !== "status") && !pushEndpoint(endpoint))
      throw fail("Serviço de notificações deste navegador não reconhecido.", 400);
    if (
      action === "subscribe" &&
      (!isKey(device.keys?.p256dh, 65) || !isKey(device.keys?.auth, 16))
    )
      throw fail("Cadastro de dispositivo inválido.", 400);

    const db = getDatabase();
    const { rows: companies } = await db.query(
      `SELECT c.value AS company FROM pedss.workspace w,
        jsonb_array_elements(w.data->'companies') c
        WHERE w.id = 1 AND c.value->>'id' = $1`,
      [storeId],
    );
    const company = companies[0]?.company;
    if (!company || company.archived || (identity.role !== "admin" && trialState(company)?.expired))
      throw fail("Loja indisponível para notificações.", 403);

    if (action === "subscribe") {
      await db.query(
        `INSERT INTO pedss.order_push_subscriptions (store_id, user_id, endpoint, p256dh, auth, vapid_key)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (store_id, endpoint) DO UPDATE SET
           user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
           vapid_key = excluded.vapid_key, updated_at = now()`,
        [storeId, identity.id, endpoint, device.keys.p256dh, device.keys.auth, keys.publicKey],
      );
      return { subscribed: true };
    }
    if (action === "unsubscribe") {
      await db.query(
        "DELETE FROM pedss.order_push_subscriptions WHERE store_id = $1 AND user_id = $2 AND endpoint = $3",
        [storeId, identity.id, endpoint],
      );
      return { subscribed: false };
    }
    const { rows } = endpoint
      ? await db.query(
          `SELECT 1 FROM pedss.order_push_subscriptions
           WHERE store_id = $1 AND user_id = $2 AND endpoint = $3 AND vapid_key = $4`,
          [storeId, identity.id, endpoint, keys.publicKey],
        )
      : { rows: [] };
    return { publicKey: keys.publicKey, subscribed: rows.length > 0 };
  }

  async function notify({ storeId, orderId, number }) {
    const keys = vapid();
    if (!keys) return;
    const db = getDatabase();
    const { rows } = await db.query(
      `SELECT s.endpoint, s.p256dh, s.auth, s.updated_at::text AS updated_at, c.value AS company
       FROM pedss.order_push_subscriptions s
       JOIN pedss.workspace w ON w.id = 1
       CROSS JOIN LATERAL jsonb_array_elements(w.data->'companies') c
       WHERE s.store_id = $1 AND s.vapid_key = $2 AND c.value->>'id' = s.store_id
         AND NOT coalesce((c.value->>'archived')::boolean, false)
         AND EXISTS (
           SELECT 1 FROM jsonb_array_elements(w.data->'users') u
           WHERE u.value->>'id' = s.user_id AND u.value->>'active' = 'true'
             AND (u.value->>'role' = 'admin'
               OR (u.value->>'role' = 'owner' AND u.value->>'storeId' = s.store_id))
         )`,
      [storeId, keys.publicKey],
    );
    await Promise.allSettled(
      rows.map(async ({ endpoint, p256dh, auth, updated_at, company }) => {
        if (!pushEndpoint(endpoint) || trialState(company)?.expired) return;
        const payload = JSON.stringify({
          kind: "pedss-order",
          store: company.slug,
          tag: `pedss-order:${storeId}:${orderId}`,
          body: `${company.name} · Pedido ${number}`,
        });
        try {
          await send({ endpoint, keys: { p256dh, auth } }, payload, {
            vapidDetails: keys,
            TTL: 300,
            timeout: 4500,
            urgency: "high",
          });
        } catch (error) {
          if ([404, 410].includes(error.statusCode)) {
            await db.query(
              `DELETE FROM pedss.order_push_subscriptions
             WHERE store_id = $1 AND endpoint = $2 AND updated_at = $3`,
              [storeId, endpoint, updated_at],
            );
          } else {
            console.warn(
              JSON.stringify({ event: "order_push_failed", status: error.statusCode || 0 }),
            );
          }
        }
      }),
    );
  }

  return { command, notify, enabled: () => !!vapid() };
}
