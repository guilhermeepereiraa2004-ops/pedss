import { z } from "zod";
import {
  comboSchema,
  comboChoiceSchema,
  recipeSchema,
  restaurantSchema,
  pizzaChoiceSchema,
  paymentEntrySchema,
  pizzaSaleSchema,
} from "./restaurantModel.ts";

const id = z.string().min(1).max(120);
const text = z.string().trim();
export const cents = z.number().int().min(0).max(100_000_000);
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    "Data inválida.",
  );
export const couponSchema = z
  .object({
    id,
    code: text
      .toUpperCase()
      .regex(/^[A-Z0-9][A-Z0-9-]{2,23}$/, "Use de 3 a 24 letras, números ou hífens."),
    description: text.max(120).default(""),
    kind: z.enum(["percent", "fixed"]),
    value: z.number().int().min(1).max(100_000_000),
    minSubtotalCents: cents.default(0),
    validFrom: dateOnly,
    validUntil: dateOnly,
    usageLimit: z.number().int().min(1).max(1_000_000).nullable(),
    perCustomerLimit: z.number().int().min(1).max(1_000_000).nullable(),
    active: z.boolean(),
    advertised: z.boolean().default(false),
  })
  .refine((c) => c.kind !== "percent" || c.value <= 100, "O percentual deve ficar entre 1 e 100.")
  .refine((c) => c.validUntil >= c.validFrom, "A validade deve terminar após o início.");
export const couponSnapshotSchema = z.object({
  id,
  code: text,
  kind: z.enum(["percent", "fixed"]),
  value: z.number().int(),
  discountCents: cents,
  minSubtotalCents: cents.optional(),
});
export const expenseSchema = z.object({
  id,
  description: text.min(2).max(120),
  category: z.enum([
    "Ingredientes",
    "Equipe",
    "Aluguel",
    "Energia e água",
    "Marketing",
    "Taxas",
    "Outros",
  ]),
  amountCents: cents.refine((v) => v > 0, "Informe um valor maior que zero."),
  paidOn: dateOnly,
  notes: text.max(500).default(""),
  voided: z.boolean().default(false),
  createdAt: z.string(),
});
export const safeImage = z.union([
  z.literal(""),
  z
    .string()
    .max(2_500_000)
    .refine(
      (value) =>
        /^https?:\/\//i.test(value) ||
        /^\/[^/]/.test(value) ||
        /^data:image\/(png|jpeg|webp);base64,/i.test(value),
      "Use uma imagem HTTP, HTTPS ou um arquivo de imagem.",
    ),
]);
export const roleSchema = z.enum(["admin", "owner", "attendant"]);
export const storeSegmentSchema = z.enum([
  "burger",
  "pizza",
  "acai",
  "icecream",
  "snacks",
  "pastel",
]);
export const companySchema = z.object({
  id,
  name: text.min(2).max(80),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(60),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  logo: safeImage.default(""),
  adminEmail: z.email(),
  status: z.enum(["Ativo", "Pausado"]),
  plan: z.enum(["Essencial", "Crescer", "Rede"]).default("Essencial"),
  trial: z
    .object({
      startedAt: z.iso.datetime(),
      endsAt: z.iso.datetime(),
      convertedAt: z.iso.datetime().optional(),
    })
    .optional(),
  createdAt: z.string(),
  archived: z.boolean().default(false),
});
export const trialRegistrationSchema = z
  .object({
    name: text.min(2, "Informe seu nome.").max(80),
    email: z
      .email("Informe um e-mail válido.")
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z
      .string()
      .min(10, "Use ao menos 10 caracteres.")
      .max(128)
      .refine((v) => /[a-z]/i.test(v) && /\d/.test(v), "Use letras e números na senha."),
    storeName: text.min(2, "Informe o nome da loja.").max(80),
    slug: z
      .string()
      .min(2, "Informe o endereço da loja.")
      .max(60)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens no endereço."),
    heroSegment: storeSegmentSchema,
    primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Escolha uma cor válida."),
  })
  .strict();
