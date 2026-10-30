import { it, expect, vi, afterEach } from "vitest";
import { fixture, company, product, checkout } from "./fixtures.ts";
import { pizzaProduct, pizzaLine, pizzaConfig } from "./pizza-fixture.ts";
import { uuid } from "../src/core/domain.ts";
import { projectState, publicOrder } from "../server/projection.mjs";
import { comboStartingPrice, lineRecipe, recipeCost } from "../src/core/restaurant.ts";
import { minimumPizzaPrice, pricePizza } from "../src/core/pizza.ts";
import { restaurantSchema } from "../src/core/restaurantModel.ts";
afterEach(() => vi.useRealTimers());
it("REST-14 projeção pública e atendente não expõem receitas, estoque, caixa ou custos", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, {
    ...pizzaProduct,
    recipe: [{ ingredientId: "secret", quantity: 5 }],
    pizza: {
      ...pizzaConfig,
      flavors: pizzaConfig.flavors.map((fl) => ({
        ...fl,
        recipeBySize: { medium: [{ ingredientId: "secret", quantity: 25 }] },
        extras: [
          {
            id: "extra",
            name: "Extra",
            available: true,
            priceCents: 100,
            recipe: [{ ingredientId: "secret", quantity: 4 }],
          },
        ],
      })),
      doughs: pizzaConfig.doughs.map((d) => ({
        ...d,
        recipe: [{ ingredientId: "secret", quantity: 80 }],
      })),
    },
  });
  await f.repo.transact((s) => {
    s.tenants[company.id].restaurant = restaurantSchema.parse({
      inventory: [
        {
          id: "secret",
          name: "Custo privado",
          unit: "g",
          stock: 1000,
          costPerUnitCents: 100,
          minimum: 0,
        },
      ],
      cashSessions: [
        {
          id: "cash",
          openedAt: new Date().toISOString(),
          openedBy: "Pessoa",
          openingCents: 7000,
          movements: [],
        },
      ],
    });
  });
  const state = f.repo.getSnapshot(),
    view = projectState(state, null).tenants[company.id];
  expect(JSON.stringify(view)).not.toContain("Custo privado");
  expect(JSON.stringify(view)).not.toContain("recipeBySize");
  expect(view.restaurant.inventory).toBeUndefined();
  expect(view.products.find((p: { id: string }) => p.id === "pizza").recipe).toBeUndefined();
  const attendant = projectState(state, { role: "attendant", storeId: company.id }).tenants[
    company.id
  ];
  expect(attendant.restaurant.cashSessions).toBeUndefined();
  expect(attendant.restaurant.tables).toEqual([]);
  expect(
    projectState(state, { role: "owner", storeId: company.id }).tenants[company.id].restaurant
      .inventory,
  ).toHaveLength(1);
  const { stockUsage, ...rest } = publicOrder({
    requestId: "r",
    stockUsage: [{ ingredientId: "secret", quantity: 200 }],
    lines: [],
    history: [],
  });
  expect(stockUsage).toBeUndefined();
  expect(rest.lines).toEqual([]);
});
it("REST-15 combo baixa quantidades dos componentes e embalagem, com custo integral", async () => {
  const f = await fixture();
  await f.services.saveInventoryItem(company.id, {
    id: "ing",
    name: "Ingrediente",
    unit: "g",
    stock: 100,
    costPerUnitCents: 2,
    minimum: 5,
  });
  await f.services.saveRecipe(company.id, product.id, { kind: "product" }, [
    { ingredientId: "ing", quantity: 5 },
  ]);
  const combo = {
    ...product,
    id: "combo",
    name: "Combo",
    extras: [],
    recipe: [{ ingredientId: "ing", quantity: 1 }],
    combo: {
      groups: [
        {
          id: "g",
          name: "Principal",
          quantity: 2,
          options: [{ productId: product.id, surchargeCents: 300 }],
        },
      ],
    },
  };
  await f.services.saveProduct(company.id, combo);
  const line = {
      key: uuid(),
      productId: combo.id,
      quantity: 3,
      extraIds: [],
      removedIngredients: [],
      notes: "",
      comboChoices: [{ groupId: "g", productId: product.id }],
    },
    t = f.repo.getSnapshot().tenants[company.id];
  expect(lineRecipe(line, t.products).reduce((sum, r) => sum + r.quantity, 0)).toBe(33);
  expect(recipeCost(line, t.products, t.restaurant?.inventory)).toBe(22);
  expect(
    comboStartingPrice(
      t.products.find((p) => p.id === "combo")!,
      t.products,
    ),
  ).toBe(3290);
});
it("REST-16 ingredientes editados nos dois editores não são revertidos pela sincronização", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, pizzaProduct);
  await f.services.linkPizzaCatalog(company.id, pizzaProduct.id);
  let ps = f.repo.getSnapshot().tenants[company.id].products,
    source = structuredClone(ps.find((p) => p.name === "Mussarela")!);
  source.pizza!.flavors[0].ingredients = ["Cebola"];
  source.pizza!.flavors[0].allergens = ["Leite"];
  await f.services.saveProduct(company.id, source);
  ps = f.repo.getSnapshot().tenants[company.id].products;
  expect(ps.find((p) => p.id === "pizza")!.pizza!.flavors[0].ingredients).toEqual(["Cebola"]);
  source = structuredClone(ps.find((p) => p.id === source.id)!);
  source.ingredients = ["Tomate"];
  await f.services.saveProduct(company.id, source);
  ps = f.repo.getSnapshot().tenants[company.id].products;
  expect(ps.find((p) => p.id === "pizza")!.pizza!.flavors[0].ingredients).toEqual(["Tomate"]);
  await expect(f.services.removeProduct(company.id, source.id)).rejects.toThrow(/vinculado/);
  await f.services.saveInventoryItem(company.id, {
    id: "i",
    name: "Farinha",
    unit: "g",
    stock: 1000,
    costPerUnitCents: 1,
    minimum: 0,
  });
  await f.services.saveRecipe(company.id, source.id, { kind: "dough", id: "classic" }, [
    { ingredientId: "i", quantity: 100 },
  ]);
  expect(
    f.repo.getSnapshot().tenants[company.id].products.find((p) => p.id === "pizza")!.pizza!
      .doughs[0].recipe,
  ).toEqual([{ ingredientId: "i", quantity: 100 }]);
});
it("REST-17 fechamento congelado e recebimento sem caixa não vazam para outro turno", async () => {
  const f = await fixture();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T20:00:00Z"));
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
  await f.services.changePayment(company.id, o.id, "Pago");
  await f.services.openCash(company.id, 1000);
  await f.services.closeCash(company.id, 1000);
  await f.services.openCash(company.id, 0);
  expect(f.repo.getSnapshot().tenants[company.id].restaurant!.cashSessions[0].expectedCents).toBe(
    1000,
  );
  await f.services.changeOrder(company.id, o.id, "Cancelado", "Cliente desistiu");
  await f.services.changePayment(company.id, o.id, "Estornado", "Dinheiro devolvido");
  await f.services.closeCash(company.id, 0);
  expect(f.repo.getSnapshot().tenants[company.id].restaurant!.cashSessions[1].expectedCents).toBe(
    -2990,
  );
  expect(f.repo.getSnapshot().tenants[company.id].restaurant!.cashSessions[0].expectedCents).toBe(
    1000,
  );
});
it("REST-18 mínimo anunciado usa proporção possível mais barata e agendamento persiste no pedido", async () => {
  const c = structuredClone(pizzaConfig);
  c.allowUnequalParts = true;
  c.pricing = "average";
  c.sizes = c.sizes.filter((s) => s.id === "large");
  c.sizes[0].flavorCountPricing = { mode: "extra", prices: { "1": 5000 } };
  const expected = pricePizza(c, {
    sizeId: "large",
    flavorIds: ["cheese", "pepper"],
    flavorCount: 2,
    doughId: "classic",
    edgeId: "plain",
    portions: [3, 1],
  }).priceCents;
  expect(minimumPizzaPrice(c)).toBe(expected);
  const f = await fixture();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T19:00:00Z"));
  await f.services.saveScheduling(company.id, {
    enabled: true,
    leadMinutes: 60,
    slotMinutes: 30,
    capacity: 1,
    days: 7,
  });
  await f.services.addToCart(company.id, { ...pizzaLine, productId: product.id, pizza: undefined });
  const t = f.repo.getSnapshot().tenants[company.id],
    o = await f.services.checkout(company.id, t.cart.requestId, {
      ...checkout,
      scheduledAt: "2026-10-28T20:00:00Z",
      expectedTotalCents: 3490,
    });
  expect(o.scheduledAt).toBe("2026-10-28T20:00:00.000Z");
});
