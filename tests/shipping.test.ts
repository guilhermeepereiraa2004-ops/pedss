import { it, expect, vi, afterEach } from "vitest";
import { shippingSchema, checkoutSchema } from "../src/core/model.ts";
import { distanceFee, deliveryFee, deliveryConfigured } from "../src/core/shipping.ts";
import { createServices } from "../src/application/services.ts";
import { createShippingGateway } from "../server/shipping.mjs";
import { createPostalRouting } from "../server/routing.mjs";
import { fixture, company, cartLine, checkout } from "./fixtures.ts";
const rule = {
  mode: "distance" as const,
  originPostalCode: "01001000",
  fixedFeeCents: 600,
  perKmCents: 200,
  baseFeeCents: 300,
  minimumFeeCents: 800,
  maxDistanceKm: 20,
};
const route = vi.fn(async () => ({
  distanceMeters: 3210,
  address: { street: "Praça de teste", neighborhood: "Centro", city: "São Paulo", state: "SP" },
}));
afterEach(() => vi.useRealTimers());
it("FREIGHT-01 taxa única funciona sem áreas e retirada permanece gratuita", async () => {
  const f = await fixture();
  const s = f.repo.getSnapshot().tenants[company.id].settings;
  await f.services.saveShipping(company.id, {
    ...s,
    shipping: { ...rule, mode: "fixed" },
    areas: [],
  });
  expect(deliveryConfigured(f.repo.getSnapshot().tenants[company.id].settings)).toBe(true);
  await f.services.addToCart(company.id, cartLine);
  const cart = f.repo.getSnapshot().tenants[company.id].cart;
  const order = await f.services.checkout(company.id, cart.requestId, {
    ...checkout,
    areaId: "",
    expectedTotalCents: 7380,
  });
  expect(order.deliveryFeeCents).toBe(600);
  expect(order.paymentStatus).toBe("Pendente");
  expect(order.deliveryArea).toBe("");
});
it("FREIGHT-02 cálculo usa metros sem arredondar km exibidos, mínimo e limite", async () => {
  const f = await fixture();
  const s = { ...f.repo.getSnapshot().tenants[company.id].settings, shipping: rule };
  expect(distanceFee(s, 3210)).toBe(942);
  expect(distanceFee(s, 10)).toBe(800);
  expect(() => distanceFee(s, 20001)).toThrow("limite");
  expect(() => distanceFee(s, NaN)).toThrow();
  expect(shippingSchema.safeParse({ ...rule, originPostalCode: "123" }).success).toBe(false);
  expect(shippingSchema.safeParse({ ...rule, perKmCents: 0 }).success).toBe(false);
});
it("FREIGHT-03 cotação assinada rejeita adulteração, outra loja, CEP, regras e expiração", async () => {
  const f = await fixture();
  const s = { ...f.repo.getSnapshot().tenants[company.id].settings, shipping: rule };
  const gateway = createShippingGateway({ route, secret: () => "only-for-automated-tests" });
  const q = await gateway.quote(company.id, s, "01310100");
  expect(q.feeCents).toBe(942);
  expect(deliveryFee(s, "", "01310100", gateway.verify(q.token, company.id, s, "01310100"))).toBe(
    942,
  );
  for (const [token, store, settings, cep] of [
    [q.token + "x", company.id, s, "01310100"],
    [q.token, "other", s, "01310100"],
    [q.token, company.id, s, "01310101"],
    [q.token, company.id, { ...s, shipping: { ...rule, perKmCents: 1 } }, "01310100"],
  ] as any[])
    expect(() => gateway.verify(token, store, settings, cep)).toThrow("novamente");
  vi.useFakeTimers();
  vi.setSystemTime(Date.now() + 16 * 60_000);
  expect(() => gateway.verify(q.token, company.id, s, "01310100")).toThrow("expirou");
});
it("FREIGHT-04 servidor exige cotação e reconfere o total na compra", async () => {
  const f = await fixture();
  const gateway = createShippingGateway({ route, secret: () => "only-for-automated-tests" });
  const services = createServices(f.repo, f.auth, gateway);
  const s = f.repo.getSnapshot().tenants[company.id].settings;
  await services.saveShipping(company.id, { ...s, shipping: rule });
  await services.addToCart(company.id, cartLine);
  const cart = f.repo.getSnapshot().tenants[company.id].cart;
  await expect(
    services.checkout(company.id, cart.requestId, {
      ...checkout,
      postalCode: "01310100",
      shippingQuoteToken: "",
    }),
  ).rejects.toThrow("novamente");
  const q = await services.quoteShipping(company.id, "01310100");
  const input = {
    ...checkout,
    postalCode: "01310100",
    shippingQuoteToken: q.token,
    expectedTotalCents: 7722,
  };
  await expect(
    services.checkout(company.id, cart.requestId, { ...input, expectedTotalCents: 0 }),
  ).rejects.toThrow("valores");
  const order = await services.checkout(company.id, cart.requestId, input);
  expect(order.deliveryFeeCents).toBe(942);
  expect(order.deliveryDistanceMeters).toBe(3210);
  expect(order.address.postalCode).toBe("01310100");
});
it("FREIGHT-05 autorização e configurações antigas preservadas; configurações gerais não sobrescrevem frete", async () => {
  const f = await fixture();
  const old = f.repo.getSnapshot().tenants[company.id].settings;
  const attendant = await fixture("attendant");
  await expect(
    attendant.services.saveShipping(company.id, { ...old, shipping: rule }),
  ).rejects.toThrow("perfil");
  await f.services.saveShipping(company.id, {
    ...old,
    shipping: { ...rule, mode: "fixed" },
    areas: [],
  });
  await f.services.configureStore(
    company.id,
    { ...old, description: "Novo texto" },
    { name: company.name, logo: company.logo, primaryColor: company.primaryColor },
  );
  const current = f.repo.getSnapshot().tenants[company.id].settings;
  expect(current.shipping?.mode).toBe("fixed");
  expect(current.areas).toEqual([]);
  expect(current.description).toBe("Novo texto");
  expect(deliveryFee(old, "centro")).toBe(500);
  expect(checkoutSchema.parse(checkout).postalCode).toBe("");
});
it("FREIGHT-06 consulta somente CEPs e coordenadas, com cache e sem aceitar coordenada ausente", async () => {
  const responses = [
    {
      street: "Rua",
      city: "Cidade",
      state: "SP",
      location: { coordinates: { latitude: "-23.55", longitude: "-46.63" } },
    },
    {
      street: "Outra",
      city: "Cidade",
      state: "SP",
      location: { coordinates: { latitude: "-23.56", longitude: "-46.64" } },
    },
    { features: [{ properties: { summary: { distance: 3210.1 } } }] },
  ];
  const fetcher = vi.fn(async () => ({ ok: true, json: async () => responses.shift() }));
  const router = createPostalRouting({ fetcher, key: () => "fake-test-key" });
  const q = await router("01001000", "01310100");
  expect(q.distanceMeters).toBe(3211);
  await router("01001000", "01310100");
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(fetcher.mock.calls[0][0]).toContain("/01001000");
  expect(fetcher.mock.calls[2][1].body).toBe(
    JSON.stringify({
      coordinates: [
        [-46.63, -23.55],
        [-46.64, -23.56],
      ],
      instructions: false,
    }),
  );
  const missing = createPostalRouting({
    fetcher: async () => ({ ok: true, json: async () => ({ location: { coordinates: {} } }) }),
    key: () => "fake",
  });
  await expect(missing("01001000", "01310100")).rejects.toThrow("localização");
  await expect(createPostalRouting({ key: () => "" })("01001000", "01310100")).rejects.toThrow(
    "indisponível",
  );
});
