import { z } from "zod";

const id = z.string().min(1).max(150);
const money = z.number().int().min(0).max(100_000_000);
export const recipeSchema = z
  .array(z.object({ ingredientId: id, quantity: z.number().positive().max(1_000_000) }))
  .max(100);
export const pizzaChoiceSchema = z
  .object({
    sizeId: id,
    flavorIds: z.array(id).min(1).max(4),
    flavorCount: z.number().int().min(1).max(4).optional(),
    doughId: id,
    edgeId: id,
    portions: z.array(z.number().int().min(1).max(4)).max(4).optional(),
    customizations: z
      .array(
        z.object({
          flavorId: id,
          extraIds: z.array(id).max(30),
          removedIngredients: z.array(z.string().trim().max(60)).max(30),
        }),
      )
      .max(4)
      .optional(),
  })
  .strict();
export const comboSchema = z.object({
  groups: z
    .array(
      z
        .object({
          id,
          mode: z.enum(["included", "choice"]).optional(),
          name: z.string().trim().min(1).max(70),
          quantity: z.number().int().min(1).max(10),
          options: z
            .array(
              z.object({
                productId: id,
                surchargeCents: money,
                sizeId: id.optional(),
                customizePizza: z.boolean().optional(),
              }),
            )
            .min(1)
            .max(80),
        })
        .refine(
          (g) => g.mode !== "included" || g.options.length === 1,
          "Um item fixo deve conter somente um produto. Separe os produtos incluídos em itens.",
        ),
    )
    .min(1)
    .max(10),
});
export const comboChoiceSchema = z.object({
  groupId: id,
  productId: id,
  pizza: pizzaChoiceSchema.optional(),
});
export const paymentEntrySchema = z.object({
  id,
  requestId: id,
  kind: z.enum(["receipt", "refund"]),
  amountCents: money.refine((n) => n > 0),
  method: z.string().min(1).max(60),
  at: z.string(),
  actor: z.string(),
  cashSessionId: id,
});
export const pizzaSaleSchema = z.object({
  componentKey: z.string().min(1).max(400),
  productId: id,
  name: z.string().max(80),
  quantity: z.number().int().min(1).max(100000),
  sizeId: id,
  sizeName: z.string().max(60),
  diameterCm: z.number().optional(),
  dough: z.string().max(60).default(""),
  edge: z.string().max(60).default(""),
  ovenMinutes: z.number().int().min(1).max(120),
  ovenUnits: z.number().min(0.25).max(20),
  flavors: z
    .array(z.object({ id, name: z.string().max(80), share: z.number().positive().max(1) }))
    .min(1)
    .max(4),
});
export const supplierSchema = z.object({
  id,
  name: z.string().trim().min(2).max(80),
  contact: z.string().trim().max(120).default(""),
});
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    "Data inválida.",
  );
export const purchaseInputSchema = z.object({
  requestId: id,
  supplierId: id,
  invoice: z.string().trim().max(80).default(""),
  receivedOn: calendarDate,
  lines: z
    .array(
      z.object({
        ingredientId: id,
        quantity: z
          .number()
          .min(0.0001)
          .max(1e9)
          .refine(
            (n) => Math.abs(n * 10000 - Math.round(n * 10000)) < 0.00001,
            "Use até quatro casas decimais na quantidade.",
          ),
        totalCents: money.refine((n) => n > 0),
        batch: z.string().trim().max(60).default(""),
        expiresOn: calendarDate.optional(),
      }),
    )
    .min(1)
    .max(100),
});
export const restaurantSchema = z.object({
  suppliers: z.array(supplierSchema).max(500).default([]),
  purchases: z
    .array(purchaseInputSchema.extend({ id, at: z.string(), actor: z.string(), totalCents: money }))
    .default([]),
  inventory: z
    .array(
      z.object({
        id,
        name: z.string().trim().min(1).max(80),
        unit: z.enum(["g", "ml", "un"]),
        stock: z.number().min(0).max(1e9),
        costPerUnitCents: z.number().min(0).max(1e8),
        minimum: z.number().min(0).max(1e9),
      }),
    )
    .max(500)
    .default([]),
  movements: z
    .array(
      z.object({
        id,
        ingredientId: id,
        quantity: z.number(),
        reason: z.string().min(1).max(200),
        at: z.string(),
        orderId: id.optional(),
      }),
    )
    .default([]),
  cashSessions: z
    .array(
      z.object({
        id,
        openedAt: z.string(),
        openedBy: z.string(),
        openingCents: money,
        movements: z.array(
          z.object({
            id,
            kind: z.enum(["supply", "withdrawal"]),
            amountCents: money,
            reason: z.string().min(1).max(200),
            at: z.string(),
          }),
        ),
        closedAt: z.string().optional(),
        closedBy: z.string().optional(),
        countedCents: money.optional(),
        expectedCents: z.number().int().optional(),
        receipts: z.record(z.string(), z.number().int()).optional(),
      }),
    )
    .default([]),
  tables: z
    .array(z.object({ id, name: z.string().trim().min(1).max(40), enabled: z.boolean() }))
    .max(100)
    .default([]),
  tabs: z
    .array(
      z.object({
        id,
        tableId: id,
        customer: z.string().max(70),
        openedAt: z.string(),
        closedAt: z.string().optional(),
      }),
    )
    .default([]),
  scheduling: z
    .object({
      enabled: z.boolean(),
      leadMinutes: z.number().int().min(15).max(1440),
      slotMinutes: z.number().int().min(15).max(120),
      capacity: z.number().int().min(1).max(500),
      days: z.number().int().min(1).max(30),
      pizzaCapacity: z.number().int().min(1).max(5000).optional(),
      ovenSlots: z.number().int().min(1).max(100).optional(),
    })
    .default({ enabled: false, leadMinutes: 60, slotMinutes: 30, capacity: 10, days: 7 }),
});
export type Restaurant = z.infer<typeof restaurantSchema>;
