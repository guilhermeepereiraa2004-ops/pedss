import { expect, it } from "vitest";
import { profitability } from "../src/core/profitability.ts";
import { fixture, company, product, cartLine, checkout } from "./fixtures.ts";
import type { Order } from "../src/core/model.ts";

export async function marginOrder(): Promise<Order> {
  const f = await fixture();
  await f.services.saveProduct(company.id, {
    ...product,
    costCents: 1000,
    extras: product.extras.map((extra) => ({ ...extra, costCents: 100 })),
  });
  await f.services.addToCart(company.id, cartLine);
  const order = await f.services.checkout(
    company.id,
    f.repo.getSnapshot().tenants[company.id].cart.requestId,
    checkout,
  );
  return { ...order, paymentStatus: "Pago", createdAt: "2026-11-03T15:00:00Z" };
}

it("MARGIN-01 soma custos históricos por quantidade e desconta cupom, excluindo frete", async () => {
  const order = await marginOrder();
  order.coupon = { id: "coupon", code: "OFF", kind: "fixed", value: 1000, discountCents: 1000 };
  const data = profitability([order]);
  expect(data.salesCents).toBe(5780);
  expect(data.costCents).toBe(2200);
  expect(data.marginCents).toBe(3580);
  expect(data.marginPercent).toBeCloseTo((3580 / 5780) * 100);
  expect(data.analyzedCount).toBe(1);
  expect(data.missingCount).toBe(0);
});

it("MARGIN-02 custos desconhecidos ou composição legada não viram custo zero", async () => {
  const known = await marginOrder();
  const missing = structuredClone(known);
  missing.id = "missing";
  missing.lines[0].unitCostCents = null;
  const legacy = { ...known, id: "legacy", lines: [] };
  const incomplete = { ...known, id: "incomplete", subtotalCents: known.subtotalCents + 1 };
  const data = profitability([known, missing, legacy, incomplete]);
  expect(data.missingCount).toBe(3);
  expect(data.analyzedCount).toBe(1);
  expect(data.analyzedSalesCents).toBe(6780);
  expect(data.costCents).toBe(2200);
  expect(data.marginCents).toBe(4580);
  expect(data.rows.find((r) => r.id === "missing")?.marginCents).toBeNull();
  expect(profitability([missing]).costCents).toBeNull();
  expect(profitability([missing]).marginCents).toBeNull();
});

it("MARGIN-03 filtra datas inclusivas em Bahia e exclui cancelados, estornos, pendentes e demos", async () => {
  const paid = await marginOrder();
  const orders: Order[] = [
    paid,
    { ...paid, id: "before", createdAt: "2026-11-03T02:59:59Z" },
    { ...paid, id: "after", createdAt: "2026-11-04T03:00:00Z" },
    { ...paid, id: "canceled", status: "Cancelado" },
    { ...paid, id: "refunded", paymentStatus: "Estornado" },
    { ...paid, id: "partial", paymentStatus: "Pendente" },
    { ...paid, id: "demo", demo: true },
  ];
  expect(profitability(orders, "2026-11-03", "2026-11-03").rows.map((r) => r.id)).toEqual([
    paid.id,
  ]);
  expect(profitability(orders, "2026-11-04", "2026-11-03").rows).toEqual([]);
});

it("MARGIN-04 aceita custo zero, margem negativa, desconto integral e estado vazio sem dividir por zero", async () => {
  const order = await marginOrder();
  const freeCost = structuredClone(order);
  freeCost.lines[0].unitCostCents = 0;
  expect(profitability([freeCost]).marginPercent).toBe(100);
  const loss = structuredClone(order);
  loss.lines[0].unitCostCents = 4000;
  expect(profitability([loss]).marginCents).toBe(-1220);
  const discounted = {
    ...order,
    coupon: { id: "free", code: "FREE", kind: "fixed" as const, value: 6780, discountCents: 6780 },
  };
  expect(profitability([discounted]).marginCents).toBe(-2200);
  expect(profitability([discounted]).marginPercent).toBeNull();
  expect(profitability([])).toMatchObject({
    salesCents: 0,
    costCents: null,
    marginCents: null,
    marginPercent: null,
  });
});
