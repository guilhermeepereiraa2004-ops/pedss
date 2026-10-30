import { fixture, company, product, checkout } from "./fixtures.ts";
import { restaurantSchema } from "../src/core/restaurantModel.ts";
export async function orderFixture() {
  const f = await fixture();
  await f.repo.transact((s) => {
    const t = s.tenants[company.id];
    t.restaurant = restaurantSchema.parse({
      inventory: [
        { id: "flour", name: "Farinha", unit: "g", stock: 1000, minimum: 0, costPerUnitCents: 10 },
      ],
    });
    t.products = [
      {
        ...product,
        id: "a",
        name: "Calabresa",
        category: "Pizza",
        priceCents: 3000,
        extras: [],
        recipe: [{ ingredientId: "flour", quantity: 100 }],
      },
      {
        ...product,
        id: "b",
        name: "Mussarela",
        category: "Pizza",
        priceCents: 4000,
        extras: [],
        recipe: [{ ingredientId: "flour", quantity: 150 }],
      },
    ];
  });
  const lines = [
    { key: "a-line", productId: "a", quantity: 2, extraIds: [], removedIngredients: [], notes: "" },
    { key: "b-line", productId: "b", quantity: 1, extraIds: [], removedIngredients: [], notes: "" },
  ];
  const order = await f.services.createStaffOrder(company.id, {
    requestId: "initial",
    channel: "counter",
    lines,
    checkout: { ...checkout, fulfillment: "pickup", expectedTotalCents: 10000, couponCode: "" },
  });
  return { ...f, order };
}
export const tenantOf = (f: Awaited<ReturnType<typeof orderFixture>>) =>
  f.repo.getSnapshot().tenants[company.id];
export function changeInput(
  order: Awaited<ReturnType<typeof orderFixture>>["order"],
  patch: Record<string, unknown> = {},
) {
  return {
    requestId: "change",
    expectedUpdatedAt: order.updatedAt,
    expectedTotalCents: 7000,
    kind: "cancel",
    lineIndex: 0,
    cancelQuantity: 1,
    stockDisposition: "return",
    reason: "Cliente pediu o ajuste",
    ...patch,
  };
}
