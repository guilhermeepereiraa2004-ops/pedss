import {
  companySchema,
  productSchema,
  orderSchema,
  settingsSchema,
  cartSchema,
  userSchema,
  sessionSchema,
  invitationSchema,
  resetSchema,
  couponSchema,
  expenseSchema,
  type Company,
  type Order,
  type Product,
  type Workspace,
  type Tenant,
} from "../core/model.ts";
import { defaultsSettings, emptyCart, emptyTenant, uuid, iso, digits } from "../core/domain.ts";
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export interface DemoSeed {
  companies: unknown[];
  products: unknown[];
  orders: unknown[];
}
const record = (v: unknown): Record<string, any> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, any>) : {};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
function parsed(storage: KeyValueStorage, key: string, fallback: unknown) {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return fallback;
  }
}
export function migrateProduct(value: unknown): Product | null {
  const p = record(value);
  if (!p.id || typeof p.name !== "string") return null;
  const priceCents = Number.isInteger(p.priceCents)
    ? p.priceCents
    : Math.round(Number(p.price) * 100);
  const result = productSchema.safeParse({
    ...p,
    id: String(p.id),
    priceCents,
    ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
    extras: list(p.extras),
    image: p.image || "",
    featured: !!p.featured,
    status: p.status || "Disponível",
  });
  return result.success ? result.data : null;
}
function migrateOrder(value: unknown, storeId: string): Order | null {
  const existing = orderSchema.safeParse(value);
  if (existing.success) return { ...existing.data, storeId };
  const old = record(value);
  if (!old.id || typeof old.customer !== "string" || !Number.isFinite(Number(old.total)))
    return null;
  const at = typeof old.date === "string" && !Number.isNaN(Date.parse(old.date)) ? old.date : iso();
  const result = orderSchema.safeParse({
    id: String(old.id),
    number: String(old.id),
    storeId,
    trackingToken: uuid() + uuid(),
    requestId: `legacy-${old.id}`,
    customer: { name: old.customer, phone: "" },
    fulfillment: old.mode === "pickup" ? "pickup" : "delivery",
    address: {
      street: String(old.address || ""),
      number: "",
      neighborhood: "",
      complement: "",
      reference: "",
    },
    deliveryArea: "",
    notes: "",
    paymentMethod: "Não informado (legado)",
    changeForCents: null,
    subtotalCents: Math.max(
      0,
      Math.round((Number(old.total) - Number(old.deliveryFee || 0)) * 100),
    ),
    deliveryFeeCents: Math.round(Number(old.deliveryFee || 0) * 100),
    totalCents: Math.round(Number(old.total) * 100),
    status: old.status || "Pendente",
    paymentStatus: "Pendente",
    lines: [],
    legacyItems: String(old.items || ""),
    createdAt: at,
    updatedAt: at,
    history: [
      {
        id: uuid(),
        at,
        actor: "Migração local",
        kind: "order",
        from: "",
        to: old.status || "Pendente",
        reason: "Histórico anterior preservado; pagamento não inferido.",
      },
    ],
    demo: !!old.demo,
  });
  return result.success ? result.data : null;
}
function migrateCompany(value: unknown): Company | null {
  const c = record(value);
  const result = companySchema.safeParse({
    ...c,
    id: String(c.id || ""),
    logo: c.logo || "",
    archived: !!c.archived,
    plan: ["Essencial", "Crescer", "Rede"].includes(c.plan) ? c.plan : "Essencial",
  });
  return result.success ? result.data : null;
}
export function migrateLegacy(storage: KeyValueStorage, seed: DemoSeed): Workspace {
  const saved = parsed(storage, "saas_companies", seed.companies);
  const companies = list(saved)
    .map(migrateCompany)
    .filter((c): c is Company => !!c);
  if (!companies.some((c) => c.slug === "demo")) {
    const demo = seed.companies.map(migrateCompany).find((c) => c?.slug === "demo");
    if (demo) companies.push(demo);
  }
  const tenants: Record<string, Tenant> = {};
  for (const company of companies) {
    const key = (type: string) =>
      company.slug === "demo" ? `company_${type}` : `brasa_${company.slug}_${type}`;
    const isDemo = seed.companies.some((v) => record(v).slug === company.slug);
    const oldSettings = record(parsed(storage, key("settings"), {}));
    if (typeof oldSettings.name === "string" && oldSettings.name.trim())
      company.name = oldSettings.name.trim();
    const initial = defaultsSettings(isDemo);
    const phone = digits(String(oldSettings.whatsapp || ""));
    const settings = settingsSchema.safeParse({
      ...initial,
      description: oldSettings.description || initial.description,
      deliveryTime: oldSettings.deliveryTime || initial.deliveryTime,
      whatsapp: /^55\d{10,11}$/.test(phone) ? phone : "",
      deliveryFeeCents: Number.isFinite(Number(oldSettings.deliveryFee))
        ? Math.round(Number(oldSettings.deliveryFee) * 100)
        : initial.deliveryFeeCents,
    });
    const tenant = emptyTenant(isDemo);
    tenant.settings = settings.success ? settings.data : initial;
    tenant.online = parsed(storage, key("status"), "online") !== "offline";
    tenant.products = list(parsed(storage, key("menu"), isDemo ? seed.products : []))
      .map(migrateProduct)
      .filter((p): p is Product => !!p);
    tenant.orders = list(parsed(storage, key("orders"), isDemo ? seed.orders : []))
      .map((v) => migrateOrder(v, company.id))
      .filter((o): o is Order => !!o);
    const oldCart = list(parsed(storage, key("cart"), []));
    tenant.cart = {
      requestId: uuid(),
      lines: oldCart.flatMap((v) => {
        const item = record(v);
        return tenant.products.some((p) => p.id === String(item.id)) &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          item.quantity <= 99
          ? [
              {
                key: uuid(),
                productId: String(item.id),
                quantity: item.quantity,
                extraIds: [],
                removedIngredients: [],
                notes: "",
              },
            ]
          : [];
      }),
    };
    tenants[company.id] = tenant;
  }
  const platform = record(parsed(storage, "brasa_platform", {}));
  return {
    version: 2,
    checkoutRequests: {},
    revision: 0,
    companies,
    tenants,
    users: [],
    sessions: [],
    invitations: [],
    resets: [],
    platform: {
      name:
        typeof platform.name === "string" && platform.name.trim() ? platform.name : "Central Brasa",
      supportEmail:
        typeof platform.supportEmail === "string" && /@/.test(platform.supportEmail)
          ? platform.supportEmail
          : "",
      description: String(platform.description || "Seu delivery, aceso."),
    },
  };
}
export function recoverWorkspace(value: unknown): Workspace {
  const old = record(value);
  const companies = list(old.companies)
    .map(migrateCompany)
    .filter((c): c is Company => !!c);
  const tenants: Record<string, Tenant> = {};
  for (const company of companies) {
    const source = record(record(old.tenants)[company.id]);
    const initial = emptyTenant();
    const settings = settingsSchema.safeParse(source.settings),
      cart = cartSchema.safeParse(source.cart);
    tenants[company.id] = {
      products: list(source.products)
        .map(migrateProduct)
        .filter((p): p is Product => !!p),
      orders: list(source.orders)
        .map((v) => migrateOrder(v, company.id))
        .filter((o): o is Order => !!o),
      settings: settings.success ? settings.data : initial.settings,
      cart: cart.success ? cart.data : emptyCart(),
      coupons: list(source.coupons).flatMap((v) => {
        const r = couponSchema.safeParse(v);
        return r.success ? [r.data] : [];
      }),
      expenses: list(source.expenses).flatMap((v) => {
        const r = expenseSchema.safeParse(v);
        return r.success ? [r.data] : [];
      }),
      online: source.online !== false,
    };
  }
  const validated = <T>(
    values: unknown,
    schema: { safeParse: (v: unknown) => { success: boolean; data?: T } },
  ): T[] =>
    list(values).flatMap((v) => {
      const result = schema.safeParse(v);
      return result.success ? [result.data as T] : [];
    });
  const p = record(old.platform);
  return {
    version: 2,
    checkoutRequests: Object.fromEntries(
      Object.entries(record(old.checkoutRequests)).filter(([, value]) => typeof value === "string"),
    ),
    revision: Number.isInteger(old.revision) ? old.revision : 0,
    companies,
    tenants,
    users: validated(old.users, userSchema),
    sessions: validated(old.sessions, sessionSchema),
    invitations: validated(old.invitations, invitationSchema),
    resets: validated(old.resets, resetSchema),
    platform: {
      name: String(p.name || "Central Brasa"),
      supportEmail:
        typeof p.supportEmail === "string" && /@/.test(p.supportEmail) ? p.supportEmail : "",
      description: String(p.description || ""),
    },
  };
}
