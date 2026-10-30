import { describe, it, expect, vi, afterEach } from "vitest";
import { createHandler } from "../server/api.mjs";
import { projectState } from "../server/projection.mjs";
import { initial, fixture, cartLine, checkout, trialInput, product, company } from "./fixtures.ts";
import { workspaceSchema } from "../src/core/model.ts";
import { createShippingGateway } from "../server/shipping.mjs";
import { pizzaProduct, pizzaLine } from "./pizza-fixture.ts";

it("PIZZA-API-01 configuração exige gestão e checkout HTTP calcula composição no servidor", async () => {
  const h = harness();
  const register = await h.request({ kind: "auth", command: "registerTrial", args: [trialInput] });
  const id = register.body.result.storeId;
  const cookie = register.headers["Set-Cookie"].split(";")[0];
  expect(
    (await h.request({ kind: "service", command: "saveProduct", args: [id, pizzaProduct] }))
      .statusCode,
  ).not.toBe(200);
  expect(
    (
      await h.request(
        { kind: "service", command: "saveProduct", args: [id, { ...pizzaProduct, priceCents: 1 }] },
        cookie,
      )
    ).statusCode,
  ).toBe(200);
  const old = h.state().tenants[id].settings;
  await h.request(
    {
      kind: "service",
      command: "saveSettings",
      args: [id, { ...old, deliveryEnabled: false, pickupEnabled: true, address: "Balcão QA" }],
    },
    cookie,
  );
  await h.request({ kind: "service", command: "setOnline", args: [id, true] }, cookie);
  const cart = { requestId: "pizza-http-1", lines: [pizzaLine] };
  const input = { ...checkout, fulfillment: "pickup", expectedTotalCents: 1 };
  const wrong = await h.request({ kind: "checkout", command: "create", args: [id, cart, input] });
  expect(wrong.statusCode).toBe(400);
  expect(h.state().tenants[id].orders).toHaveLength(0);
  const result = await h.request({
    kind: "checkout",
    command: "create",
    args: [id, cart, { ...input, expectedTotalCents: 5001 }],
  });
  expect(result.statusCode).toBe(200);
  expect(result.body.result.totalCents).toBe(5001);
  expect(result.body.result.lines[0].pizzaSummary).toContain("1/2 Calabresa");
  expect(result.body.result.lines[0]).not.toHaveProperty("unitCostCents");
});

