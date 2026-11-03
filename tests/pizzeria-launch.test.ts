import { expect, it } from "vitest";
import { fixture, company, checkout, product } from "./fixtures.ts";
import { orderFixture, changeInput } from "./order-amendment-fixture.ts";
import { pizzaProduct, pizzaSelection } from "./pizza-fixture.ts";
import { pricePizza } from "../src/core/pizza.ts";
import { priceLine, quote } from "../src/core/domain.ts";
import {
  pizzaSnapshot,
  pizzaSalesReport,
  pizzaWorkItems,
  assertOvenCapacity,
} from "../src/core/pizzeriaOperations.ts";
import { restaurantSchema } from "../src/core/restaurantModel.ts";
import { localDay } from "../src/core/calendar.ts";
import { projectState } from "../server/projection.mjs";

it("PIZZA-LAUNCH-01 composition reconciles the flavor rule, count surcharge, dough, edge and extras", () => {
  const config = structuredClone(pizzaProduct.pizza!);
  config.pricing = "average";
  config.sizes[0].flavorCountPricing = { mode: "extra", prices: { "2": 300 } };
  const p = pricePizza(config, pizzaSelection),
    b = p.breakdown;
  expect(b.flavorBaseCents).toBe(3501);
  expect(b.baseCents).toBe(3801);
  expect(b.baseCents + b.doughCents + b.edgeCents + b.flavorExtrasCents).toBe(p.priceCents);
  expect(p.priceCents).toBe(4801);
});

it("PIZZA-LAUNCH-02 snapshots decompose Pizza-category combos, quantities and historical names", async () => {
  const f = await orderFixture(),
    t = f.repo.getSnapshot().tenants[company.id];
  const combo = {
    ...product,
    id: "combo",
    category: "Pizza" as const,
    name: "Duas pizzas",
    priceCents: 5000,
    extras: [],
    combo: {
      groups: [
        {
          id: "one",
          name: "Calabresa",
          quantity: 1,
          options: [{ productId: "a", surchargeCents: 0 }],
        },
        {
          id: "two",
          name: "Mussarela",
          quantity: 2,
          options: [{ productId: "b", surchargeCents: 0 }],
        },
      ],
    },
  };
  const line = priceLine(
    {
      key: "combo-line",
      productId: "combo",
      quantity: 2,
      extraIds: [],
      removedIngredients: [],
      notes: "",
      comboChoices: [
        { groupId: "one", productId: "a" },
        { groupId: "two", productId: "b" },
      ],
    },
    [...t.products, combo],
  );
  expect(line.pizzaDetails!.map((d) => [d.name, d.quantity])).toEqual([
    ["Calabresa", 2],
    ["Mussarela", 4],
  ]);
  expect(line.pizzaUnits).toBe(6);
  expect(line.pizzaDetails!.every((d) => d.componentKey !== "combo-line")).toBe(true);
  const order = { ...f.order, lines: [line], paymentStatus: "Pago" as const };
  const report = pizzaSalesReport([order], localDay(new Date(order.createdAt)).slice(0, 7));
  expect(report.pizzas).toBe(6);
  expect(report.flavors[0]).toEqual({ name: "Mussarela", portions: 4 });
  t.products[0].name = "Nome novo";
  expect(line.pizzaDetails![0].name).toBe("Calabresa");
});

it("PIZZA-LAUNCH-03 fractions sum to whole pizzas, exclude canceled/demo and disclose legacy data", async () => {
  const f = await orderFixture();
  const p = pizzaSnapshot(pizzaProduct, {
    key: "two",
    productId: "pizza",
    quantity: 2,
    extraIds: [],
    removedIngredients: [],
    notes: "",
    pizza: pizzaSelection,
  });
  const o = {
    ...f.order,
    paymentStatus: "Pago" as const,
    lines: [{ ...f.order.lines[0], pizzaDetails: p, pizzaUnits: 2 }],
  };
  const month = localDay(new Date(o.createdAt)).slice(0, 7);
  const r = pizzaSalesReport(
    [
      o,
      { ...o, demo: true },
      { ...o, status: "Cancelado" as const },
      { ...o, lines: [{ ...o.lines[0], pizzaDetails: undefined }] },
    ],
    month,
  );
  expect(r.pizzas).toBe(2);
  expect(r.flavors.map((f) => f.portions)).toEqual([1, 1]);
  expect(r.untrackedLines).toBe(1);
  expect(pizzaSalesReport([o], "").pizzas).toBe(0);
});

