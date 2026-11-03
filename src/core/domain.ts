import type {
  Cart,
  CartLine,
  Checkout,
  Company,
  Identity,
  Order,
  OrderStatus,
  PaymentStatus,
  Permission,
  Product,
  Settings,
  Tenant,
} from "./model.ts";

import { DomainError } from "./errors.ts";
import { compactStoreSlug, RESERVED_STORE_ADDRESSES } from "./storeAddress.ts";
import { pizzaSnapshot } from "./pizzeriaOperations.ts";
import { applyCoupon } from "./coupons.ts";
import { trialState } from "./trials.ts";
import { pricePizza } from "./pizza.ts";
import {
  comboLines,
  recipeCost,
  validateSchedule,
  comboCustomizationCents,
  extraCostCents,
  pizzaUnitsForLines,
} from "./restaurant.ts";
import { replacesPizzaOption } from "./catalogRules.ts";
import { paidCents, dueCents, paymentLedger } from "./payments.ts";
import type { Restaurant } from "./restaurantModel.ts";
import { deliveryConfigured, deliveryFee, shippingMode, type ShippingQuote } from "./shipping.ts";
export { DomainError } from "./errors.ts";
export const digits = (value: string) => value.replace(/\D/g, "");
export const uuid = () => crypto.randomUUID();
export const iso = () => new Date().toISOString();
export function requireAvailableStoreSlug(companies: Company[], slug: string, exceptId?: string) {
  if (RESERVED_STORE_ADDRESSES.some((name) => compactStoreSlug(name) === compactStoreSlug(slug)))
    throw new DomainError("Esse endereço é reservado.");
  if (
    companies.some((c) => compactStoreSlug(c.slug) === compactStoreSlug(slug) && c.id !== exceptId)
  )
    throw new DomainError(
      "Esse endereço já foi utilizado. Escolha outro para preservar o histórico.",
    );
}
export function requirePermission(
  identity: Identity | null,
  permission: Permission,
  storeId?: string,
) {
  if (!identity) throw new DomainError("Entre na sua conta para continuar.");
  if (identity.role === "admin") return;
  if (permission === "platform" || !storeId || identity.storeId !== storeId)
    throw new DomainError("Você não tem acesso a este estabelecimento.");
  if (identity.role === "owner") return;
  if (!["view", "orders"].includes(permission))
    throw new DomainError("Seu perfil não permite esta ação.");
}
export const DEFAULT_STORE_DESCRIPTION = "Feito na brasa. Entregue com alma.";
export function defaultsSettings(demo = false): Settings {
  return {
    description: DEFAULT_STORE_DESCRIPTION,
    whatsapp: "",
    deliveryFeeCents: 500,
    deliveryTime: "35–50 min",
    address: demo ? "Balcão da loja — endereço de demonstração" : "",
    deliveryEnabled: true,
    pickupEnabled: demo,
    scheduleEnabled: false,
    timezone: "America/Bahia",
    hours: Array.from({ length: 7 }, (_, day) => ({
      day,
      enabled: true,
      open: "18:00",
      close: "23:00",
    })),
    areas: demo
      ? [
          { id: "centro", name: "Centro", feeCents: 500 },
          { id: "proximo", name: "Bairros próximos", feeCents: 800 },
        ]
      : [],
    paymentMethods: ["Dinheiro", "Pix", "Cartão na entrega"],
    banner: "",
    heroBackground: "white",
    heroSegment: "burger",
  };
}
export function emptyCart(): Cart {
  return { requestId: uuid(), lines: [] };
}
export function emptyTenant(demo = false): Tenant {
  return {
    products: [],
    orders: [],
    settings: defaultsSettings(demo),
    online: true,
    cart: emptyCart(),
    coupons: [],
    expenses: [],
  };
}
export function openState(
  company: Company,
  tenant: Tenant,
  now = new Date(),
): { open: boolean; reason: string; canSchedule?: boolean } {
  if (trialState(company, now)?.expired)
    return { open: false, reason: "A loja está temporariamente indisponível para novos pedidos." };
  if (company.archived || company.status === "Pausado")
    return { open: false, reason: "Estabelecimento pausado pela central." };
  if (!tenant.online) return { open: false, reason: "A loja está fechada para novos pedidos." };
  const s = tenant.settings;
  if (!s.pickupEnabled && !deliveryConfigured(s))
    return { open: false, reason: "A loja está preparando as opções de entrega e retirada." };
  if (!s.scheduleEnabled) return { open: true, reason: "Aberto para pedidos" };
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: s.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const minute = Number(get("hour")) * 60 + Number(get("minute"));
  const minutes = (v: string) => {
    const [h, m] = v.split(":").map(Number);
    return h * 60 + m;
  };
  const today = s.hours.find((h) => h.day === day),
    yesterday = s.hours.find((h) => h.day === (day + 6) % 7);
  const active =
    !!(
      today?.enabled &&
      (minutes(today.open) < minutes(today.close)
        ? minute >= minutes(today.open) && minute < minutes(today.close)
        : minute >= minutes(today.open))
    ) ||
    !!(
      yesterday?.enabled &&
      minutes(yesterday.open) >= minutes(yesterday.close) &&
      minute < minutes(yesterday.close)
    );
  return {
    open: active,
    canSchedule: !active && !!tenant.restaurant?.scheduling.enabled,
    reason: active ? "Aberto para pedidos" : "Fora do horário de funcionamento.",
  };
}
export function priceLine(
  line: CartLine,
  products: Product[],
  inventory?: Restaurant["inventory"],
): Order["lines"][number] {
  const p = products.find((p) => p.id === line.productId && p.status === "Disponível");
  if (!p)
    throw new DomainError("Um produto da sacola ficou indisponível. Remova-o para continuar.");
  if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99)
    throw new DomainError("Quantidade deve ficar entre 1 e 99.");
  const ids = [...new Set(line.extraIds)];
  const extras = ids.map((id) => {
    const extra = p.extras.find((e) => e.id === id && e.available);
    if (!extra) throw new DomainError(`Um adicional de ${p.name} não está mais disponível.`);
    if (replacesPizzaOption(p, extra))
      throw new DomainError(
        "Este adicional antigo foi substituído pelas escolhas de tamanho e borda. Revise a pizza.",
      );
    return { id: extra.id, name: extra.name, priceCents: extra.priceCents };
  });
  if (line.removedIngredients.some((i) => !p.ingredients.includes(i)))
    throw new DomainError(`Revise as opções de ${p.name}.`);
  if (line.pizza && (!p.pizza || p.category !== "Pizza"))
    throw new DomainError("Este produto não aceita montagem de pizza.");
  const pizza = p.pizza ? pricePizza(p.pizza, line.pizza) : null;
  if (p.combo && (p.pizza || line.extraIds.length || line.removedIngredients.length))
    throw new DomainError("Revise as opções do combo.");
  const children = comboLines(line, products);
  const comboPriced = children.map((c) => priceLine(c, products, inventory));
  if (
    comboPriced.map((c) => `${c.quantity} × ${c.name}${c.pizzaSummary || ""}`).join("; ").length >
    980
  )
    throw new DomainError("Reduza os grupos do combo para manter a descrição completa do pedido.");
  const comboSurcharge =
    p.combo?.groups.reduce(
      (sum, g) =>
        sum +
        (g.options.find(
          (o) => o.productId === line.comboChoices?.find((c) => c.groupId === g.id)?.productId,
        )?.surchargeCents || 0),
      0,
    ) || 0;
  const unitPriceCents =
    (pizza?.priceCents ?? p.priceCents) +
    comboSurcharge +
    comboCustomizationCents(line, products) +
    extras.reduce((sum, e) => sum + e.priceCents, 0);
  if (
    !Number.isSafeInteger(unitPriceCents) ||
    unitPriceCents > 100_000_000 ||
    unitPriceCents * line.quantity > 100_000_000
  )
    throw new DomainError("O valor do item ultrapassa o limite permitido.");
  const chosenExtras = ids.map((id) => p.extras.find((e) => e.id === id)!);
  const extraCosts = chosenExtras.map((e) => extraCostCents(e, inventory));
  const recipeValue = recipeCost(line, products, inventory);
  const unitCostCents =
    recipeValue != null && extraCosts.every((c) => c != null)
      ? recipeValue + extraCosts.reduce<number>((s, c) => s + (c || 0), 0)
      : !pizza && p.costCents != null && extraCosts.every((c) => c != null)
        ? p.costCents + extraCosts.reduce<number>((sum, c) => sum + (c || 0), 0)
        : null;
  return {
    productId: p.id,
    ...(p.category === "Pizza" || comboPriced.length
      ? {
          pizzaDetails: comboPriced.length
            ? comboPriced.flatMap((c) =>
                (c.pizzaDetails || []).map((d) => ({
                  ...d,
                  quantity: d.quantity * line.quantity,
                })),
              )
            : pizzaSnapshot(p, line),
        }
      : {}),
    pizzaUnits: pizzaUnitsForLines([line], products),
    selection: structuredClone(line),
    ...(pizza
      ? { pizzaSummary: pizza.summary }
      : comboPriced.length
        ? {
            pizzaSummary: comboPriced
              .map((c) => `${c.quantity} × ${c.name}${c.pizzaSummary ? ": " + c.pizzaSummary : ""}`)
              .join("; "),
          }
        : {}),
    name: p.name,
    quantity: line.quantity,
    unitPriceCents,
    unitCostCents,
    extras,
    removedIngredients: [...new Set(line.removedIngredients)],
    notes: line.notes,
    totalCents: unitPriceCents * line.quantity,
  };
}
export function quote(cart: Cart, products: Product[], inventory?: Restaurant["inventory"]) {
  if (new Set(cart.lines.map((l) => l.key)).size !== cart.lines.length)
    throw new DomainError("Os itens do pedido precisam ter identificadores diferentes.");
  const lines = cart.lines.map((line) => priceLine(line, products, inventory));
  return { lines, subtotalCents: lines.reduce((sum, l) => sum + l.totalCents, 0) };
}
export function makeOrder(
  company: Company,
  tenant: Tenant,
  input: Checkout,
  now = new Date(),
  shippingQuote?: ShippingQuote,
): Order {
  const state = openState(company, tenant, now);
  validateSchedule(tenant, input.scheduledAt, now, tenant.cart.lines);
  if (
    !state.open &&
    !(
      input.scheduledAt &&
      tenant.online &&
      company.status !== "Pausado" &&
      !company.archived &&
      !trialState(company, now)?.expired
    )
  )
    throw new DomainError(state.reason);
  if (!tenant.cart.lines.length) throw new DomainError("Adicione um produto à sacola.");
  const s = tenant.settings;
  if (!s.paymentMethods.includes(input.paymentMethod as Settings["paymentMethods"][number]))
    throw new DomainError("Selecione uma forma de pagamento aceita pela loja.");
  if (input.fulfillment === "pickup" && (!s.pickupEnabled || !s.address.trim()))
    throw new DomainError("Retirada não disponível nesta loja.");
  if (input.fulfillment === "delivery" && !s.deliveryEnabled)
    throw new DomainError("Entrega indisponível.");
  const area =
    input.fulfillment === "delivery" && shippingMode(s) === "areas"
      ? s.areas.find((a) => a.id === input.areaId)
      : null;
  if (
    input.fulfillment === "delivery" &&
    (!input.street.trim() || !input.number.trim() || !input.neighborhood.trim())
  )
    throw new DomainError("Informe o endereço completo da entrega.");
  const q = quote(tenant.cart, tenant.products, tenant.restaurant?.inventory),
    fee =
      input.fulfillment === "delivery"
        ? deliveryFee(s, input.areaId, input.postalCode, shippingQuote, now)
        : 0,
    coupon = applyCoupon(tenant, input.couponCode, q.subtotalCents, input.phone, now),
    total = q.subtotalCents - (coupon?.discountCents || 0) + fee;
  if (total !== input.expectedTotalCents)
    throw new DomainError(
      "Os valores do pedido mudaram. Confira o novo total e confirme novamente.",
    );
  if (
    input.paymentMethod === "Dinheiro" &&
    input.changeForCents !== null &&
    input.changeForCents < total
  )
    throw new DomainError("O valor para troco deve cobrir o total do pedido.");
  const at = now.toISOString(),
    id = uuid();
  return {
    id,
    number: `#${id.slice(0, 8).toUpperCase()}`,
    storeId: company.id,
    trackingToken: uuid() + uuid(),
    requestId: tenant.cart.requestId,
    channel: "site",
    pizzaUnits: pizzaUnitsForLines(tenant.cart.lines, tenant.products),
    ...(input.scheduledAt ? { scheduledAt: new Date(input.scheduledAt).toISOString() } : {}),
    customer: { name: input.name, phone: input.phone },
    fulfillment: input.fulfillment,
    address:
      input.fulfillment === "delivery"
        ? {
            postalCode: input.postalCode,
            street: input.street,
            number: input.number,
            neighborhood: input.neighborhood,
            complement: input.complement,
            reference: input.reference,
          }
        : {
            postalCode: "",
            street: s.address,
            number: "",
            neighborhood: "",
            complement: "",
            reference: "",
          },
    deliveryArea: area?.name || "",
    notes: input.notes,
    paymentMethod: input.paymentMethod,
    changeForCents: input.paymentMethod === "Dinheiro" ? input.changeForCents : null,
    subtotalCents: q.subtotalCents,
    deliveryFeeCents: fee,
    ...(input.fulfillment === "delivery" && shippingQuote
      ? { deliveryDistanceMeters: shippingQuote.distanceMeters }
      : {}),
    coupon,
    totalCents: total,
    status: "Pendente",
    paymentStatus: "Pendente",
    lines: q.lines,
    legacyItems: "",
    createdAt: at,
    updatedAt: at,
    history: [
      {
        id: uuid(),
        at,
        actor: "Cliente",
        kind: "order",
        from: "",
        to: "Pendente",
        reason: "Pedido recebido",
      },
    ],
    demo: false,
  };
}
export function nextStatuses(order: Order): OrderStatus[] {
  const next: Partial<Record<OrderStatus, OrderStatus[]>> = {
    Pendente: ["Aceito", "Cancelado"],
    Aceito: ["Preparando", "Cancelado"],
    Preparando: ["Entregue", "Cancelado"],
    "A caminho": ["Entregue", "Cancelado"],
    "Pronto para retirada": ["Entregue", "Cancelado"],
  };
  return next[order.status] || [];
}
export function transition(order: Order, next: OrderStatus, actor: string, reason = ""): Order {
  // Older clients may finish their existing delivery/pickup step; new UI uses one completion.
  const legacyStep =
    order.status === "Preparando" &&
    next === (order.fulfillment === "pickup" ? "Pronto para retirada" : "A caminho");
  if (!nextStatuses(order).includes(next) && !legacyStep)
    throw new DomainError("Essa mudança de status não é permitida.");
  if (next === "Cancelado" && reason.trim().length < 3)
    throw new DomainError("Informe o motivo do cancelamento.");
  const at = new Date(Math.max(Date.now(), Date.parse(order.updatedAt) + 1)).toISOString();
  return {
    ...order,
    status: next,
    updatedAt: at,
    history: [
      ...order.history,
      { id: uuid(), at, actor, kind: "order", from: order.status, to: next, reason: reason.trim() },
    ],
  };
}
export function recordPayment(
  order: Order,
  next: PaymentStatus,
  actor: string,
  reason = "",
): Order {
  if (next === "Pendente" || order.paymentStatus === next)
    throw new DomainError("Mudança de pagamento inválida.");
  if (next === "Pago" && (order.paymentStatus !== "Pendente" || order.status === "Cancelado"))
    throw new DomainError("Não é possível registrar esse recebimento.");
  if (
    next === "Estornado" &&
    (order.paymentStatus !== "Pago" || order.status !== "Cancelado" || reason.trim().length < 3)
  )
    throw new DomainError("Cancele o pedido e informe o motivo antes de registrar o estorno.");
  const at = new Date(Math.max(Date.now(), Date.parse(order.updatedAt) + 1)).toISOString();
  return {
    ...order,
    paymentStatus: next,
    updatedAt: at,
    history: [
      ...order.history,
      {
        id: uuid(),
        at,
        actor,
        kind: "payment",
        from: order.paymentStatus,
        to: next,
        reason: reason.trim(),
      },
    ],
  };
}
export function finance(orders: Order[]) {
  return {
    receivedCents: orders.reduce((s, o) => s + paidCents(o), 0),
    deliveredCents: orders
      .filter((o) => o.status === "Entregue")
      .reduce((s, o) => s + o.totalCents, 0),
    pendingCents: orders
      .filter((o) => o.paymentStatus === "Pendente" && o.status !== "Cancelado")
      .reduce((s, o) => s + dueCents(o), 0),
    refundedCents: orders.reduce(
      (s, o) =>
        s +
        (o.payments
          ? paymentLedger(o)
              .filter((p) => p.kind === "refund")
              .reduce((a, p) => a + p.amountCents, 0)
          : o.paymentStatus === "Estornado"
            ? o.totalCents
            : 0),
      0,
    ),
  };
}