afterEach(() => vi.useRealTimers());
it("PIZZA-API-03 preço fixo por tamanho e disponibilidade são recalculados no checkout HTTP", async () => {
  const h = harness();
  const register = await h.request({ kind: "auth", command: "registerTrial", args: [trialInput] });
  const id = register.body.result.storeId,
    cookie = register.headers["Set-Cookie"].split(";")[0];
  const configured = {
    ...pizzaProduct,
    pizza: {
      ...pizzaProduct.pizza,
      pricing: "fixed",
      sizes: pizzaProduct.pizza!.sizes.map((s) => ({ ...s, fixedPriceCents: 4500 })),
      flavors: pizzaProduct.pizza!.flavors.map((f) => ({ ...f, prices: {} })),
    },
  };
  expect(
    (await h.request({ kind: "service", command: "saveProduct", args: [id, configured] }, cookie))
      .statusCode,
  ).toBe(200);
  const old = h.state().tenants[id].settings;
  await h.request(
    {
      kind: "service",
      command: "saveSettings",
      args: [id, { ...old, deliveryEnabled: false, pickupEnabled: true, address: "Balcão QA" }],
    },
    cookie,
  );
  await h.request({ kind: "service", command: "setOnline", args: [id, true] }, cookie);
  const cart = { requestId: "fixed-size-http", lines: [pizzaLine] };
  const input = { ...checkout, fulfillment: "pickup", expectedTotalCents: 1 };
  expect(
    (await h.request({ kind: "checkout", command: "create", args: [id, cart, input] })).statusCode,
  ).toBe(400);
  const result = await h.request({
    kind: "checkout",
    command: "create",
    args: [id, cart, { ...input, expectedTotalCents: 5500 }],
  });
  expect(result.statusCode).toBe(200);
  expect(result.body.result.totalCents).toBe(5500);
});
it("PIZZA-API-02 preço fixo de quantidade é validado no servidor e o checkout rejeita total adulterado", async () => {
  const h = harness();
  const register = await h.request({ kind: "auth", command: "registerTrial", args: [trialInput] });
  const id = register.body.result.storeId,
    cookie = register.headers["Set-Cookie"].split(";")[0];
  const configured = {
    ...pizzaProduct,
    pizza: {
      ...pizzaProduct.pizza,
      sizes: pizzaProduct.pizza!.sizes.map((s) => ({
        ...s,
        flavorCountPricing: { mode: "fixed", prices: { "2": 5500 } },
      })),
    },
  };
  expect(
    (await h.request({ kind: "service", command: "saveProduct", args: [id, configured] }, cookie))
      .statusCode,
  ).toBe(200);
  const old = h.state().tenants[id].settings;
  await h.request(
    {
      kind: "service",
      command: "saveSettings",
      args: [id, { ...old, deliveryEnabled: false, pickupEnabled: true, address: "Balcão QA" }],
    },
    cookie,
  );
  await h.request({ kind: "service", command: "setOnline", args: [id, true] }, cookie);
  const cart = { requestId: "count-pricing-http", lines: [pizzaLine] };
  const input = { ...checkout, fulfillment: "pickup", expectedTotalCents: 5001 };
  expect(
    (await h.request({ kind: "checkout", command: "create", args: [id, cart, input] })).statusCode,
  ).toBe(400);
  const paid = await h.request({
    kind: "checkout",
    command: "create",
    args: [id, cart, { ...input, expectedTotalCents: 6500 }],
  });
  expect(paid.statusCode).toBe(200);
  expect(paid.body.result.totalCents).toBe(6500);
  expect(paid.body.result.lines[0].pizzaSummary).toContain("6 fatias");
});
it("FREIGHT-API-01 cotação e checkout remotos validam assinatura e valor sem confiar no cliente", async () => {
  const route = vi.fn(async () => ({
    distanceMeters: 3210,
    address: { street: "Rua teste", neighborhood: "Centro", city: "São Paulo", state: "SP" },
  }));
  const h = harness(
    initial(),
    async () => true,
    createShippingGateway({ route, secret: () => "only-a-test-secret" }),
  );
  const register = await h.request({ kind: "auth", command: "registerTrial", args: [trialInput] });
  const id = register.body.result.storeId,
    cookie = register.headers["Set-Cookie"].split(";")[0];
  const old = h.state().tenants[id].settings;
  const settings = {
    ...old,
    pickupEnabled: true,
    address: "Balcão QA",
    shipping: {
      mode: "distance",
      originPostalCode: "01001000",
      fixedFeeCents: 0,
      perKmCents: 200,
      baseFeeCents: 300,
      minimumFeeCents: 800,
      maxDistanceKm: 20,
    },
  };
  expect(
    (await h.request({ kind: "service", command: "saveShipping", args: [id, settings] }, cookie))
      .statusCode,
  ).toBe(200);
  expect(
    (await h.request({ kind: "service", command: "saveProduct", args: [id, product] }, cookie))
      .statusCode,
  ).toBe(200);
  expect(
    (await h.request({ kind: "service", command: "setOnline", args: [id, true] }, cookie))
      .statusCode,
  ).toBe(200);
  const quoted = await h.request({ kind: "shipping", command: "quote", args: [id, "01310100"] });
  expect(quoted.statusCode).toBe(200);
  expect(quoted.body.result.feeCents).toBe(942);
  const cart = { requestId: "freight-http-request", lines: [{ ...cartLine, key: "line" }] };
  const input = {
    ...checkout,
    postalCode: "01310100",
    shippingQuoteToken: quoted.body.result.token,
    expectedTotalCents: 7722,
  };
  expect(
    (
      await h.request({
        kind: "checkout",
        command: "create",
        args: [id, cart, { ...input, shippingQuoteToken: input.shippingQuoteToken + "x" }],
      })
    ).statusCode,
  ).toBe(400);
  expect(h.state().tenants[id].orders).toEqual([]);
  const bought = await h.request({
    kind: "checkout",
    command: "create",
    args: [id, cart, { ...input, deliveryFeeCents: 1 }],
  });
  expect(bought.statusCode).toBe(200);
  expect(bought.body.result.deliveryFeeCents).toBe(942);
  expect(h.state().tenants[id].orders[0].paymentStatus).toBe("Pendente");
});
function harness(
  state = initial(),
  limit = async (_key: string, _max: number, _seconds?: number) => true,
  shipping?: any,
) {
  let current = structuredClone(state);
  const store = {
    read: async () => structuredClone(current),
    limit,
    async transact(work: (draft: any) => Promise<any>) {
      const draft = structuredClone(current);
      const result = await work(draft);
      current = workspaceSchema.parse(draft);
      return result;
    },
  };
  const handler = createHandler({
    getStore: () => store,
    setupToken: () => "private-setup-code-1234567890",
    ...(shipping ? { shipping } : {}),
  });
  async function request(body?: any, cookie = "", extras = {}) {
    const response: any = {
      statusCode: 200,
      headers: {},
      setHeader(k: string, v: string) {
        this.headers[k] = v;
      },
      status(s: number) {
        this.statusCode = s;
        return this;
      },
      json(v: unknown) {
        this.body = v;
        return this;
      },
    };
    await handler(
      {
        method: body ? "POST" : "GET",
        body,
        headers: {
          host: "pedss.test",
          origin: "https://pedss.test",
          "content-type": "application/json",
          "x-pedss-client": "web",
          cookie,
          ...extras,
        },
      },
      response,
    );
    return response;
  }
  return { request, state: () => current };
}
describe("fronteira HTTP e privacidade", () => {
  it("publica a foto sem fundo do produto sem expor seus custos", async () => {
    const state = initial();
    state.tenants["store-one"].products[0].cutoutImage = "/images/burger-proprio.png";
    state.tenants["store-one"].products[0].costCents = 1200;
    const h = harness(state);
    const response = await h.request();
    const visible = response.body.state.tenants["store-one"].products[0];
    expect(visible.cutoutImage).toBe("/images/burger-proprio.png");
    expect(visible).not.toHaveProperty("costCents");
  });
  it("valida cupom não divulgado sem publicar a lista de códigos", async () => {
    const state = initial();
    state.tenants["store-one"].coupons.push({
      id: "secret-code",
      code: "PRIVADO10",
      kind: "percent",
      value: 10,
      description: "",
      active: true,
      advertised: false,
      validFrom: "2020-01-01",
      validUntil: "2099-12-31",
      minSubtotalCents: 0,
      usageLimit: null,
      perCustomerLimit: null,
    });
    const h = harness(state);
    expect((await h.request()).body.state.tenants["store-one"].coupons).toEqual([]);
    const result = await h.request({
      kind: "coupon",
      command: "validate",
      args: [
        "store-one",
        { requestId: "coupon-request", lines: [{ ...cartLine, key: "one" }] },
        "PRIVADO10",
        "71999999999",
      ],
    });
    expect(result.statusCode).toBe(200);
    expect(result.body.result.discountCents).toBe(678);
    expect(result.body.state.tenants["store-one"].coupons).toEqual([]);
  });
  it("não devolve credenciais, custos nem dados financeiros na consulta pública", async () => {
    const f = await fixture("owner");
    const source = f.repo.getSnapshot();
    source.tenants["store-one"].products[0].costCents = 1200;
    source.users[0].passwordHash = "private-hash";
    const view = projectState(source, null);
    expect(JSON.stringify(view)).not.toMatch(
      /private-hash|passwordHash|tokenHash|unitCostCents|costCents/,
    );
    expect(view.users).toEqual([]);
    expect(view.tenants["store-one"].expenses).toEqual([]);
    expect(view.companies[0]).not.toHaveProperty("adminEmail");
  });
  it("recusa mutação anônima e origem cruzada, mesmo com payload válido", async () => {
    const h = harness();
    expect(
      (await h.request({ kind: "service", command: "setOnline", args: ["store-one", false] }))
        .statusCode,
    ).toBe(401);
    expect(
      (await h.request({ kind: "auth", command: "signOut" }, "", { origin: "https://evil.test" }))
        .statusCode,
    ).toBe(403);
    expect(h.state().tenants["store-one"].online).toBe(true);
  });
  it("protege configuração inicial e usa sessão opaca; logout revoga a sessão", async () => {
    const h = harness();
    const args = ["Administrador", "admin@example.com", "secret123456"];
    expect((await h.request({ kind: "auth", command: "setup", args })).statusCode).toBe(403);
    const setup = await h.request({
      kind: "auth",
      command: "setup",
      args: [...args, "private-setup-code-1234567890"],
    });
    expect(setup.statusCode).toBe(200);
    expect(setup.headers["Set-Cookie"]).toContain("HttpOnly");
    expect(setup.headers["Set-Cookie"]).toContain("SameSite=Strict");
    expect(JSON.stringify(setup.body)).not.toMatch(/passwordHash|salt|tokenHash/);
    const cookie = setup.headers["Set-Cookie"].split(";")[0];
    expect((await h.request(undefined, cookie)).body.identity.role).toBe("admin");
    expect(
      (await h.request({ kind: "auth", command: "startDemo", args: ["admin"] })).statusCode,
    ).toBe(400);
    await h.request({ kind: "auth", command: "signOut" }, cookie);
    expect((await h.request(undefined, cookie)).body.identity).toBeNull();
  });
  it("checkout recalcula no servidor, é idempotente e rejeita chave com conteúdo diferente", async () => {
    const h = harness();
    const cart = {
      requestId: "request-unique",
      lines: [{ ...cartLine, key: "line-one", priceCents: 1 }],
    };
    const command = { kind: "checkout", command: "create", args: ["store-one", cart, checkout] };
    const first = await h.request(command);
    expect(first.statusCode).toBe(200);
    expect(first.body.result.totalCents).toBe(7280);
    expect(first.body.result).not.toHaveProperty("requestId");
    expect(first.body.state.tenants["store-one"].orders).toEqual([]);
    const repeated = await h.request(command);
    expect(repeated.body.result.id).toBe(first.body.result.id);
    expect(h.state().tenants["store-one"].orders).toHaveLength(1);
    const changed = structuredClone(command);
    changed.args[2] = { ...checkout, notes: "outro conteúdo" };
    expect((await h.request(changed)).statusCode).toBe(409);
    const forged = structuredClone(command);
    forged.args[1] = { ...cart, requestId: "other" };
    forged.args[2] = { ...checkout, expectedTotalCents: 1 };
    expect((await h.request(forged)).statusCode).toBe(400);
    const tracked = await h.request(undefined, "", {
      "x-pedss-tracking": first.body.result.trackingToken,
    });
    expect(tracked.body.state.tenants["store-one"].orders).toHaveLength(1);
    expect(JSON.stringify(tracked.body)).not.toContain("unitCostCents");
  });
  it("owner só recebe equipe e finanças da sua loja", async () => {
    const f = await fixture("owner");
    const source = structuredClone(f.repo.getSnapshot());
    source.companies.push({ ...source.companies[0], id: "other", slug: "other" });
    source.tenants.other = structuredClone(source.tenants["store-one"]);
    source.tenants.other.expenses.push({ id: "secret", description: "Privado" } as any);
    const view = projectState(source, f.auth.current());
    expect(view.tenants.other.expenses).toEqual([]);
    expect(view.tenants.other.orders).toEqual([]);
    expect(view.tenants["store-one"].products[0]).toHaveProperty("costCents");
  });
});