it("PIZZA-LAUNCH-04 individual kitchen enforces sequence, conflicts, idempotency and all-ready dispatch", async () => {
  const f = await orderFixture();
  const current = () => f.repo.getSnapshot().tenants[company.id].orders[0];
  await f.services.changeOrder(company.id, f.order.id, "Aceito");
  const items = pizzaWorkItems(current());
  expect(items).toHaveLength(3);
  const collision = structuredClone(current());
  collision.lines[1].pizzaDetails![0].componentKey =
    collision.lines[0].pizzaDetails![0].componentKey;
  expect(new Set(pizzaWorkItems(collision).map((p) => p.key)).size).toBe(3);
  const lastKey = pizzaWorkItems(collision)[2].key;
  collision.lines.shift();
  expect(pizzaWorkItems(collision)[0].key).toBe(lastKey);
  expect(() =>
    quote(
      {
        requestId: "repeated",
        lines: [current().lines[0].selection!, current().lines[0].selection!],
      },
      f.repo.getSnapshot().tenants[company.id].products,
    ),
  ).toThrow(/identificadores/);
  const data = {
    key: items[0].key,
    stage: "preparing",
    requestId: "start-one",
    expectedUpdatedAt: current().updatedAt,
  };
  await expect(
    f.services.changePizzaProduction(company.id, f.order.id, { ...data, stage: "ready" }),
  ).rejects.toThrow();
  await f.services.changePizzaProduction(company.id, f.order.id, data);
  await f.services.changePizzaProduction(company.id, f.order.id, data);
  expect(current().production).toHaveLength(1);
  await expect(
    f.services.changeOrder(company.id, f.order.id, "Pronto para retirada"),
  ).rejects.toThrow(/todas/);
  await expect(
    f.services.changePizzaProduction(company.id, f.order.id, {
      ...data,
      stage: "baking",
      requestId: "stale",
    }),
  ).rejects.toThrow(/mudou/);
  for (const item of items)
    for (const stage of ["preparing", "baking", "ready"]) {
      if (pizzaWorkItems(current()).find((p) => p.key === item.key)!.stage === stage) continue;
      await f.services.changePizzaProduction(company.id, f.order.id, {
        key: item.key,
        stage,
        requestId: item.key + stage,
        expectedUpdatedAt: current().updatedAt,
      });
    }
  await f.services.changeOrder(company.id, f.order.id, "Pronto para retirada");
  expect(current().status).toBe("Pronto para retirada");
  expect(new Set(items.map((i) => i.key)).size).toBe(3);
});

it("PIZZA-LAUNCH-05 receiving purchases is atomic, idempotent, private and updates weighted cost without a cash expense", async () => {
  const f = await fixture();
  await f.services.saveInventoryItem(company.id, {
    id: "flour",
    name: "Farinha",
    unit: "g",
    stock: 1000,
    costPerUnitCents: 10,
    minimum: 0,
  });
  await f.services.saveSupplier(company.id, {
    id: "supplier",
    name: "Fornecedor privado",
    contact: "Teste",
  });
  const purchase = {
    requestId: "purchase-one",
    supplierId: "supplier",
    invoice: "Nota1",
    receivedOn: localDay(new Date()),
    lines: [
      {
        ingredientId: "flour",
        quantity: 100,
        totalCents: 2000,
        batch: "LOT123",
        expiresOn: "2099-01-01",
      },
    ],
  };
  await f.services.receivePurchase(company.id, purchase);
  await f.services.receivePurchase(company.id, purchase);
  const tenant = () => f.repo.getSnapshot().tenants[company.id],
    r = tenant().restaurant!;
  expect(r.inventory[0].stock).toBe(1100);
  expect(r.inventory[0].costPerUnitCents).toBeCloseTo(12000 / 1100, 5);
  expect(r.purchases).toHaveLength(1);
  expect(tenant().expenses).toHaveLength(0);
  expect(r.cashSessions).toHaveLength(0);
  const before = structuredClone(f.repo.getSnapshot());
  await expect(
    f.services.receivePurchase(company.id, {
      ...purchase,
      lines: [{ ...purchase.lines[0], quantity: 2 }],
    }),
  ).rejects.toThrow(/outra compra/);
  await expect(
    f.services.receivePurchase(company.id, {
      ...purchase,
      requestId: "bad",
      lines: [purchase.lines[0], { ...purchase.lines[0], ingredientId: "missing" }],
    }),
  ).rejects.toThrow();
  expect(f.repo.getSnapshot()).toEqual(before);
  expect(JSON.stringify(projectState(before, null))).not.toMatch(/Fornecedor privado|LOT123|Nota1/);
});

it("PIZZA-LAUNCH-06 purchase and supplier writes require management, refuse expired lots and preserve inventory", async () => {
  const f = await fixture("attendant");
  await expect(
    f.services.saveSupplier(company.id, { id: "s", name: "Fornecedor" }),
  ).rejects.toThrow(/perfil/);
  await expect(
    f.services.receivePurchase(company.id, {
      requestId: "x",
      supplierId: "s",
      invoice: "",
      receivedOn: localDay(new Date()),
      lines: [{ ingredientId: "x", quantity: 1, totalCents: 100 }],
    }),
  ).rejects.toThrow(/perfil/);
  const own = await fixture();
  await own.services.saveSupplier(company.id, { id: "s", name: "Fornecedor" });
  await own.services.saveInventoryItem(company.id, {
    id: "x",
    name: "Ingrediente",
    unit: "un",
    stock: 0,
    costPerUnitCents: 0,
    minimum: 0,
  });
  await expect(
    own.services.receivePurchase(company.id, {
      requestId: "bad-date",
      supplierId: "s",
      receivedOn: localDay(new Date()),
      lines: [{ ingredientId: "x", quantity: 1, totalCents: 100, expiresOn: "2000-01-01" }],
    }),
  ).rejects.toThrow(/vencido/);
  expect(own.repo.getSnapshot().tenants[company.id].restaurant!.inventory[0].stock).toBe(0);
  const before = own.repo.getSnapshot();
  for (const [requestId, quantity, totalCents] of [
    ["below-precision", 0.00001, 100],
    ["fractional-precision", 0.00015, 100],
    ["invalid-unit-cost", 0.0001, 100_000_000],
  ] as const) {
    await expect(
      own.services.receivePurchase(company.id, {
        requestId,
        supplierId: "s",
        receivedOn: localDay(new Date()),
        lines: [{ ingredientId: "x", quantity, totalCents }],
      }),
    ).rejects.toThrow();
    expect(own.repo.getSnapshot()).toEqual(before);
  }
});

