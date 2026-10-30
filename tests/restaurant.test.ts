import { it, expect, vi, afterEach } from "vitest";
import { fixture, company, checkout, product } from "./fixtures.ts";
import { pizzaProduct, pizzaConfig, pizzaLine, pizzaSelection } from "./pizza-fixture.ts";
import { pricePizza, minimumPizzaPrice } from "../src/core/pizza.ts";
import { priceLine, uuid } from "../src/core/domain.ts";
import { recipeCost, validateSchedule, cashSummary } from "../src/core/restaurant.ts";
import { restaurantSchema } from "../src/core/restaurantModel.ts";
import { productSchema, pizzaSelectionSchema } from "../src/core/model.ts";
afterEach(() => vi.useRealTimers());
it("REST-01 vincula o catálogo sem apagar fotos e sincroniza preços nos dois sentidos", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, pizzaProduct);
  await f.services.saveProduct(company.id, {
    ...product,
    id: "cheese-product",
    name: "Mussarela",
    category: "Pizza",
    description: "Receita própria",
    image: "/own.png",
  });
  await f.services.linkPizzaCatalog(company.id, pizzaProduct.id);
  let ps = f.repo.getSnapshot().tenants[company.id].products;
  expect(ps.find((p) => p.id === "cheese-product")?.image).toBe("/own.png");
  let source = structuredClone(ps.find((p) => p.id === "cheese-product")!);
  expect(source.pizza?.flavors).toHaveLength(1);
  source.pizza!.flavors[0].prices.large = 4590;
  await f.services.saveProduct(company.id, source);
  ps = f.repo.getSnapshot().tenants[company.id].products;
  expect(ps.find((p) => p.id === "pizza")?.pizza?.flavors[0].prices.large).toBe(4590);
  const builder = structuredClone(ps.find((p) => p.id === "pizza")!);
  builder.pizza!.flavors[0].prices.large = 4990;
  await f.services.saveProduct(company.id, builder);
  expect(
    f.repo.getSnapshot().tenants[company.id].products.find((p) => p.id === source.id)?.pizza
      ?.flavors[0].prices.large,
  ).toBe(4990);
  await f.services.linkPizzaCatalog(company.id, pizzaProduct.id);
  expect(f.repo.getSnapshot().tenants[company.id].products).toHaveLength(6);
});
it("REST-02 calcula partes desiguais, adicional por sabor e preserva resumo", () => {
  const c = structuredClone(pizzaConfig);
  c.pricing = "average";
  c.allowUnequalParts = true;
  c.flavors[0].ingredients = ["Cebola"];
  c.flavors[0].extras = [{ id: "cat", name: "Requeijão", priceCents: 500, available: true }];
  const s = {
    ...pizzaSelection,
    sizeId: "large",
    flavorIds: ["cheese", "pepper", "chicken"],
    flavorCount: 3,
    portions: [2, 1, 1],
    customizations: [{ flavorId: "cheese", extraIds: ["cat"], removedIngredients: ["Cebola"] }],
  };
  expect(pricePizza(c, s).priceCents).toBe(6250); // 4750 weighted + 1000 dough/edge + 500 extra
  expect(pricePizza(c, s).summary).toContain("2/4 Mussarela");
  expect(pricePizza(c, s).summary).toContain("sem Cebola");
  expect(() => pricePizza(c, { ...s, portions: [1, 1, 1] })).toThrow(/4 quartos/);
  expect(() =>
    pricePizza(c, {
      ...s,
      customizations: [{ flavorId: "cheese", extraIds: ["forged"], removedIngredients: [] }],
    }),
  ).toThrow(/indisponível/);
  expect(() => pricePizza({ ...c, allowUnequalParts: false }, s)).toThrow(/proporções/);
  expect(pizzaSelectionSchema.safeParse({ ...s, portions: [-1, 2, 3] }).success).toBe(false);
});
it("REST-03 valida doces/salgadas e compatibilidade, mínimo considera uma opção válida", () => {
  const c = structuredClone(pizzaConfig);
  c.allowMixedKinds = false;
  c.flavors[0].kind = "sweet";
  expect(() => pricePizza(c, pizzaSelection)).toThrow(/doces e salgados/);
  c.allowMixedKinds = true;
  c.edges[1].allowedFlavorKinds = ["savory"];
  expect(() => pricePizza(c, pizzaSelection)).toThrow(/compatível/);
  c.doughs[0].allowedSizeIds = ["large"];
  expect(minimumPizzaPrice(c)).toBe(3200);
});
async function withInventory() {
  const f = await fixture();
  await f.services.saveProduct(company.id, pizzaProduct);
  await f.services.saveInventoryItem(company.id, {
    id: "flour",
    name: "Farinha",
    unit: "g",
    stock: 1000,
    costPerUnitCents: 1,
    minimum: 100,
  });
  await f.services.saveRecipe(company.id, "pizza", { kind: "dough", id: "thin" }, [
    { ingredientId: "flour", quantity: 200 },
  ]);
  return f;
}
it("REST-04 baixa estoque atomicamente, evita duplicidade e devolve cancelado antes do preparo", async () => {
  const f = await withInventory();
  await f.services.addToCart(company.id, pizzaLine);
  const t = f.repo.getSnapshot().tenants[company.id],
    req = t.cart.requestId;
  const input = {
    ...checkout,
    expectedTotalCents: priceLine(pizzaLine, t.products).totalCents + 500,
  };
  const o = await f.services.checkout(company.id, req, input);
  await f.services.checkout(company.id, req, input);
  expect(f.repo.getSnapshot().tenants[company.id].restaurant!.inventory[0].stock).toBe(800);
  await f.services.changeOrder(company.id, o.id, "Cancelado", "Cliente desistiu");
  expect(f.repo.getSnapshot().tenants[company.id].restaurant!.inventory[0].stock).toBe(1000);
  await f.services.adjustStock(company.id, "flour", -900, "Perda");
  await f.services.addToCart(company.id, pizzaLine);
  const t2 = f.repo.getSnapshot().tenants[company.id];
  await expect(f.services.checkout(company.id, t2.cart.requestId, input)).rejects.toThrow(
    /Estoque insuficiente/,
  );
  expect(f.repo.getSnapshot().tenants[company.id].cart.lines).toHaveLength(1);
});
it("REST-05 cancelamento depois de preparar mantém consumo; custo só aparece com ficha completa", async () => {
  const f = await withInventory();
  let t = f.repo.getSnapshot().tenants[company.id];
  expect(recipeCost(pizzaLine, t.products, t.restaurant?.inventory)).toBeNull();
  for (const id of ["cheese", "pepper"])
    await f.services.saveRecipe(company.id, "pizza", { kind: "flavor", id, sizeId: "medium" }, [
      { ingredientId: "flour", quantity: 20 },
    ]);
  await f.services.saveRecipe(company.id, "pizza", { kind: "edge", id: "cream" }, []);
  t = f.repo.getSnapshot().tenants[company.id];
  expect(recipeCost(pizzaLine, t.products, t.restaurant?.inventory)).toBe(220);
  await f.services.addToCart(company.id, pizzaLine);
  t = f.repo.getSnapshot().tenants[company.id];
  const o = await f.services.checkout(company.id, t.cart.requestId, {
    ...checkout,
    expectedTotalCents: 5501,
  });
  await f.services.changeOrder(company.id, o.id, "Aceito");
  await f.services.changeOrder(company.id, o.id, "Preparando");
  await f.services.changeOrder(company.id, o.id, "Cancelado", "Perda no preparo");
  expect(f.repo.getSnapshot().tenants[company.id].restaurant!.inventory[0].stock).toBe(780);
  expect(o.lines[0].unitCostCents).toBe(220);
});
it("REST-06 permissões e unidades protegem estoque/caixa de atendentes", async () => {
  const f = await fixture("attendant");
  await expect(f.services.openCash(company.id, 0)).rejects.toThrow(/perfil/);
  await expect(
    f.services.saveInventoryItem(company.id, {
      id: "x",
      name: "X",
      unit: "g",
      stock: 1,
      costPerUnitCents: 1,
      minimum: 0,
    }),
  ).rejects.toThrow(/perfil/);
  await expect(
    f.services.saveScheduling(company.id, {
      enabled: true,
      leadMinutes: 60,
      slotMinutes: 30,
      capacity: 2,
      days: 7,
    }),
  ).rejects.toThrow(/perfil/);
  const owner = await withInventory();
  await expect(
    owner.services.saveInventoryItem(company.id, {
      id: "flour",
      name: "Farinha",
      unit: "un",
      stock: 1000,
      costPerUnitCents: 1,
      minimum: 100,
    }),
  ).rejects.toThrow(/imutável/);
});
it("REST-07 combo valida escolhas, preços, tamanho e estoque dos componentes", async () => {
  const f = await fixture();
  const combo = productSchema.parse({
    ...product,
    id: "combo",
    name: "Combo",
    priceCents: 5000,
    extras: [],
    ingredients: [],
    combo: {
      groups: [
        {
          id: "food",
          name: "Lanche",
          quantity: 2,
          options: [{ productId: product.id, surchargeCents: 300 }],
        },
      ],
    },
  });
  await f.services.saveProduct(company.id, combo);
  const line = {
    key: uuid(),
    productId: combo.id,
    quantity: 2,
    extraIds: [],
    removedIngredients: [],
    notes: "",
    comboChoices: [{ groupId: "food", productId: product.id }],
  };
  expect(priceLine(line, f.repo.getSnapshot().tenants[company.id].products).totalCents).toBe(10600);
  expect(priceLine(line, f.repo.getSnapshot().tenants[company.id].products).pizzaSummary).toContain(
    "2 × Nome oficial",
  );
  expect(() =>
    priceLine({ ...line, comboChoices: [{ groupId: "food", productId: "forged" }] }, [
      combo,
      product,
    ]),
  ).toThrow(/indisponível/);
  await expect(
    f.services.saveProduct(company.id, {
      ...combo,
      combo: {
        groups: [
          {
            id: "x",
            name: "X",
            quantity: 1,
            options: [{ productId: combo.id, surchargeCents: 0 }],
          },
        ],
      },
    }),
  ).rejects.toThrow(/indisponível/);
  expect(() => priceLine({ ...line, comboChoices: [] }, [combo, product])).toThrow(/cada grupo/);
});
it("REST-08 balcão idempotente não altera sacola pública nem infere pagamento", async () => {
  const f = await fixture("attendant");
  await f.services.addToCart(company.id, {
    productId: product.id,
    quantity: 1,
    extraIds: [],
    removedIngredients: [],
    notes: "Cliente no site",
  });
  const input = {
    requestId: uuid(),
    channel: "phone",
    lines: [
      {
        key: uuid(),
        productId: product.id,
        quantity: 1,
        extraIds: [],
        removedIngredients: [],
        notes: "",
      },
    ],
    checkout: { ...checkout, expectedTotalCents: 3490 },
  };
  const o = await f.services.createStaffOrder(company.id, input);
  const again = await f.services.createStaffOrder(company.id, input);
  expect(again.id).toBe(o.id);
  expect(o.paymentStatus).toBe("Pendente");
  expect(o.channel).toBe("phone");
  expect(f.repo.getSnapshot().tenants[company.id].cart.lines[0].notes).toBe("Cliente no site");
  await expect(
    f.services.createStaffOrder(company.id, {
      ...input,
      requestId: uuid(),
      checkout: { ...input.checkout, expectedTotalCents: 1 },
    }),
  ).rejects.toThrow(/valores/);
});
it("REST-09 caixa separa recebimentos, sangrias e estornos e preserva fechamento", async () => {
  const f = await fixture();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T20:00:00Z"));
  await f.services.openCash(company.id, 10000);
  await expect(f.services.openCash(company.id, 0)).rejects.toThrow(/aberto/);
  const o = await f.services.createStaffOrder(company.id, {
    requestId: uuid(),
    channel: "counter",
    lines: [
      {
        key: uuid(),
        productId: product.id,
        quantity: 1,
        extraIds: [],
        removedIngredients: [],
        notes: "",
      },
    ],
    checkout: { ...checkout, fulfillment: "pickup", expectedTotalCents: 2990 },
  });
  vi.advanceTimersByTime(1000);
  await f.services.changePayment(company.id, o.id, "Pago");
  await f.services.moveCash(company.id, {
    kind: "withdrawal",
    amountCents: 1000,
    reason: "Pagamento de compra",
  });
  let t = f.repo.getSnapshot().tenants[company.id];
  expect(cashSummary(t, t.restaurant!.cashSessions[0]).expectedCents).toBe(11990);
  await f.services.changeOrder(company.id, o.id, "Cancelado", "Desistiu");
  await f.services.changePayment(company.id, o.id, "Estornado", "Dinheiro devolvido");
  await f.services.closeCash(company.id, 9000);
  t = f.repo.getSnapshot().tenants[company.id];
  expect(t.restaurant!.cashSessions[0].expectedCents).toBe(9000);
  expect(t.restaurant!.cashSessions[0].receipts?.Dinheiro).toBe(0);
  await expect(
    f.services.moveCash(company.id, { kind: "supply", amountCents: 100, reason: "Troco" }),
  ).rejects.toThrow(/Abra o caixa/);
});
it("REST-10 mesas não duplicam comandas e exigem conclusão/pagamento para fechar", async () => {
  const f = await fixture();
  await f.services.saveTable(company.id, { id: "table", name: "Mesa 1", enabled: true });
  const tab = await f.services.openTab(company.id, "table", "Pessoa");
  await expect(f.services.openTab(company.id, "table", "")).rejects.toThrow(/ocupada/);
  const o = await f.services.createStaffOrder(company.id, {
    requestId: uuid(),
    channel: "table",
    tabId: tab.id,
    lines: [
      {
        key: uuid(),
        productId: product.id,
        quantity: 1,
        extraIds: [],
        removedIngredients: [],
        notes: "",
      },
    ],
    checkout: { ...checkout, fulfillment: "pickup", expectedTotalCents: 2990 },
  });
  expect(o.tableName).toBe("Mesa 1");
  await expect(f.services.closeTab(company.id, tab.id)).rejects.toThrow(/Conclua/);
  for (const status of ["Aceito", "Preparando", "Pronto para retirada", "Entregue"] as const)
    await f.services.changeOrder(company.id, o.id, status);
  await f.services.changePayment(company.id, o.id, "Pago");
  await f.services.closeTab(company.id, tab.id);
  expect(f.repo.getSnapshot().tenants[company.id].restaurant!.tabs[0].closedAt).toBeTruthy();
});
it("REST-11 agenda aplica janela, horário, intervalo e capacidade liberada no cancelamento", async () => {
  const f = await fixture();
  await f.services.saveScheduling(company.id, {
    enabled: true,
    leadMinutes: 60,
    slotMinutes: 30,
    capacity: 1,
    days: 7,
  });
  const t = structuredClone(f.repo.getSnapshot().tenants[company.id]),
    now = new Date("2026-10-28T19:00:00Z");
  expect(() => validateSchedule(t, "2026-10-28T19:30:00Z", now)).toThrow(/período/);
  expect(() => validateSchedule(t, "2026-10-28T20:05:00Z", now)).toThrow(/intervalos/);
  expect(() => validateSchedule(t, "2026-10-28T20:00:00Z", now)).not.toThrow();
  t.settings.scheduleEnabled = true;
  expect(() => validateSchedule(t, "2026-10-28T20:00:00Z", now)).toThrow(/atendimento/);
  t.settings.scheduleEnabled = false;
  t.orders.push({
    scheduledAt: "2026-10-28T20:00:00.000Z",
    status: "Pendente",
  } as (typeof t.orders)[number]);
  expect(() => validateSchedule(t, "2026-10-28T20:00:00Z", now)).toThrow(/lotado/);
  t.orders[0].status = "Cancelado";
  expect(() => validateSchedule(t, "2026-10-28T20:00:00Z", now)).not.toThrow();
});
it("REST-12 repetir revalida preço/estoque/disponibilidade e mantém seleção histórica", async () => {
  const f = await fixture();
  await f.services.addToCart(company.id, {
    productId: product.id,
    quantity: 1,
    extraIds: [],
    removedIngredients: [],
    notes: "Sem pressa",
  });
  const t = f.repo.getSnapshot().tenants[company.id],
    o = await f.services.checkout(company.id, t.cart.requestId, {
      ...checkout,
      expectedTotalCents: 3490,
    });
  await f.services.saveProduct(company.id, { ...product, priceCents: 3990 });
  await f.services.repeatOrder(company.id, o.trackingToken);
  let current = f.repo.getSnapshot().tenants[company.id];
  expect(priceLine(current.cart.lines[0], current.products).totalCents).toBe(3990);
  expect(current.orders[0].lines[0].unitPriceCents).toBe(2990);
  await f.services.saveProduct(company.id, { ...product, status: "Indisponível" });
  await expect(f.services.repeatOrder(company.id, o.trackingToken)).rejects.toThrow(/indisponível/);
  await expect(f.services.repeatOrder(company.id, "forged")).rejects.toThrow(/não encontrado/);
});
it("REST-13 legado não exige novos campos e estoque sem ficha não é inventado", () => {
  const r = restaurantSchema.parse({});
  expect(r.inventory).toEqual([]);
  expect(r.scheduling.enabled).toBe(false);
  expect(priceLine({ ...pizzaLine }, [pizzaProduct]).unitCostCents).toBeNull();
});