it("TRIAL-API-01 cadastro público cria sessão HttpOnly de gestor isolado e registra prazo no servidor", async () => {
  const h = harness();
  const r = await h.request({ kind: "auth", command: "registerTrial", args: [trialInput] });
  expect(r.statusCode).toBe(200);
  expect(r.headers["Set-Cookie"]).toContain("HttpOnly");
  expect(r.headers["Set-Cookie"]).toContain("SameSite=Strict");
  expect(r.body.identity).toMatchObject({ role: "owner", storeId: r.body.result.storeId });
  expect(
    r.body.state.companies.find((c: any) => c.id === r.body.result.storeId).trial,
  ).toBeDefined();
  expect(JSON.stringify(r.body)).not.toMatch(/passwordHash|salt|tokenHash|SenhaDeTeste123/);
  const cookie = r.headers["Set-Cookie"].split(";")[0];
  const own = await h.request(
    { kind: "service", command: "saveProduct", args: [r.body.result.storeId, product] },
    cookie,
  );
  expect(own.statusCode).toBe(200);
  const foreign = await h.request(
    { kind: "service", command: "saveProduct", args: [company.id, product] },
    cookie,
  );
  expect(foreign.statusCode).not.toBe(200);
  expect(
    (
      await h.request(
        { kind: "service", command: "activatePlan", args: [r.body.result.storeId, "Rede"] },
        cookie,
      )
    ).statusCode,
  ).not.toBe(200);
  expect(
    (
      await h.request({
        kind: "auth",
        command: "registerTrial",
        args: [{ ...trialInput, role: "admin" }],
      })
    ).statusCode,
  ).toBe(400);
  expect(h.state().companies.filter((c: any) => c.slug === trialInput.slug)).toHaveLength(1);
});