export const extraSchema = z.object({
  id,
  name: text.min(1).max(60),
  priceCents: cents,
  available: z.boolean().default(true),
  costCents: cents.nullable().default(null),
  recipe: recipeSchema.optional(),
  replacedByPizzaOption: z.boolean().optional(),
});
const pizzaOptionSchema = z.object({
  id,
  name: text.min(1).max(60),
  priceCents: cents,
  available: z.boolean(),
  allowedSizeIds: z.array(id).max(12).optional(),
  allowedFlavorKinds: z
    .array(z.enum(["savory", "sweet"]))
    .max(2)
    .optional(),
  recipe: recipeSchema.optional(),
});
export const pizzaConfigSchema = z
  .object({
    pricing: z.enum(["highest", "average", "fixed", "sum"]),
    menuPlacement: z.enum(["catalog", "builder"]).optional(),
    allowMixedKinds: z.boolean().optional(),
    allowUnequalParts: z.boolean().optional(),
    sizes: z
      .array(
        z.object({
          id,
          name: text.min(1).max(60),
          diameterCm: z.number().int().min(1).max(200),
          ovenMinutes: z.number().int().min(1).max(120).optional(),
          ovenUnits: z.number().min(0.25).max(20).optional(),
          slices: z.number().int().min(1).max(64),
          maxFlavors: z.number().int().min(1).max(4),
          available: z.boolean(),
          fixedPriceCents: cents.optional(),
          flavorCountPricing: z
            .object({
              mode: z.enum(["fixed", "extra"]),
              prices: z.record(z.string().regex(/^[1-4]$/), cents),
            })
            .optional(),
        }),
      )
      .min(1)
      .max(12),
    flavors: z
      .array(
        z.object({
          id,
          name: text.min(1).max(80),
          available: z.boolean(),
          prices: z.record(z.string(), cents),
          appearance: z
            .enum(["auto", "cheese", "calabresa", "chicken", "vegetable", "chocolate", "banana"])
            .optional(),
          previewImage: safeImage.optional(),
          sourceProductId: id.optional(),
          kind: z.enum(["savory", "sweet"]).optional(),
          ingredients: z.array(text.min(1).max(60)).max(30).optional(),
          allergens: z.array(text.min(1).max(60)).max(30).optional(),
          recipeBySize: z.record(z.string(), recipeSchema).optional(),
          extras: z
            .array(
              z.object({
                id,
                name: text.min(1).max(60),
                priceCents: cents,
                available: z.boolean(),
                recipe: recipeSchema.optional(),
              }),
            )
            .max(30)
            .optional(),
        }),
      )
      .min(1)
      .max(80),
    doughs: z.array(pizzaOptionSchema).min(1).max(20),
    edges: z.array(pizzaOptionSchema).min(1).max(20),
  })
  .superRefine((config, ctx) => {
    config.sizes.forEach((size, index) => {
      if (
        config.pricing === "fixed" &&
        size.available &&
        !(size.fixedPriceCents && size.fixedPriceCents > 0)
      )
        ctx.addIssue({
          code: "custom",
          message: `Informe um preço fixo maior que zero para ${size.name}.`,
          path: ["sizes", index, "fixedPriceCents"],
        });
      for (const [count, value] of Object.entries(size.flavorCountPricing?.prices || {})) {
        if (
          Number(count) > size.maxFlavors ||
          (size.flavorCountPricing?.mode === "fixed" && value === 0)
        )
          ctx.addIssue({
            code: "custom",
            message: `Revise o preço de ${count} sabores em ${size.name}: respeite o limite de sabores e informe um preço fixo maior que zero.`,
            path: ["sizes", index, "flavorCountPricing"],
          });
      }
    });
    for (const key of ["sizes", "flavors", "doughs", "edges"] as const) {
      if (new Set(config[key].map((v) => v.id)).size !== config[key].length)
        ctx.addIssue({
          code: "custom",
          message: "Opções de pizza com IDs repetidos.",
          path: [key],
        });
      if (!config[key].some((v) => v.available))
        ctx.addIssue({
          code: "custom",
          message: "Mantenha ao menos uma opção disponível em cada grupo.",
          path: [key],
        });
    }
    for (const size of config.sizes.filter((v) => v.available)) {
      if (
        !config.flavors.some(
          (f) =>
            f.available &&
            (config.pricing === "fixed" ? f.prices[size.id] !== 0 : (f.prices[size.id] || 0) > 0),
        )
      )
        ctx.addIssue({
          code: "custom",
          message:
            config.pricing === "fixed"
              ? `Habilite um sabor para ${size.name}.`
              : `Cadastre um sabor com preço para ${size.name}.`,
          path: ["flavors"],
        });
    }
  });
