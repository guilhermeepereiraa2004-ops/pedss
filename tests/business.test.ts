import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fixture, company, product, cartLine, checkout } from "./fixtures.ts";
import { applyCoupon } from "../src/core/coupons.ts";
import { businessOverview } from "../src/core/analytics.ts";
import { couponSchema, workspaceSchema } from "../src/core/model.ts";
import { localDay } from "../src/core/calendar.ts";
const now = new Date("2026-10-20T15:00:00Z");
export const sampleCoupon = () =>
  couponSchema.parse({
    id: "coupon-one",
    code: "BRASA10",
    description: "Oferta de teste",
    kind: "percent",
    value: 10,
    minSubtotalCents: 1000,
    validFrom: "2026-10-01",
    validUntil: "2026-10-31",
    usageLimit: null,
    perCustomerLimit: null,
    active: true,
    advertised: true,
  });
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => vi.useRealTimers());
describe("cupons, despesas e indicadores", () => {
  it("COUPON-01 desconto usa subtotal oficial, mantém frete e guarda snapshot", async () => {
    const f = await fixture();
    await f.services.saveCoupon(company.id, sampleCoupon());
    await f.services.addToCart(company.id, cartLine);
    const order = await f.services.checkout(
      company.id,
      f.repo.getSnapshot().tenants[company.id].cart.requestId,
      { ...checkout, couponCode: "brasa10", expectedTotalCents: 6602 },
    );
    expect(order.coupon).toMatchObject({ code: "BRASA10", discountCents: 678 });
    expect(order.deliveryFeeCents).toBe(500);
    expect(order.totalCents).toBe(6602);
    await f.services.saveCoupon(company.id, { ...sampleCoupon(), value: 20 });
    expect(f.repo.getSnapshot().tenants[company.id].orders[0].coupon?.value).toBe(10);
  });
  it("COUPON-02 rejeita vencimento, mínimo, inatividade e limita valor fixo ao subtotal", async () => {
    const f = await fixture();
    const tenant = f.repo.getSnapshot().tenants[company.id];
    for (const changes of [
      { active: false },
      { validUntil: "2026-10-19" },
      { validFrom: "2026-10-21" },
      { minSubtotalCents: 9000 },
    ]) {
      const changed = { ...tenant, coupons: [{ ...sampleCoupon(), ...changes }] };
      expect(() => applyCoupon(changed, "BRASA10", 6780, checkout.phone, now)).toThrow();
    }
    expect(
      applyCoupon(
        { ...tenant, coupons: [{ ...sampleCoupon(), kind: "fixed", value: 10000 }] },
        "BRASA10",
        6780,
        checkout.phone,
        now,
      )?.discountCents,
    ).toBe(6780);
    expect(couponSchema.safeParse({ ...sampleCoupon(), value: 101 }).success).toBe(false);
  });
  it("COUPON-03 limite total é transacional, repetição não consome duas vezes e cancelamento libera", async () => {
    const f = await fixture();
    await f.services.saveCoupon(company.id, { ...sampleCoupon(), usageLimit: 1 });
    await f.services.addToCart(company.id, cartLine);
    const request = f.repo.getSnapshot().tenants[company.id].cart.requestId,
      input = { ...checkout, couponCode: "BRASA10", expectedTotalCents: 6602 };
    const [one, two] = await Promise.all([
      f.services.checkout(company.id, request, input),
      f.services.checkout(company.id, request, input),
    ]);
    expect(one.id).toBe(two.id);
    await f.services.addToCart(company.id, cartLine);
    const next = f.repo.getSnapshot().tenants[company.id].cart.requestId;
    await expect(f.services.checkout(company.id, next, input)).rejects.toThrow("esgotado");
    expect(f.repo.getSnapshot().tenants[company.id].cart.lines).toHaveLength(1);
    await f.services.changeOrder(company.id, one.id, "Cancelado", "Teste de cancelamento");
    await expect(f.services.checkout(company.id, next, input)).resolves.toHaveProperty(
      "totalCents",
      6602,
    );
  });
  it("COUPON-04 limite por telefone, código único e alteração de total exigem revisão", async () => {
    const f = await fixture();
    await f.services.saveCoupon(company.id, { ...sampleCoupon(), perCustomerLimit: 1 });
    await f.services.addToCart(company.id, cartLine);
    let request = f.repo.getSnapshot().tenants[company.id].cart.requestId;
    await expect(
      f.services.checkout(company.id, request, { ...checkout, couponCode: "BRASA10" }),
    ).rejects.toThrow("valores");
    await f.services.checkout(company.id, request, {
      ...checkout,
      couponCode: "BRASA10",
      expectedTotalCents: 6602,
    });
    await f.services.addToCart(company.id, cartLine);
    request = f.repo.getSnapshot().tenants[company.id].cart.requestId;
    await expect(
      f.services.checkout(company.id, request, {
        ...checkout,
        couponCode: "BRASA10",
        expectedTotalCents: 6602,
      }),
    ).rejects.toThrow("limite de uso");
    await expect(
      f.services.saveCoupon(company.id, { ...sampleCoupon(), id: "another" }),
    ).rejects.toThrow("código");
  });
  it("BUSINESS-01 custos ficam no snapshot e ausência de custo impede ranking de margem", async () => {
    const f = await fixture();
    await f.services.saveProduct(company.id, {
      ...product,
      costCents: 1000,
      extras: product.extras.map((e) => ({ ...e, costCents: 100 })),
    });
    await f.services.addToCart(company.id, cartLine);
    const order = await f.services.checkout(
      company.id,
      f.repo.getSnapshot().tenants[company.id].cart.requestId,
      checkout,
    );
    await f.services.changePayment(company.id, order.id, "Pago");
    await f.services.saveProduct(company.id, { ...product, costCents: 5000 });
    const t = f.repo.getSnapshot().tenants[company.id];
    expect(t.orders[0].lines[0].unitCostCents).toBe(1100);
    expect(businessOverview(company, t, now).topCustomer?.grossMarginCents).toBe(4580);
    const unknown = structuredClone(t);
    unknown.orders[0].lines[0].unitCostCents = null;
    expect(businessOverview(company, unknown, now).topCustomer).toBeNull();
    expect(businessOverview(company, unknown, now).topRevenueCustomer?.revenueCents).toBe(7280);
  });
  it("BUSINESS-02 despesas validam valor, data, autorização e arquivo reversível", async () => {
    const f = await fixture();
    const expense = {
      id: "expense",
      description: "Compra de insumos",
      category: "Ingredientes",
      amountCents: 10000,
      paidOn: "2026-10-20",
      notes: "",
      createdAt: now.toISOString(),
      voided: false,
    };
    await f.services.saveExpense(company.id, expense);
    expect(
      businessOverview(company, f.repo.getSnapshot().tenants[company.id], now).balanceCents,
    ).toBe(-10000);
    await f.services.voidExpense(company.id, expense.id, true);
    expect(
      businessOverview(company, f.repo.getSnapshot().tenants[company.id], now).expenseCents,
    ).toBe(0);
    await f.services.voidExpense(company.id, expense.id, false);
    await expect(
      f.services.saveExpense(company.id, { ...expense, paidOn: "2026-10-21" }),
    ).rejects.toThrow("futura");
    await expect(
      f.services.saveExpense(company.id, { ...expense, amountCents: -1 }),
    ).rejects.toThrow();
    const staff = await fixture("attendant");
    await expect(staff.services.saveExpense(company.id, expense)).rejects.toThrow("perfil");
    await expect(staff.services.saveCoupon(company.id, sampleCoupon())).rejects.toThrow("perfil");
  });
  it("BUSINESS-03 receita respeita recebimento, estorno e timezone; meses vazios aparecem", async () => {
    const f = await fixture();
    await f.services.addToCart(company.id, cartLine);
    const order = await f.services.checkout(
      company.id,
      f.repo.getSnapshot().tenants[company.id].cart.requestId,
      checkout,
    );
    const t = structuredClone(f.repo.getSnapshot().tenants[company.id]);
    t.orders = [
      {
        ...order,
        createdAt: "2026-09-30T20:00:00Z",
        paymentStatus: "Estornado",
        status: "Cancelado",
        history: [
          ...order.history,
          {
            id: "paid",
            at: "2026-10-01T01:00:00Z",
            actor: "Teste",
            kind: "payment",
            from: "Pendente",
            to: "Pago",
            reason: "",
          },
          {
            id: "refund",
            at: "2026-10-20T14:00:00Z",
            actor: "Teste",
            kind: "payment",
            from: "Pago",
            to: "Estornado",
            reason: "Cancelamento",
          },
        ],
      },
    ];
    const data = businessOverview({ ...company, createdAt: "2026-08-10" }, t, now);
    expect(localDay("2026-10-01T01:00:00Z")).toBe("2026-09-30");
    expect(data.months.map((m) => m.month)).toEqual(["2026-08", "2026-09", "2026-10"]);
    expect(data.months[0].revenueCents).toBe(0);
    expect(data.months[1].revenueCents).toBe(7280);
    expect(data.revenueCents).toBe(-7280);
    expect(data.sevenDays.at(-1)?.balanceCents).toBe(-7280);
    expect(data.saleCount).toBe(0);
  });
  it("BUSINESS-04 rankings somam opções por produto, incluem zero e ignoram exemplos", async () => {
    const f = await fixture();
    await f.services.addToCart(company.id, cartLine);
    const order = await f.services.checkout(
      company.id,
      f.repo.getSnapshot().tenants[company.id].cart.requestId,
      checkout,
    );
    await f.services.changePayment(company.id, order.id, "Pago");
    const t = structuredClone(f.repo.getSnapshot().tenants[company.id]);
    t.products.push({ ...product, id: "never", name: "Nunca vendido" });
    t.orders.push({ ...t.orders[0], id: "demo-order", demo: true });
    const data = businessOverview(company, t, now);
    expect(data.mostSold?.quantity).toBe(2);
    expect(data.leastSold).toMatchObject({ id: "never", quantity: 0 });
    expect(data.orderCount).toBe(1);
    expect(data.averageTicketCents).toBe(7280);
  });
  it("DATA-05 dados v2 anteriores ganham campos sem apagar pedidos nem inventar custos", async () => {
    const f = await fixture();
    const source = JSON.parse(JSON.stringify(f.repo.getSnapshot()));
    delete source.tenants[company.id].coupons;
    delete source.tenants[company.id].expenses;
    delete source.tenants[company.id].products[0].costCents;
    const result = workspaceSchema.parse(source);
    expect(result.tenants[company.id].coupons).toEqual([]);
    expect(result.tenants[company.id].products[0].costCents).toBeNull();
  });
});