it("TRIAL-API-02 vencimento é aplicado no servidor mesmo com cliente forjando prazo e ativação", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
  const h = harness();
  const r = await h.request({ kind: "auth", command: "registerTrial", args: [trialInput] });
  const id = r.body.result.storeId;
  vi.setSystemTime(new Date("2026-11-08T12:00:00Z"));
  const login = await h.request({
    kind: "auth",
    command: "signIn",
    args: [trialInput.email, trialInput.password],
  });
  expect(login.statusCode).toBe(200);
  const cookie = login.headers["Set-Cookie"].split(";")[0];
  const before = structuredClone(h.state());
  const result = await h.request(
    { kind: "service", command: "saveProduct", args: [id, product], trialEndsAt: "2099-01-01" },
    cookie,
  );
  expect(result.statusCode).not.toBe(200);
  expect(result.body.error.message).toContain("7 dias");
  expect(h.state()).toEqual(before);
  const publicView = await h.request();
  expect(publicView.body.state.tenants[id].online).toBe(false);
});

it("TRIAL-API-03 limitação específica de cadastro bloqueia abuso antes de gravar dados", async () => {
  const limit = vi.fn(async (key: string) => !key.startsWith("signup:"));
  const h = harness(initial(), limit);
  const r = await h.request({ kind: "auth", command: "registerTrial", args: [trialInput] });
  expect(r.statusCode).toBe(429);
  expect(limit).toHaveBeenCalledWith(expect.stringMatching(/^signup:/), 5, 3600);
  expect(h.state().users).toHaveLength(0);
  expect(h.state().companies).toHaveLength(1);
});