export const pizzaSelectionSchema = pizzaChoiceSchema;
export const productSchema = z.object({
  id,
  sku: text
    .toUpperCase()
    .max(60)
    .refine(
      (value) => !value || /^[A-Z0-9][A-Z0-9._-]*$/.test(value),
      "Use letras, números, ponto, hífen ou sublinhado no código.",
    )
    .default(""),
  name: text.min(1).max(80),
  priceCents: cents.refine((n) => n > 0, "Preço deve ser maior que zero."),
  costCents: cents.nullable().default(null),
  category: z.enum([
    "Hamburguer",
    "Porção",
    "Bebida",
    "Sobremesa",
    "Pizza",
    "Açaí",
    "Sorvete",
    "Salgado",
    "Pastel",
  ]),
  description: text.max(500).default(""),
  image: safeImage.default(""),
  cutoutImage: safeImage.default(""),
  model3dUrl: z
    .string()
    .max(2048)
    .refine(
      (value) => !value || /^(https:\/\/|\/[^/])[^\s]*\.glb(?:[?#][^\s]*)?$/i.test(value),
      "Use uma URL HTTPS ou caminho local de um modelo GLB.",
    )
    .default(""),
  status: z.enum(["Disponível", "Indisponível"]),
  featured: z.boolean().default(false),
  ingredients: z.array(text.min(1).max(60)).max(30).default([]),
  extras: z.array(extraSchema).max(30).default([]),
  pizza: pizzaConfigSchema.optional(),
  allergens: z.array(text.min(1).max(60)).max(30).optional(),
  recipe: recipeSchema.optional(),
  combo: comboSchema.optional(),
});
export const hourSchema = z.object({
  day: z.number().int().min(0).max(6),
  enabled: z.boolean(),
  open: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .refine(validTime),
  close: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .refine(validTime),
});
function validTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h < 24 && m < 60;
}
export const shippingSchema = z
  .object({
    mode: z.enum(["areas", "fixed", "distance"]),
    originPostalCode: z.string().regex(/^(?:\d{8})?$/, "Informe o CEP de origem com 8 dígitos."),
    fixedFeeCents: cents,
    perKmCents: cents,
    baseFeeCents: cents,
    minimumFeeCents: cents,
    maxDistanceKm: z.number().min(0.1).max(300),
  })
  .refine(
    (s) => s.mode !== "distance" || (s.originPostalCode.length === 8 && s.perKmCents > 0),
    "Informe CEP de origem e valor por km.",
  );
export const settingsSchema = z.object({
  description: text.max(180),
  whatsapp: z
    .string()
    .refine(
      (value) => !value || /^55\d{10,11}$/.test(value),
      "WhatsApp deve conter 55, DDD e número.",
    ),
  deliveryFeeCents: cents,
  deliveryTime: text.min(1).max(50),
  address: text.max(200),
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  scheduleEnabled: z.boolean(),
  timezone: z.literal("America/Bahia"),
  hours: z
    .array(hourSchema)
    .length(7)
    .refine(
      (hours) => new Set(hours.map((hour) => hour.day)).size === 7,
      "Informe cada dia da semana uma única vez.",
    ),
  areas: z.array(z.object({ id, name: text.min(1).max(60), feeCents: cents })).max(100),
  paymentMethods: z.array(z.enum(["Dinheiro", "Pix", "Cartão na entrega"])).min(1),
  banner: safeImage.default(""),
  heroBackground: z.enum(["white", "brand"]).default("white"),
  heroSegment: storeSegmentSchema.default("burger"),
  shipping: shippingSchema.optional(),
});
export const cartLineSchema = z.object({
  key: id,
  productId: id,
  quantity: z.number().int().min(1).max(99),
  extraIds: z.array(id).max(30),
  removedIngredients: z.array(text).max(30),
  notes: text.max(250),
  pizza: pizzaSelectionSchema.optional(),
  comboChoices: z.array(comboChoiceSchema).max(10).optional(),
});
export const cartSchema = z.object({ requestId: id, lines: z.array(cartLineSchema).max(100) });
export const orderStatusSchema = z.enum([
  "Pendente",
  "Aceito",
  "Preparando",
  "A caminho",
  "Pronto para retirada",
  "Entregue",
  "Cancelado",
]);
export const paymentStatusSchema = z.enum(["Pendente", "Pago", "Estornado"]);
export const orderLineSchema = z.object({
  pizzaDetails: z.array(pizzaSaleSchema).max(100).optional(),
  productId: id,
  stockUsage: recipeSchema.optional(),
  pizzaUnits: z.number().int().min(0).max(100000).optional(),
  selection: cartLineSchema.optional(),
  pizzaSummary: text.max(1000).optional(),
  name: text.min(1),
  quantity: z.number().int().min(1).max(99),
  unitPriceCents: cents,
  unitCostCents: cents.nullable().default(null),
  extras: z.array(z.object({ id, name: text, priceCents: cents })),
  removedIngredients: z.array(text),
  notes: text.max(250),
  totalCents: cents,
});
export const orderItemChangeSchema = z.object({
  id,
  requestId: id,
  at: text,
  actor: text,
  reason: text.min(3).max(200),
  kind: z.enum(["edit", "cancel"]),
  lineIndex: z.number().int().min(0),
  before: orderLineSchema,
  after: orderLineSchema.nullable(),
  beforeTotalCents: cents,
  afterTotalCents: cents,
  beforeDiscountCents: cents,
  afterDiscountCents: cents,
  stockDisposition: z.enum(["return", "waste"]),
  removedStock: recipeSchema,
  addedStock: recipeSchema,
  wasteCostCents: cents.nullable(),
});
export const historySchema = z.object({
  cashSessionId: id.optional(),
  id,
  at: z.string(),
  actor: text,
  kind: z.enum(["order", "payment", "amendment", "production"]),
  from: text,
  to: text,
  reason: text,
});
export const orderSchema = z.object({
  production: z
    .array(
      z.object({
        key: z.string().min(1).max(600),
        stage: z.enum(["preparing", "baking", "ready"]),
        at: z.string(),
        actor: z.string().optional(),
        requestId: id,
      }),
    )
    .max(900)
    .optional(),
  amendments: z.array(orderItemChangeSchema).max(500).optional(),
  payments: z.array(paymentEntrySchema).optional(),
  pizzaUnits: z.number().int().min(0).max(100000).optional(),
  id,
  number: text,
  storeId: id,
  channel: z.enum(["site", "counter", "phone", "table"]).optional(),
  tabId: id.optional(),
  tableName: text.max(40).optional(),
  scheduledAt: z.string().optional(),
  stockUsage: recipeSchema.optional(),
  trackingToken: id,
  requestId: id,
  customer: z.object({ name: text.min(2).max(70), phone: z.string() }),
  fulfillment: z.enum(["delivery", "pickup"]),
  address: z.object({
    postalCode: z.string().optional(),
    street: text,
    number: text,
    neighborhood: text,
    complement: text,
    reference: text,
  }),
  deliveryArea: text,
  notes: text.max(500),
  paymentMethod: text,
  changeForCents: cents.nullable(),
  subtotalCents: cents,
  deliveryFeeCents: cents,
  deliveryDistanceMeters: z.number().int().min(0).optional(),
  coupon: couponSnapshotSchema.nullable().default(null),
  totalCents: cents,
  status: orderStatusSchema,
  paymentStatus: paymentStatusSchema,
  lines: z.array(orderLineSchema),
  legacyItems: text.default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
  history: z.array(historySchema),
  demo: z.boolean().default(false),
});
export const tenantSchema = z.object({
  products: z.array(productSchema),
  orders: z.array(orderSchema),
  settings: settingsSchema,
  online: z.boolean(),
  cart: cartSchema,
  coupons: z.array(couponSchema).default([]),
  expenses: z.array(expenseSchema).default([]),
  restaurant: restaurantSchema.optional(),
});
export const userSchema = z.object({
  id,
  name: text.min(2).max(80),
  email: z.email(),
  role: roleSchema,
  storeId: id.nullable(),
  active: z.boolean(),
  passwordHash: z.string(),
  salt: z.string(),
  createdAt: z.string(),
});
export const invitationSchema = z.object({
  id,
  tokenHash: z.string(),
  email: z.email(),
  name: text,
  role: roleSchema,
  storeId: id.nullable(),
  expiresAt: z.string(),
  used: z.boolean(),
});
export const sessionSchema = z.object({
  tokenHash: z.string(),
  userId: id,
  expiresAt: z.string(),
  demo: z.boolean().default(false),
});
export const resetSchema = z.object({
  id,
  userId: id,
  tokenHash: z.string(),
  expiresAt: z.string(),
  used: z.boolean(),
});
export const workspaceSchema = z.object({
  version: z.literal(2),
  revision: z.number().int(),
  companies: z.array(companySchema),
  tenants: z.record(z.string(), tenantSchema),
  users: z.array(userSchema),
  invitations: z.array(invitationSchema),
  sessions: z.array(sessionSchema),
  resets: z.array(resetSchema),
  checkoutRequests: z.record(z.string(), z.string()).default({}),
  platform: z.object({
    name: text.min(1).max(60),
    supportEmail: z.union([z.literal(""), z.email()]),
    description: text.max(180),
  }),
});
export const checkoutSchema = z.object({
  scheduledAt: z.string().max(40).optional(),
  name: text.min(2, "Informe seu nome.").max(70),
  phone: z.string().refine((v) => /^\d{10,11}$/.test(v), "Informe telefone com DDD."),
  fulfillment: z.enum(["delivery", "pickup"]),
  street: text.max(120),
  number: text.max(20),
  neighborhood: text.max(60),
  complement: text.max(100),
  reference: text.max(120),
  areaId: text,
  paymentMethod: text,
  changeForCents: cents.nullable(),
  notes: text.max(500),
  expectedTotalCents: cents,
  couponCode: text.toUpperCase().max(24).default(""),
  postalCode: z
    .string()
    .regex(/^(?:\d{8})?$/, "Informe um CEP válido.")
    .default(""),
  shippingQuoteToken: z.string().max(4000).default(""),
});
export type Company = z.infer<typeof companySchema>;
export type Coupon = z.infer<typeof couponSchema>;
export type Expense = z.infer<typeof expenseSchema>;
export type Product = z.infer<typeof productSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type CartLine = z.infer<typeof cartLineSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type Tenant = z.infer<typeof tenantSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type User = z.infer<typeof userSchema>;
export type Role = z.infer<typeof roleSchema>;
export type Checkout = z.infer<typeof checkoutSchema>;
export type Identity = Pick<User, "id" | "name" | "email" | "role" | "storeId"> & { demo: boolean };
export type Permission =
  "platform" | "catalog" | "orders" | "finance" | "settings" | "team" | "view";
