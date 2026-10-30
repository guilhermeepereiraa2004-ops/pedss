import { afterEach, expect, it, vi } from "vitest";
import { company, checkout } from "./fixtures.ts";
import { pizzaProduct, pizzaLine } from "./pizza-fixture.ts";
import { comboSchema } from "../src/core/restaurantModel.ts";
import { planOrderItemChange } from "../src/core/orderAmendments.ts";
import { paidCents, dueCents, refundableCents } from "../src/core/payments.ts";
import { cashSummary } from "../src/core/restaurant.ts";
import { publicOrder, projectState } from "../server/projection.mjs";
import { changeComboGroupMode } from "../src/application/comboDraft.js";
afterEach(() => vi.useRealTimers());
import { orderFixture, tenantOf, changeInput } from "./order-amendment-fixture.ts";
it("AMEND-01 cancela uma unidade, preserva outra pizza e audita devolução histórica sem reprecificar", async () => {
  const f = await orderFixture();
  expect(f.order.lines[0].stockUsage).toEqual([{ ingredientId: "flour", quantity: 200 }]);
  await f.repo.transact((s) => {
    s.tenants[company.id].products[0].recipe = [{ ingredientId: "flour", quantity: 999 }];
    s.tenants[company.id].products[1].priceCents = 9000;
  });
  const input = changeInput(f.order);
  const next = await f.services.amendOrderItem(company.id, f.order.id, input);
  expect(next.totalCents).toBe(7000);
  expect(next.lines.map((l) => l.totalCents)).toEqual([3000, 4000]);
  expect(tenantOf(f).restaurant!.inventory[0].stock).toBe(750);
  expect(next.stockUsage).toEqual([{ ingredientId: "flour", quantity: 250 }]);
  expect(next.amendments![0].before).toEqual(f.order.lines[0]);
  expect(next.amendments![0].after!.quantity).toBe(1);
  expect(next.history.slice(0, f.order.history.length)).toEqual(f.order.history);
  expect(next.updatedAt > f.order.updatedAt).toBe(true);
  const movements = tenantOf(f).restaurant!.movements.length;
  await f.services.amendOrderItem(company.id, f.order.id, input);
  expect(tenantOf(f).restaurant!.movements).toHaveLength(movements);
  expect(tenantOf(f).orders[0].amendments).toHaveLength(1);
});
it("AMEND-02 edita montagem com catálogo autoritativo e troca somente a baixa do item alterado", async () => {
  const f = await orderFixture();
  await f.repo.transact((s) => {
    const t = s.tenants[company.id];
    t.products[0].priceCents = 4500;
    t.products[0].recipe = [{ ingredientId: "flour", quantity: 200 }];
    t.products[1].priceCents = 9000;
  });
  const next = await f.services.amendOrderItem(
    company.id,
    f.order.id,
    changeInput(f.order, {
      kind: "edit",
      expectedTotalCents: 13000,
      selection: { ...f.order.lines[0].selection!, priceCents: 1, name: "adulterado" },
    }),
  );
  expect(next.lines[0].name).toBe("Calabresa");
  expect(next.lines[0].unitPriceCents).toBe(4500);
  expect(next.lines[1]).toEqual(f.order.lines[1]);
  expect(next.totalCents).toBe(13000);
  expect(next.stockUsage).toEqual([{ ingredientId: "flour", quantity: 550 }]);
  expect(tenantOf(f).restaurant!.inventory[0].stock).toBe(450);
});
it("AMEND-03 altera tamanho, sabores, massa e borda usando o montador completo", async () => {
  const f = await orderFixture();
  await f.services.saveProduct(company.id, pizzaProduct);
  const next = await f.services.amendOrderItem(
    company.id,
    f.order.id,
    changeInput(f.order, {
      kind: "edit",
      selection: pizzaLine,
      expectedTotalCents: 9001,
    }),
  );
  expect(next.lines[0].pizzaSummary).toMatch(/Média.*Mussarela.*Calabresa/);
  expect(next.lines[0].unitPriceCents).toBe(5001);
  expect(next.pizzaUnits).toBe(2);
  expect(tenantOf(f).restaurant!.inventory[0].stock).toBe(850);
});
it("AMEND-04 estoque insuficiente, preço desatualizado e concorrência não fazem alterações parciais", async () => {
  const f = await orderFixture();
  const before = structuredClone(f.repo.getSnapshot());
  await expect(
    f.services.amendOrderItem(
      company.id,
      f.order.id,
      changeInput(f.order, {
        kind: "edit",
        selection: { ...f.order.lines[0].selection!, quantity: 99 },
        expectedTotalCents: 301000,
      }),
    ),
  ).rejects.toThrow(/Estoque/);
  expect(f.repo.getSnapshot()).toEqual(before);
  await expect(
    f.services.amendOrderItem(
      company.id,
      f.order.id,
      changeInput(f.order, { expectedTotalCents: 1 }),
    ),
  ).rejects.toThrow(/valores/);
  expect(f.repo.getSnapshot()).toEqual(before);
  await f.services.amendOrderItem(company.id, f.order.id, changeInput(f.order));
  const after = structuredClone(f.repo.getSnapshot());
  await expect(
    f.services.amendOrderItem(company.id, f.order.id, changeInput(f.order, { requestId: "other" })),
  ).rejects.toThrow(/mudou/);
  expect(f.repo.getSnapshot()).toEqual(after);
});
it("AMEND-05 após preparo permite cancelar com perda mas bloqueia edição e devolução fictícia ao estoque", async () => {
  const f = await orderFixture();
  await f.services.changeOrder(company.id, f.order.id, "Aceito");
  await f.services.changeOrder(company.id, f.order.id, "Preparando");
  const original = tenantOf(f).orders[0];
  await expect(
    f.services.amendOrderItem(
      company.id,
      f.order.id,
      changeInput(original, { kind: "edit", selection: f.order.lines[0].selection }),
    ),
  ).rejects.toThrow(/antes/);
  await expect(
    f.services.amendOrderItem(company.id, f.order.id, changeInput(original)),
  ).rejects.toThrow(/perda/);
  const next = await f.services.amendOrderItem(
    company.id,
    f.order.id,
    changeInput(original, { stockDisposition: "waste" }),
  );
  expect(tenantOf(f).restaurant!.inventory[0].stock).toBe(650);
  expect(next.amendments![0].wasteCostCents).toBe(1000);
  expect(next.stockUsage).toEqual([{ ingredientId: "flour", quantity: 250 }]);
  expect(next.status).toBe("Preparando");
});
it("AMEND-06 pedido pago mantém recebimentos originais e só devolve o excesso explicitamente", async () => {
  const f = await orderFixture();
  await f.services.openCash(company.id, 0);
  await f.services.recordOrderPayment(company.id, f.order.id, {
    requestId: "pay",
    kind: "receipt",
    amountCents: 10000,
    method: "Dinheiro",
  });
  const paid = tenantOf(f).orders[0];
  const next = await f.services.amendOrderItem(company.id, f.order.id, changeInput(paid));
  expect(paidCents(next)).toBe(10000);
  expect(refundableCents(next)).toBe(3000);
  expect(cashSummary(tenantOf(f), tenantOf(f).restaurant!.cashSessions[0]).expectedCents).toBe(
    10000,
  );
  await expect(
    f.services.recordOrderPayment(company.id, next.id, {
      requestId: "over",
      kind: "refund",
      amountCents: 3001,
      method: "Dinheiro",
      reason: "Devolvido",
    }),
  ).rejects.toThrow();
  await f.services.recordOrderPayment(company.id, next.id, {
    requestId: "refund",
    kind: "refund",
    amountCents: 3000,
    method: "Dinheiro",
    reason: "Diferença devolvida",
  });
  const current = tenantOf(f).orders[0];
  expect(paidCents(current)).toBe(7000);
  expect(current.paymentStatus).toBe("Pago");
  expect(dueCents(current)).toBe(0);
  expect(cashSummary(tenantOf(f), tenantOf(f).restaurant!.cashSessions[0]).expectedCents).toBe(
    7000,
  );
  const increased = await f.services.amendOrderItem(
    company.id,
    current.id,
    changeInput(current, {
      requestId: "increase",
      kind: "edit",
      selection: { ...current.lines[0].selection!, quantity: 2 },
      expectedTotalCents: 10000,
    }),
  );
  expect(paidCents(increased)).toBe(7000);
  expect(dueCents(increased)).toBe(3000);
  expect(increased.paymentStatus).toBe("Pendente");
});
it("AMEND-07 converte recebimento legado antes de alterar valor e cancela último item com entrega zerada", async () => {
  const f = await orderFixture();
  await f.repo.transact((s) => {
    const o = s.tenants[company.id].orders[0];
    o.paymentStatus = "Pago";
    o.payments = undefined;
  });
  let next = await f.services.amendOrderItem(
    company.id,
    f.order.id,
    changeInput(tenantOf(f).orders[0], { cancelQuantity: 2, expectedTotalCents: 4000 }),
  );
  expect(paidCents(next)).toBe(10000);
  next = await f.services.amendOrderItem(
    company.id,
    next.id,
    changeInput(next, { requestId: "last", cancelQuantity: 1, expectedTotalCents: 0 }),
  );
  expect(next.status).toBe("Cancelado");
  expect(next.lines).toEqual([]);
  expect(next.deliveryFeeCents).toBe(0);
  expect(refundableCents(next)).toBe(10000);
  expect(tenantOf(f).restaurant!.inventory[0].stock).toBe(1000);
  await f.services.recordOrderPayment(company.id, next.id, {
    requestId: "refund",
    kind: "refund",
    amountCents: 10000,
    method: "Dinheiro",
    reason: "Total devolvido",
  });
  expect(tenantOf(f).orders[0].paymentStatus).toBe("Estornado");
});
it("AMEND-08 cupom usa condições da venda e alteração paga exige permissão financeira", async () => {
  const f = await orderFixture();
  await f.repo.transact((s) => {
    const o = s.tenants[company.id].orders[0];
    o.coupon = {
      id: "coupon",
      code: "FIXO",
      kind: "fixed",
      value: 2000,
      discountCents: 2000,
      minSubtotalCents: 9000,
    };
    o.totalCents = 8000;
  });
  const next = await f.services.amendOrderItem(
    company.id,
    f.order.id,
    changeInput(tenantOf(f).orders[0]),
  );
  expect(next.coupon).toBeNull();
  expect(next.totalCents).toBe(7000);
  await f.services.recordOrderPayment(company.id, next.id, {
    requestId: "pay",
    kind: "receipt",
    amountCents: 1000,
    method: "Dinheiro",
  });
  await f.auth.startDemo("attendant");
  const before = structuredClone(f.repo.getSnapshot());
  await expect(
    f.services.amendOrderItem(
      company.id,
      next.id,
      changeInput(tenantOf(f).orders[0], { requestId: "attendant", expectedTotalCents: 4000 }),
    ),
  ).rejects.toThrow(/permissão|perfil/);
  expect(f.repo.getSnapshot()).toEqual(before);
  await f.auth.signOut();
  await expect(f.services.amendOrderItem(company.id, next.id, changeInput(next))).rejects.toThrow();
});
it("AMEND-09 histórico privado não vaza por projeção pública e legado sem baixa por item é preservado", async () => {
  const f = await orderFixture();
  const next = await f.services.amendOrderItem(company.id, f.order.id, changeInput(f.order));
  const publicView = publicOrder(next);
  expect(publicView).not.toHaveProperty("amendments");
  expect(publicView.lines[0]).not.toHaveProperty("stockUsage");
  expect(
    JSON.stringify(projectState(f.repo.getSnapshot(), null, next.trackingToken)),
  ).not.toContain("Farinha");
  await f.repo.transact((s) => {
    delete s.tenants[company.id].orders[0].lines[0].stockUsage;
  });
  const before = structuredClone(f.repo.getSnapshot());
  await expect(
    f.services.amendOrderItem(
      company.id,
      next.id,
      changeInput(tenantOf(f).orders[0], { requestId: "legacy", expectedTotalCents: 4000 }),
    ),
  ).rejects.toThrow(/antigo/);
  expect(f.repo.getSnapshot()).toEqual(before);
});
it("AMEND-10 agenda não conta o próprio pedido duas vezes nem permite aumentar além do limite", async () => {
  const f = await orderFixture();
  await f.repo.transact((s) => {
    const t = s.tenants[company.id];
    t.restaurant!.scheduling = {
      enabled: true,
      leadMinutes: 60,
      slotMinutes: 30,
      capacity: 1,
      days: 7,
      pizzaCapacity: 3,
    };
    t.orders[0].scheduledAt = new Date().toISOString();
  });
  const o = tenantOf(f).orders[0];
  const draft = {
    kind: "edit" as const,
    lineIndex: 0,
    selection: o.lines[0].selection,
    stockDisposition: "return" as const,
  };
  expect(planOrderItemChange(tenantOf(f), o, draft).pizzaUnits).toBe(3);
  expect(() =>
    planOrderItemChange(tenantOf(f), o, {
      ...draft,
      selection: { ...o.lines[0].selection!, quantity: 3 },
    }),
  ).toThrow(/capacidade/);
});
it("COMBO-DRAFT-01 transforma alternativas em todos incluídos sem perder quantidade, tamanho ou acréscimo", () => {
  let counter = 0;
  const groups = [
    {
      id: "g",
      name: "Pizzas",
      quantity: 2,
      options: [
        { productId: "a", sizeId: "large", surchargeCents: 500 },
        { productId: "b", sizeId: "medium", surchargeCents: 0 },
      ],
    },
  ];
  const next = changeComboGroupMode(
    groups,
    "g",
    "included",
    [
      { id: "a", name: "Calabresa" },
      { id: "b", name: "Mussarela" },
    ],
    () => `new-${counter++}`,
  );
  expect(next.map((g) => [g.name, g.quantity, g.mode])).toEqual([
    ["Calabresa", 2, "included"],
    ["Mussarela", 2, "included"],
  ]);
  expect(next.map((g) => g.options[0])).toEqual(groups[0].options);
  expect(next[0].id).toBe("g");
  expect(groups[0].options).toHaveLength(2);
  expect(comboSchema.safeParse({ groups: next }).success).toBe(true);
  expect(comboSchema.safeParse({ groups: [{ ...groups[0], mode: "included" }] }).success).toBe(
    false,
  );
});
it("AMEND-11 perda de um item não volta ao estoque quando o restante do pedido é cancelado", async () => {
  const f = await orderFixture();
  const changed = await f.services.amendOrderItem(
    company.id,
    f.order.id,
    changeInput(f.order, { stockDisposition: "waste" }),
  );
  expect(tenantOf(f).restaurant!.inventory[0].stock).toBe(650);
  await f.services.changeOrder(company.id, changed.id, "Cancelado", "Restante cancelado");
  expect(tenantOf(f).restaurant!.inventory[0].stock).toBe(900);
});
it("AMEND-12 combo altera quantidade e cancela como conjunto, mantendo baixa e capacidade por pizza", async () => {
  const f = await orderFixture();
  await f.services.saveProduct(company.id, {
    ...tenantOf(f).products[0],
    recipe: [],
    id: "combo",
    name: "Duas pizzas",
    priceCents: 5000,
    combo: {
      groups: [
        {
          id: "a",
          name: "Calabresa",
          mode: "included",
          quantity: 1,
          options: [{ productId: "a", surchargeCents: 0 }],
        },
        {
          id: "b",
          name: "Mussarela",
          mode: "included",
          quantity: 1,
          options: [{ productId: "b", surchargeCents: 0 }],
        },
      ],
    },
  });
  const order = await f.services.createStaffOrder(company.id, {
    requestId: "combo",
    channel: "counter",
    lines: [
      {
        key: "combo",
        productId: "combo",
        quantity: 2,
        extraIds: [],
        removedIngredients: [],
        notes: "",
        comboChoices: [
          { groupId: "a", productId: "a" },
          { groupId: "b", productId: "b" },
        ],
      },
    ],
    checkout: { ...checkout, fulfillment: "pickup", expectedTotalCents: 10000, couponCode: "" },
  });
  expect(order.pizzaUnits).toBe(4);
  const changed = await f.services.amendOrderItem(
    company.id,
    order.id,
    changeInput(order, {
      kind: "edit",
      selection: { ...order.lines[0].selection!, quantity: 1 },
      expectedTotalCents: 5000,
    }),
  );
  expect(changed.pizzaUnits).toBe(2);
  expect(tenantOf(f).restaurant!.inventory[0].stock).toBe(400);
  const canceled = await f.services.amendOrderItem(
    company.id,
    changed.id,
    changeInput(changed, { requestId: "cancel-combo", expectedTotalCents: 0 }),
  );
  expect(canceled.status).toBe("Cancelado");
  expect(canceled.pizzaUnits).toBe(0);
  expect(tenantOf(f).restaurant!.inventory[0].stock).toBe(650);
});
it("AMEND-13 cancelar produto removido usa a venda histórica; outra loja não autoriza alteração", async () => {
  const f = await orderFixture();
  const before = structuredClone(f.repo.getSnapshot());
  await expect(
    f.services.amendOrderItem("outra-loja", f.order.id, changeInput(f.order)),
  ).rejects.toThrow();
  expect(f.repo.getSnapshot()).toEqual(before);
  await f.repo.transact((s) => {
    s.tenants[company.id].products = s.tenants[company.id].products.filter((p) => p.id !== "a");
  });
  const next = await f.services.amendOrderItem(company.id, f.order.id, changeInput(f.order));
  expect(next.totalCents).toBe(7000);
  expect(tenantOf(f).restaurant!.inventory[0].stock).toBe(750);
});
it("AMEND-14 desconto percentual segue a venda original sem depender de cupom ainda cadastrado", async () => {
  const f = await orderFixture();
  await f.repo.transact((s) => {
    const o = s.tenants[company.id].orders[0];
    o.coupon = {
      id: "antigo",
      code: "VINTE",
      kind: "percent",
      value: 20,
      discountCents: 2000,
      minSubtotalCents: 0,
    };
    o.totalCents = 8000;
  });
  const next = await f.services.amendOrderItem(
    company.id,
    f.order.id,
    changeInput(tenantOf(f).orders[0], { expectedTotalCents: 5600 }),
  );
  expect(next.coupon!.discountCents).toBe(1400);
  expect(next.amendments![0].beforeDiscountCents).toBe(2000);
  expect(next.amendments![0].afterDiscountCents).toBe(1400);
});
it("AMEND-15 soma ingrediente compartilhado no combo e não permite consumir estoque por partes isoladas", async () => {
  const f = await orderFixture();
  await f.services.saveProduct(company.id, {
    ...tenantOf(f).products[0],
    recipe: [],
    id: "combo",
    name: "Duas pizzas",
    priceCents: 5000,
    combo: {
      groups: [
        {
          id: "a",
          name: "Calabresa",
          quantity: 1,
          options: [{ productId: "a", surchargeCents: 0 }],
        },
        {
          id: "b",
          name: "Mussarela",
          quantity: 1,
          options: [{ productId: "b", surchargeCents: 0 }],
        },
      ],
    },
  });
  const line = {
    key: "combo",
    productId: "combo",
    quantity: 2,
    extraIds: [],
    removedIngredients: [],
    notes: "",
    comboChoices: [
      { groupId: "a", productId: "a" },
      { groupId: "b", productId: "b" },
    ],
  };
  const order = await f.services.createStaffOrder(company.id, {
    requestId: "combo",
    channel: "counter",
    lines: [line],
    checkout: { ...checkout, fulfillment: "pickup", expectedTotalCents: 10000, couponCode: "" },
  });
  expect(order.lines[0].stockUsage).toEqual([{ ingredientId: "flour", quantity: 500 }]);
  const next = await f.services.amendOrderItem(
    company.id,
    order.id,
    changeInput(order, { expectedTotalCents: 5000 }),
  );
  expect(next.lines[0].stockUsage).toEqual([{ ingredientId: "flour", quantity: 250 }]);
  expect(tenantOf(f).restaurant!.inventory[0].stock).toBe(400);
  const before = structuredClone(f.repo.getSnapshot());
  await expect(
    f.services.amendOrderItem(
      company.id,
      next.id,
      changeInput(next, {
        requestId: "oversell",
        kind: "edit",
        stockDisposition: "waste",
        selection: { ...line, quantity: 2 },
        expectedTotalCents: 10000,
      }),
    ),
  ).rejects.toThrow(/Estoque/);
  expect(f.repo.getSnapshot()).toEqual(before);
});
