import { it, expect, vi, afterEach } from "vitest";
import { readFile } from "node:fs/promises";
import { fixture, company, product, checkout } from "./fixtures.ts";
import { pizzaProduct, pizzaLine, pizzaSelection } from "./pizza-fixture.ts";
import { catalogExportRows } from "../src/core/catalogExport.ts";
import { planCatalogImport, catalogFingerprint } from "../src/core/catalogImport.ts";
import { writeCatalogExport } from "../src/adapters/catalogExportWorkbook.js";
import { readCatalogBuffer } from "../src/adapters/catalogWorkbook.js";
import {
  comboStartingPrice,
  comboOptionState,
  pizzaUnitsForLines,
  cashSummary,
  validateSchedule,
} from "../src/core/restaurant.ts";
import { restaurantSchema } from "../src/core/restaurantModel.ts";
import { priceLine, openState, finance, uuid, recordPayment } from "../src/core/domain.ts";
import { paidCents, dueCents, paymentLedger } from "../src/core/payments.ts";
import { businessOverview } from "../src/core/analytics.ts";
import { publicOrder, projectState } from "../server/projection.mjs";
afterEach(() => vi.useRealTimers());
const line = {
  key: "basic",
  productId: product.id,
  quantity: 1,
  extraIds: [],
  removedIngredients: [],
  notes: "",
};
const docFor = (products: any[]) => {
  const rows = catalogExportRows(products);
  return {
    issues: [],
    sheets: [
      { name: "Produtos", rows: rows.products.map((cells, i) => ({ line: i + 1, cells })) },
      { name: "Adicionais", rows: rows.extras.map((cells, i) => ({ line: i + 1, cells })) },
      {
        name: "Preços das pizzas",
        rows: rows.pizzaPrices.map((cells, i) => ({ line: i + 1, cells })),
      },
    ],
  };
};
const combo = (options: any[], quantity = 1) => ({
  ...product,
  id: "combo",
  name: "Combo da casa",
  extras: [],
  priceCents: 5000,
  combo: { groups: [{ id: "g", name: "Pizza", quantity, options }] },
});
const chosen = (productId: string, pizza?: any) => ({
  ...line,
  productId: "combo",
  comboChoices: [{ groupId: "g", productId, ...(pizza ? { pizza } : {}) }],
});
async function staff(f: any, key = uuid(), channel = "counter", tabId?: string) {
  return f.services.createStaffOrder(company.id, {
    requestId: key,
    channel,
    tabId,
    lines: [line],
    checkout: {
      ...checkout,
      name: "",
      phone: "",
      fulfillment: "pickup",
      changeForCents: null,
      expectedTotalCents: 2990,
    },
  });
}
const snap = (f: any) => f.repo.getSnapshot().tenants[company.id];
it("REFINE-01 reimporta produto rico sem perder receita, alergênicos, combo ou ficha do adicional", () => {
  const p = {
    ...product,
    sku: "A",
    recipe: [{ ingredientId: "x", quantity: 1 }],
    allergens: ["Leite"],
    extras: product.extras.map((e) => ({ ...e, recipe: [{ ingredientId: "x", quantity: 2 }] })),
    combo: {
      groups: [
        {
          id: "g",
          name: "Bebida",
          quantity: 1,
          options: [{ productId: "drink", surchargeCents: 0 }],
        },
      ],
    },
  };
  const doc = docFor([p]);
  doc.sheets[0].rows[1].cells[1] = "Nome editado";
  const before = JSON.stringify(p),
    plan = planCatalogImport(doc, [p], true);
  expect(plan.issues).toEqual([]);
  expect(plan.entries[0].product).toMatchObject({ ...p, name: "Nome editado" });
  expect(JSON.stringify(p)).toBe(before);
});
it("REFINE-02 exporta XLSX com preço por tamanho e reimporta sincronizando os sabores vinculados", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, pizzaProduct);
  await f.services.linkPizzaCatalog(company.id, "pizza");
  const snapshot = await f.services.exportCatalog(company.id);
  const bytes = await readFile("public/templates/modelo-cardapio-brasa.xlsx");
  const exported = await writeCatalogExport(
    snapshot,
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
  const doc = await readCatalogBuffer(exported.buffer);
  expect(doc.issues).toEqual([]);
  const sheet = doc.sheets.find((s) => s.name === "Preços das pizzas")!;
  expect(sheet).toBeTruthy();
  const row = sheet.rows.find((r) => r.cells[1] === "large" && r.cells[3] === "cheese")!;
  row.cells[5] = 47.9;
  await f.services.importCatalog(company.id, doc, {
    allowUpdates: true,
    expectedFingerprint: catalogFingerprint(snap(f).products),
  });
  const ps = snap(f).products;
  expect(ps.find((p) => p.id === "pizza")!.pizza!.flavors[0].prices.large).toBe(4790);
  const sourceId = ps.find((p) => p.id === "pizza")!.pizza!.flavors[0].sourceProductId;
  expect(ps.find((p) => p.id === sourceId)!.pizza!.flavors[0].prices.large).toBe(4790);
});
it("REFINE-03 impede preço de pizza inválido e alteração de categoria sem mudar o cadastro", async () => {
  const p = { ...pizzaProduct, sku: "P" };
  const d = docFor([p]);
  d.sheets[2].rows[1].cells[5] = -1;
  expect(planCatalogImport(d, [p], true).issues.length).toBeGreaterThan(0);
  const d2 = docFor([p]);
  d2.sheets[0].rows[1].cells[2] = "Bebida";
  expect(planCatalogImport(d2, [p], true).issues.some((i) => i.column === "Categoria")).toBe(true);
  expect(p.pizza.flavors[0].prices.medium).toBe(3000);
});
it("REFINE-04 vínculo preserva opções legadas e bloqueia cobrança duplicada de tamanho e borda", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, {
    ...product,
    id: "old",
    name: "Mussarela",
    category: "Pizza",
    extras: [
      { id: "lg", name: "Grande 35 cm / 8 fatias", priceCents: 1000, available: true },
      { id: "edge", name: "Borda recheada", priceCents: 800, available: true },
      { id: "soda", name: "Bebida", priceCents: 500, available: true },
    ],
  });
  await f.services.saveProduct(company.id, pizzaProduct);
  await f.services.linkPizzaCatalog(company.id, "pizza");
  const p = snap(f).products.find((p) => p.id === "old")!;
  expect(p.extras).toHaveLength(3);
  expect(p.extras[0].replacedByPizzaOption).toBe(true);
  const l = {
    ...pizzaLine,
    productId: p.id,
    pizza: { ...pizzaSelection, flavorIds: [p.pizza!.flavors[0].id] },
  };
  expect(() => priceLine({ ...l, extraIds: ["lg", "edge"] }, [p])).toThrow(
    /tamanho|borda|montador/,
  );
  expect(priceLine({ ...l, extraIds: ["soda"] }, [p]).unitPriceCents).toBe(4500);
});
it("REFINE-05 anúncio e seleção do combo ignoram tamanho desativado e opções incompatíveis", () => {
  const p = {
    ...pizzaProduct,
    pizza: {
      ...pizzaProduct.pizza,
      flavors: [pizzaProduct.pizza.flavors[0]],
      sizes: pizzaProduct.pizza.sizes.map((s) => ({ ...s, available: s.id === "large" })),
    },
  };
  const c = combo([
    { productId: p.id, sizeId: "medium", surchargeCents: 0 },
    { productId: "other", sizeId: "large", surchargeCents: 1000 },
  ]);
  const other = { ...p, id: "other" };
  expect(comboOptionState(c.combo.groups[0].options[0], [p, other]).available).toBe(false);
  expect(comboStartingPrice(c, [p, other])).toBe(6000);
  expect(() => priceLine(chosen(p.id), [c, p, other])).toThrow(/tamanho/i);
  expect(priceLine(chosen(other.id), [c, p, other]).unitPriceCents).toBe(6000);
  expect(comboStartingPrice(c, [p])).toBeNull();
});
it("REFINE-06 combo monta vários sabores e cobra adicionais por unidade, sem repetir preço-base", () => {
  const p = {
      ...pizzaProduct,
      pizza: {
        ...pizzaProduct.pizza,
        flavors: pizzaProduct.pizza.flavors.map((f) => ({
          ...f,
          extras: [{ id: "x", name: "Extra", available: true, priceCents: 300 }],
        })),
      },
    },
    c = combo([{ productId: p.id, sizeId: "large", customizePizza: true, surchargeCents: 100 }], 2);
  const selection = {
    ...pizzaSelection,
    sizeId: "large",
    flavorIds: ["cheese", "pepper", "chicken"],
    flavorCount: 3,
    customizations: [{ flavorId: "cheese", extraIds: ["x"], removedIngredients: [] }],
  };
  const l = { ...chosen(p.id, selection), quantity: 2 };
  expect(priceLine(l, [c, p]).unitPriceCents).toBe(7700);
  expect(priceLine(l, [c, p]).totalCents).toBe(15400);
  expect(pizzaUnitsForLines([l], [c, p])).toBe(4);
  expect(priceLine(l, [c, p]).pizzaSummary).toContain("Frango");
  expect(() => priceLine(chosen(p.id, { ...selection, sizeId: "medium" }), [c, p])).toThrow(
    /tamanho/,
  );
  expect(comboStartingPrice(c, [p])).toBe(5100);
});
it("REFINE-07 edita linha na sacola preservando chave e recalculando o preço atual", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, pizzaProduct);
  await f.services.addToCart(company.id, pizzaLine);
  const key = snap(f).cart.lines[0].key;
  await f.services.updateCartLine(company.id, key, {
    ...pizzaLine,
    quantity: 2,
    pizza: { ...pizzaSelection, edgeId: "plain" },
  });
  expect(snap(f).cart.lines).toHaveLength(1);
  expect(snap(f).cart.lines[0].key).toBe(key);
  expect(priceLine(snap(f).cart.lines[0], snap(f).products).totalCents).toBe(8402);
  await expect(
    f.services.updateCartLine(company.id, key, { ...line, productId: "forged" }),
  ).rejects.toThrow();
  expect(snap(f).cart.lines[0].quantity).toBe(2);
});
it("REFINE-08 permite montar fora do horário somente para agenda habilitada, respeitando fechamento manual", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T15:00:00Z"));
  const f = await fixture();
  await f.repo.transact((s) => {
    const t = s.tenants[company.id];
    t.restaurant = restaurantSchema.parse({
      scheduling: { enabled: true, leadMinutes: 60, slotMinutes: 30, capacity: 10, days: 7 },
    });
    t.settings.scheduleEnabled = true;
    t.settings.hours = t.settings.hours.map((h) => ({
      ...h,
      enabled: true,
      open: "18:00",
      close: "23:00",
    }));
  });
  expect(openState(company, snap(f), new Date())).toMatchObject({ open: false, canSchedule: true });
  await f.services.addToCart(company.id, line);
  await expect(
    f.services.checkout(company.id, snap(f).cart.requestId, {
      ...checkout,
      expectedTotalCents: 3490,
      changeForCents: null,
    }),
  ).rejects.toThrow();
  const o = await f.services.checkout(company.id, snap(f).cart.requestId, {
    ...checkout,
    scheduledAt: "2026-10-28T22:00:00Z",
    expectedTotalCents: 3490,
    changeForCents: null,
  });
  expect(o.scheduledAt).toBe("2026-10-28T22:00:00.000Z");
  await f.services.setOnline(company.id, false);
  expect(openState(company, snap(f), new Date()).canSchedule).not.toBe(true);
  await expect(f.services.addToCart(company.id, line)).rejects.toThrow();
});
it("REFINE-09 capacidade conta pizzas e quantidades de combos, cancelamento libera horário", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, pizzaProduct);
  const c = combo(
    [{ productId: "pizza", sizeId: "medium", customizePizza: true, surchargeCents: 0 }],
    2,
  );
  await f.services.saveProduct(company.id, c);
  const t = structuredClone(snap(f));
  t.restaurant = restaurantSchema.parse({
    scheduling: {
      enabled: true,
      leadMinutes: 60,
      slotMinutes: 30,
      capacity: 10,
      days: 7,
      pizzaCapacity: 3,
    },
  });
  const at = "2026-10-28T22:00:00.000Z",
    now = new Date("2026-10-28T12:00:00Z"),
    l = chosen("pizza", { ...pizzaSelection, flavorIds: ["cheese"] });
  expect(() => validateSchedule(t, at, now, [{ ...l, quantity: 2 }])).toThrow(
    /capacidade de pizzas/,
  );
  expect(() => validateSchedule(t, at, now, [l])).not.toThrow();
  const existing = await staff(f);
  t.orders = [{ ...existing, scheduledAt: at, pizzaUnits: 2 }];
  expect(() => validateSchedule(t, at, now, [l])).toThrow(/capacidade de pizzas/);
  t.orders[0].status = "Cancelado";
  expect(() => validateSchedule(t, at, now, [l])).not.toThrow();
  t.orders[0] = {
    ...existing,
    scheduledAt: at,
    pizzaUnits: undefined,
    lines: [{ ...existing.lines[0], quantity: 2, selection: pizzaLine }],
  };
  expect(() => validateSchedule(t, at, now, [l])).toThrow(/capacidade de pizzas/);
  t.orders[0].lines[0].selection = l;
  expect(() => validateSchedule(t, at, now, [l])).toThrow(/pedido antigo sem contagem/);
});
it("REFINE-18 recebimento em meses diferentes registra receita em cada data e venda somente na quitação", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T15:00:00Z"));
  const f = await fixture(),
    o = await staff(f);
  await f.services.recordOrderPayment(company.id, o.id, {
    requestId: "first",
    kind: "receipt",
    amountCents: 1000,
    method: "Pix",
  });
  vi.setSystemTime(new Date("2026-11-02T15:00:00Z"));
  await f.auth.startDemo("owner");
  await f.services.recordOrderPayment(company.id, o.id, {
    requestId: "last",
    kind: "receipt",
    amountCents: 1990,
    method: "Dinheiro",
  });
  const october = businessOverview(company, snap(f), new Date("2026-10-30T15:00:00Z")),
    november = businessOverview(company, snap(f), new Date());
  expect(october.revenueCents).toBe(1000);
  expect(october.saleCount).toBe(0);
  expect(november.revenueCents).toBe(1990);
  expect(november.saleCount).toBe(1);
  expect(november.averageTicketCents).toBe(2990);
});
it("REFINE-10 balcão e mesa aceitam cliente sem telefone, canal telefone exige identificação", async () => {
  const f = await fixture();
  const o = await staff(f);
  expect(o.customer).toEqual({ name: "Consumidor no balcão", phone: "" });
  expect(o.paymentStatus).toBe("Pendente");
  await expect(staff(f, uuid(), "phone")).rejects.toThrow();
  await f.services.saveTable(company.id, { id: "t1", name: "Mesa 1", enabled: true });
  const tab = await f.services.openTab(company.id, "t1", "João");
  const table = await staff(f, uuid(), "table", tab.id);
  expect(table.customer.name).toBe("João");
  expect(table.customer.phone).toBe("");
});
it("REFINE-11 ficha do adicional geral calcula custo e baixa quantidade sem duplicação", async () => {
  const f = await fixture();
  await f.services.saveInventoryItem(company.id, {
    id: "q",
    name: "Queijo",
    unit: "g",
    stock: 1000,
    costPerUnitCents: 2,
    minimum: 0,
  });
  await f.services.saveRecipe(company.id, product.id, { kind: "extra", extraId: "cheese" }, [
    { ingredientId: "q", quantity: 25 },
  ]);
  await f.services.saveProduct(company.id, { ...snap(f).products[0], costCents: 500 });
  await f.services.addToCart(company.id, { ...line, quantity: 2, extraIds: ["cheese"] });
  const q = priceLine(snap(f).cart.lines[0], snap(f).products, snap(f).restaurant!.inventory);
  expect(q.unitCostCents).toBe(550);
  await f.services.checkout(company.id, snap(f).cart.requestId, {
    ...checkout,
    expectedTotalCents: 7280,
  });
  expect(snap(f).restaurant!.inventory[0].stock).toBe(950);
  const pub = projectState(f.repo.getSnapshot(), null);
  expect(pub.tenants[company.id].products[0].extras[0]).not.toHaveProperty("recipe");
});
it("REFINE-12 recebe em dinheiro e Pix por partes, evita duplicidade e confere caixa e receita", async () => {
  const f = await fixture();
  await f.services.openCash(company.id, 10000);
  const o = await staff(f),
    a = {
      requestId: "p1",
      kind: "receipt",
      amountCents: 1000,
      method: "Dinheiro",
      reason: "Conferido",
      expectedUpdatedAt: o.updatedAt,
    };
  await f.services.recordOrderPayment(company.id, o.id, a);
  await f.services.recordOrderPayment(company.id, o.id, a);
  let current = snap(f).orders[0];
  expect(paidCents(current)).toBe(1000);
  expect(dueCents(current)).toBe(1990);
  expect(current.paymentStatus).toBe("Pendente");
  await expect(
    f.services.recordOrderPayment(company.id, o.id, { ...a, requestId: "stale" }),
  ).rejects.toThrow(/atualizado/);
  await f.services.recordOrderPayment(company.id, o.id, {
    ...a,
    requestId: "p2",
    amountCents: 1990,
    method: "Pix",
    expectedUpdatedAt: current.updatedAt,
  });
  current = snap(f).orders[0];
  expect(current.paymentStatus).toBe("Pago");
  expect(cashSummary(snap(f), snap(f).restaurant!.cashSessions[0])).toEqual({
    receipts: { Dinheiro: 1000, Pix: 1990 },
    expectedCents: 11000,
  });
  expect(finance(snap(f).orders).receivedCents).toBe(2990);
  expect(businessOverview(company, snap(f)).revenueCents).toBe(2990);
  expect(publicOrder(current)).not.toHaveProperty("payments");
  await expect(
    f.services.recordOrderPayment(company.id, o.id, {
      ...a,
      requestId: "over",
      expectedUpdatedAt: undefined,
    }),
  ).rejects.toThrow(/saldo/);
});
it("REFINE-13 estorna recebimento parcial somente após cancelar e com motivo, sem alterar caixa fechado", async () => {
  const f = await fixture();
  await f.services.openCash(company.id, 0);
  const o = await staff(f);
  await f.services.recordOrderPayment(company.id, o.id, {
    requestId: "pay",
    kind: "receipt",
    amountCents: 1200,
    method: "Dinheiro",
  });
  await f.services.closeCash(company.id, 1200);
  await f.services.openCash(company.id, 0);
  const refund = {
    requestId: "refund",
    kind: "refund",
    amountCents: 200,
    method: "Dinheiro",
    reason: "",
  };
  await expect(f.services.recordOrderPayment(company.id, o.id, refund)).rejects.toThrow();
  await f.services.changeOrder(company.id, o.id, "Cancelado", "Cliente desistiu");
  await expect(f.services.recordOrderPayment(company.id, o.id, refund)).rejects.toThrow();
  await f.services.recordOrderPayment(company.id, o.id, { ...refund, reason: "Devolvido" });
  expect(paidCents(snap(f).orders[0])).toBe(1000);
  expect(cashSummary(snap(f), snap(f).restaurant!.cashSessions[0]).expectedCents).toBe(1200);
  expect(cashSummary(snap(f), snap(f).restaurant!.cashSessions[1]).receipts.Dinheiro).toBe(-200);
  await f.services.recordOrderPayment(company.id, o.id, {
    ...refund,
    requestId: "refund2",
    amountCents: 1000,
    reason: "Restante devolvido",
  });
  expect(snap(f).orders[0].paymentStatus).toBe("Estornado");
});
it("REFINE-14 divide pagamento por pedidos e transfere sem duplicar consumo ou recebimentos", async () => {
  const f = await fixture();
  for (const id of ["a", "b", "c"])
    await f.services.saveTable(company.id, { id, name: `Mesa ${id}`, enabled: true });
  const tab = await f.services.openTab(company.id, "a", "Ana"),
    o1 = await staff(f, uuid(), "table", tab.id),
    o2 = await staff(f, uuid(), "table", tab.id);
  await f.services.transferTab(company.id, tab.id, "b", [o2.id]);
  const tab2 = snap(f).restaurant!.tabs.find((t) => t.tableId === "b")!;
  expect(snap(f).orders.find((o) => o.id === o2.id)!.tabId).toBe(tab2.id);
  expect(snap(f).orders.find((o) => o.id === o1.id)!.tabId).toBe(tab.id);
  await f.services.payTab(company.id, tab.id, {
    requestId: "tab-pay",
    amountCents: 500,
    method: "Pix",
    orderIds: [o1.id],
  });
  await f.services.payTab(company.id, tab.id, {
    requestId: "tab-pay",
    amountCents: 500,
    method: "Pix",
    orderIds: [o1.id],
  });
  expect(paidCents(snap(f).orders.find((o) => o.id === o1.id)!)).toBe(500);
  await expect(f.services.transferTab(company.id, tab.id, "b", [o1.id])).rejects.toThrow(
    /sem pagamento/,
  );
  await expect(f.services.closeTab(company.id, tab.id)).rejects.toThrow();
  await f.services.transferTab(company.id, tab.id, "c");
  expect(snap(f).orders.find((o) => o.id === o1.id)!.tableName).toBe("Mesa c");
  expect(paymentLedger(snap(f).orders.find((o) => o.id === o1.id)!)).toHaveLength(1);
  await expect(
    f.services.payTab(company.id, tab.id, {
      requestId: "bad",
      amountCents: 500,
      method: "Pix",
      orderIds: ["other"],
    }),
  ).rejects.toThrow(/seleção/);
});
it("REFINE-15 atendente não registra pagamentos nem configura receitas", async () => {
  const f = await fixture("attendant");
  await expect(
    f.services.recordOrderPayment(company.id, "order", {
      requestId: "x",
      kind: "receipt",
      amountCents: 500,
      method: "Pix",
    }),
  ).rejects.toThrow();
  await expect(
    f.services.payTab(company.id, "tab", { requestId: "x", amountCents: 500, method: "Pix" }),
  ).rejects.toThrow();
  await expect(
    f.services.saveRecipe(company.id, product.id, { kind: "extra", extraId: "cheese" }, []),
  ).rejects.toThrow();
});
it("REFINE-19 estorno novo preserva recebimento legado sem identificação do turno e não atribui novos sem caixa", async () => {
  const f = await fixture();
  await f.services.openCash(company.id, 0);
  const o = await staff(f);
  await f.repo.transact((s) => {
    const t = s.tenants[company.id],
      index = t.orders.findIndex((v) => v.id === o.id);
    t.orders[index] = recordPayment(t.orders[index], "Pago", "Gestor", "Recebido no legado");
  });
  expect(cashSummary(snap(f), snap(f).restaurant!.cashSessions[0]).expectedCents).toBe(2990);
  await f.services.changeOrder(company.id, o.id, "Cancelado", "Devolução");
  await f.services.recordOrderPayment(company.id, o.id, {
    requestId: "legacy-refund",
    kind: "refund",
    amountCents: 200,
    method: "Dinheiro",
    reason: "Devolvido",
  });
  expect(cashSummary(snap(f), snap(f).restaurant!.cashSessions[0]).expectedCents).toBe(2790);
  expect(snap(f).orders[0].payments?.at(-1)).not.toHaveProperty("reason");
  await f.services.closeCash(company.id, 2790);
  const other = await staff(f);
  await f.services.recordOrderPayment(company.id, other.id, {
    requestId: "unassigned",
    kind: "receipt",
    amountCents: 500,
    method: "Dinheiro",
  });
  await f.services.openCash(company.id, 0);
  expect(cashSummary(snap(f), snap(f).restaurant!.cashSessions[1]).expectedCents).toBe(0);
});
it("REFINE-16 importação conjunta mantém nome individual editado e preço do montador, independente da ordem das linhas", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, pizzaProduct);
  await f.services.linkPizzaCatalog(company.id, "pizza");
  const snapshot = await f.services.exportCatalog(company.id),
    p = snapshot.products.find((p) => p.id === "pizza")!,
    id = p.pizza!.flavors[0].sourceProductId,
    source = snapshot.products.find((p) => p.id === id)!;
  const doc = docFor(snapshot.products);
  doc.sheets[0].rows.find((r) => r.cells[0] === source.sku)!.cells[1] = "Mussarela especial";
  doc.sheets[2].rows.find((r) => r.cells[1] === "large" && r.cells[3] === "cheese")!.cells[5] =
    48.9;
  await f.services.importCatalog(company.id, doc, {
    allowUpdates: true,
    expectedFingerprint: catalogFingerprint(snap(f).products),
  });
  expect(snap(f).products.find((p) => p.id === id)!.name).toBe("Mussarela especial");
  expect(snap(f).products.find((p) => p.id === "pizza")!.pizza!.flavors[0]).toMatchObject({
    name: "Mussarela especial",
    prices: { large: 4890 },
  });
});
it("REFINE-17 recebimento parcial de comanda quita saldos mais antigos, fechamento exige entrega e não duplica ao repetir", async () => {
  const f = await fixture();
  await f.services.saveTable(company.id, { id: "a", name: "Mesa A", enabled: true });
  const tab = await f.services.openTab(company.id, "a", ""),
    o1 = await staff(f, uuid(), "table", tab.id),
    o2 = await staff(f, uuid(), "table", tab.id);
  const input = { requestId: "split", amountCents: 4000, method: "Pix" };
  await f.services.payTab(company.id, tab.id, input);
  await f.services.payTab(company.id, tab.id, input);
  expect(snap(f).orders.reduce((s, o) => s + paidCents(o), 0)).toBe(4000);
  expect(snap(f).orders.filter((o) => o.paymentStatus === "Pago")).toHaveLength(1);
  await f.services.payTab(company.id, tab.id, { ...input, requestId: "rest", amountCents: 1980 });
  await expect(f.services.closeTab(company.id, tab.id)).rejects.toThrow();
  for (const o of [o1, o2]) {
    await f.services.changeOrder(company.id, o.id, "Aceito", "");
    await f.services.changeOrder(company.id, o.id, "Preparando", "");
    await f.services.changeOrder(company.id, o.id, "Pronto para retirada", "");
    await f.services.changeOrder(company.id, o.id, "Entregue", "");
  }
  await f.services.closeTab(company.id, tab.id);
  expect(snap(f).restaurant!.tabs[0].closedAt).toBeTruthy();
});