it("PIZZA-LAUNCH-07 oven capacity respects overlapping bake intervals, size weight, cancellation and historical settings", async () => {
  const f = await orderFixture(),
    t = structuredClone(f.repo.getSnapshot().tenants[company.id]);
  t.restaurant = restaurantSchema.parse({
    scheduling: {
      enabled: true,
      leadMinutes: 60,
      slotMinutes: 30,
      capacity: 10,
      days: 7,
      ovenSlots: 2,
    },
  });
  const pizza = {
    ...f.order.lines[0].pizzaDetails![0],
    quantity: 1,
    ovenUnits: 2,
    ovenMinutes: 10,
  };
  const old = {
    ...f.order,
    scheduledAt: "2030-01-01T12:30:00Z",
    lines: [{ ...f.order.lines[0], pizzaDetails: [pizza] }],
  };
  t.orders = [old];
  expect(() => assertOvenCapacity(t, "2030-01-01T12:35:00Z", [pizza])).toThrow(/forno/);
  expect(() => assertOvenCapacity(t, "2030-01-01T12:40:00Z", [pizza])).not.toThrow();
  expect(() => assertOvenCapacity(t, "2030-01-01T12:30:00Z", [pizza], old.id)).not.toThrow();
  t.orders[0].status = "Cancelado";
  expect(() => assertOvenCapacity(t, "2030-01-01T12:35:00Z", [pizza])).not.toThrow();
  expect(() =>
    assertOvenCapacity(t, "2030-01-01T12:35:00Z", [{ ...pizza, quantity: 2 }]),
  ).toThrow();
});

it("PIZZA-LAUNCH-08 unknown legacy oven reservations are never treated as zero", async () => {
  const f = await orderFixture(),
    t = structuredClone(f.repo.getSnapshot().tenants[company.id]);
  t.restaurant!.scheduling.ovenSlots = 10;
  t.orders[0].scheduledAt = "2030-01-01T12:30:00Z";
  delete t.orders[0].lines[0].pizzaDetails;
  expect(() =>
    assertOvenCapacity(t, "2030-01-01T12:35:00Z", f.order.lines[0].pizzaDetails!),
  ).toThrow(/antigo/);
});

it("PIZZA-LAUNCH-09 scheduled edits recheck oven and pizza capacity atomically, cancellations shrink historical quantities", async () => {
  const f = await orderFixture();
  await f.repo.transact((s) => {
    const t = s.tenants[company.id];
    t.orders[0].scheduledAt = "2030-01-01T12:30:00Z";
    t.restaurant!.scheduling.ovenSlots = 3;
    t.restaurant!.scheduling.pizzaCapacity = 4;
  });
  const input = changeInput(f.order, {
    kind: "edit",
    selection: { ...f.order.lines[0].selection!, quantity: 3 },
    expectedTotalCents: 13000,
  });
  let before = structuredClone(f.repo.getSnapshot());
  await expect(f.services.amendOrderItem(company.id, f.order.id, input)).rejects.toThrow(/forno/);
  expect(f.repo.getSnapshot()).toEqual(before);
  await f.repo.transact((s) => {
    const config = s.tenants[company.id].restaurant!.scheduling;
    config.ovenSlots = 5;
    config.pizzaCapacity = 3;
  });
  before = structuredClone(f.repo.getSnapshot());
  await expect(f.services.amendOrderItem(company.id, f.order.id, input)).rejects.toThrow(
    /capacidade/,
  );
  expect(f.repo.getSnapshot()).toEqual(before);
  await f.repo.transact((s) => {
    s.tenants[company.id].restaurant!.scheduling.pizzaCapacity = 4;
  });
  const updated = await f.services.amendOrderItem(company.id, f.order.id, input);
  expect(updated.lines[0].pizzaDetails![0].quantity).toBe(3);
  const canceled = await f.services.amendOrderItem(
    company.id,
    f.order.id,
    changeInput(updated, { requestId: "cancel-two", cancelQuantity: 2, expectedTotalCents: 7000 }),
  );
  expect(canceled.lines[0].pizzaDetails![0].quantity).toBe(1);
  expect(canceled.pizzaUnits).toBe(2);
});
