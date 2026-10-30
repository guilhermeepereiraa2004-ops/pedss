import { describe, it, expect } from "vitest";
import {
  openState,
  quote,
  transition,
  recordPayment,
  finance,
  emptyTenant,
} from "../src/core/domain.ts";
import { company, fixture, product, cartLine, checkout, initial } from "./fixtures.ts";
describe("checkout e catálogo", () => {
  it.each(["burger", "pizza", "acai", "icecream", "snacks", "pastel"])(
    "TENANT-03 criação com tipo %s inicializa loja vazia no segmento escolhido",
    async (heroSegment) => {
      const { services, repo } = await fixture("admin");
      const input = { ...company, id: "new-store", slug: "nova-loja", heroSegment };
      await services.saveCompany(input);
      const tenant = repo.getSnapshot().tenants[input.id];
      expect(tenant.settings.heroSegment).toBe(heroSegment);
      expect(tenant.products).toEqual([]);
      expect(tenant.orders).toEqual([]);
      await services.saveCompany({ ...input, name: "Loja renomeada", heroSegment: undefined });
      expect(repo.getSnapshot().tenants[input.id].settings.heroSegment).toBe(heroSegment);
    },
  );
  it("TENANT-04 tipo obrigatório/validado no caso de uso sem deixar cadastro parcial", async () => {
    const { services, repo } = await fixture("admin");
    const input = { ...company, id: "invalid-store", slug: "sem-tipo" };
    await expect(services.saveCompany(input)).rejects.toThrow("tipo de estabelecimento");
    await expect(services.saveCompany({ ...input, heroSegment: "invalido" })).rejects.toThrow();
    expect(repo.getSnapshot().companies.some((c) => c.id === input.id)).toBe(false);
    expect(repo.getSnapshot().tenants[input.id]).toBeUndefined();
  });
  it("TENANT-05 tipo compartilhado pela central e configurações preserva catálogo e restante da operação", async () => {
    const { services, repo } = await fixture("admin");
    const before = structuredClone(repo.getSnapshot().tenants[company.id]);
    await services.saveCompany({ ...company, heroSegment: "acai" });
    expect(repo.getSnapshot().tenants[company.id]).toEqual({
      ...before,
      settings: { ...before.settings, heroSegment: "acai" },
    });
    await services.configureStore(
      company.id,
      { ...before.settings, heroSegment: "icecream" },
      company,
    );
    await services.saveCompany({ ...company, name: "Nome atualizado" });
    expect(repo.getSnapshot().tenants[company.id].settings.heroSegment).toBe("icecream");
  });
  it("ORDER-01 calcula catálogo oficial, adicionais, retirada e nome oficial", async () => {
    const { repo, services } = await fixture();
    await services.addToCart(company.id, {
      ...cartLine,
      name: "Adulterado",
      priceCents: 1,
    } as typeof cartLine);
    const key = repo.getSnapshot().tenants[company.id].cart.requestId;
    const order = await services.checkout(company.id, key, checkout);
    expect(order.totalCents).toBe(7280);
    expect(order.lines[0].name).toBe("Nome oficial");
    expect(order.lines[0].unitPriceCents).toBe(3390);
    expect(order.lines[0].extras[0].name).toBe("Queijo");
    expect(order.lines[0].removedIngredients).toEqual(["Cebola"]);
    expect(repo.getSnapshot().tenants[company.id].cart.lines).toEqual([]);
  });
  it("ORDER-02 grava uma única vez com cliques concorrentes e requestId repetido", async () => {
    const { repo, services } = await fixture();
    await services.addToCart(company.id, cartLine);
    const request = repo.getSnapshot().tenants[company.id].cart.requestId;
    const [a, b] = await Promise.all([
      services.checkout(company.id, request, checkout),
      services.checkout(company.id, request, checkout),
    ]);
    expect(a.id).toBe(b.id);
    expect(repo.getSnapshot().tenants[company.id].orders).toHaveLength(1);
  });
  it("ORDER-03 recusa total desatualizado sem perder sacola nem criar pedido", async () => {
    const { repo, services } = await fixture();
    await services.addToCart(company.id, cartLine);
    await services.saveProduct(company.id, { ...product, priceCents: 3990 });
    const t = repo.getSnapshot().tenants[company.id];
    await expect(services.checkout(company.id, t.cart.requestId, checkout)).rejects.toThrow(
      "valores",
    );
    expect(repo.getSnapshot().tenants[company.id].cart.lines).toHaveLength(1);
    expect(repo.getSnapshot().tenants[company.id].orders).toHaveLength(0);
  });
  it("ORDER-04 impede produto indisponível, quantidade e adicionais inválidos", async () => {
    const { services, repo } = await fixture();
    await expect(services.addToCart(company.id, { ...cartLine, quantity: 0 })).rejects.toThrow();
    await services.addToCart(company.id, cartLine);
    await services.saveProduct(company.id, { ...product, status: "Indisponível" });
    const t = repo.getSnapshot().tenants[company.id];
    await expect(services.checkout(company.id, t.cart.requestId, checkout)).rejects.toThrow(
      "indisponível",
    );
  });
  it("ORDER-05 valida endereço, área, telefone, troco e forma de pagamento", async () => {
    const { services, repo } = await fixture();
    await services.addToCart(company.id, cartLine);
    const request = repo.getSnapshot().tenants[company.id].cart.requestId;
    for (const change of [
      { phone: "123" },
      { areaId: "fora" },
      { street: "" },
      { paymentMethod: "Crédito online" },
      { changeForCents: 100 },
    ])
      await expect(
        services.checkout(company.id, request, { ...checkout, ...change }),
      ).rejects.toThrow();
  });
  it("ORDER-06 retirada usa endereço da loja e não cobra entrega", async () => {
    const { services, repo } = await fixture();
    await services.addToCart(company.id, cartLine);
    const t = repo.getSnapshot().tenants[company.id];
    const order = await services.checkout(company.id, t.cart.requestId, {
      ...checkout,
      fulfillment: "pickup",
      expectedTotalCents: 6780,
    });
    expect(order.deliveryFeeCents).toBe(0);
    expect(order.address.street).toContain("Balcão");
  });
  it("CATALOG-01 editar preserva ID e excluir preserva snapshot no pedido", async () => {
    const { services, repo } = await fixture();
    await services.addToCart(company.id, cartLine);
    const order = await services.checkout(
      company.id,
      repo.getSnapshot().tenants[company.id].cart.requestId,
      checkout,
    );
    await services.removeProduct(company.id, product.id);
    expect(repo.getSnapshot().tenants[company.id].products).toHaveLength(0);
    expect(repo.getSnapshot().tenants[company.id].orders[0].lines[0].name).toBe(
      order.lines[0].name,
    );
  });
});
describe("atendimento e financeiro", () => {
  it("HOURS-01 central, fechamento manual e horário usam a mesma regra", () => {
    const t = emptyTenant(true);
    expect(openState({ ...company, status: "Pausado" }, t).open).toBe(false);
    t.online = false;
    expect(openState(company, t).open).toBe(false);
    t.online = true;
    t.settings.scheduleEnabled = true;
    expect(openState(company, t, new Date("2026-10-20T13:00:00Z")).open).toBe(false);
    expect(openState(company, t, new Date("2026-10-21T00:00:00Z")).open).toBe(true);
  });
  it("HOURS-02 horário após meia-noite respeita o dia anterior", () => {
    const t = emptyTenant(true);
    t.settings.scheduleEnabled = true;
    t.settings.hours = t.settings.hours.map((h) => ({
      ...h,
      enabled: h.day === 2,
      open: "18:00",
      close: "02:00",
    }));
    expect(openState(company, t, new Date("2026-10-21T04:00:00Z")).open).toBe(true);
    expect(openState(company, t, new Date("2026-10-21T06:00:00Z")).open).toBe(false);
  });
  it("ORDER-07 exige sequência, cancelamento com motivo e guarda histórico", async () => {
    const { services, repo } = await fixture();
    await services.addToCart(company.id, cartLine);
    let order = await services.checkout(
      company.id,
      repo.getSnapshot().tenants[company.id].cart.requestId,
      checkout,
    );
    expect(() => transition(order, "Entregue", "Atendente")).toThrow();
    expect(() => transition(order, "Cancelado", "Atendente", "")).toThrow();
    order = transition(order, "Aceito", "Atendente");
    order = transition(order, "Preparando", "Atendente");
    order = transition(order, "A caminho", "Atendente");
    order = transition(order, "Entregue", "Atendente");
    expect(order.history).toHaveLength(5);
    expect(() => transition(order, "Pendente", "Atendente")).toThrow();
  });
  it("PAY-01 entregar não confirma pagamento; estorno exige cancelamento e motivo", async () => {
    const { services, repo } = await fixture();
    await services.addToCart(company.id, cartLine);
    let order = await services.checkout(
      company.id,
      repo.getSnapshot().tenants[company.id].cart.requestId,
      checkout,
    );
    order = { ...order, status: "Entregue" };
    expect(finance([order]).receivedCents).toBe(0);
    expect(finance([order]).deliveredCents).toBe(7280);
    order = recordPayment(order, "Pago", "Gestor");
    expect(finance([order]).receivedCents).toBe(7280);
    expect(() => recordPayment(order, "Estornado", "Gestor", "Teste")).toThrow();
    order = { ...order, status: "Cancelado" };
    order = recordPayment(order, "Estornado", "Gestor", "Valor devolvido");
    expect(finance([order]).receivedCents).toBe(0);
    expect(finance([order]).refundedCents).toBe(7280);
  });
  it("TENANT-01 IDs imutáveis impedem reutilizar slug e mistura de dados", async () => {
    const { services, repo } = await fixture("admin");
    const next = {
      ...company,
      id: "other",
      slug: "loja-nova",
      name: "Outra loja",
      heroSegment: "burger",
    };
    await services.saveCompany(next);
    expect(repo.getSnapshot().tenants.other.products).toEqual([]);
    await services.archiveCompany("other");
    await expect(services.saveCompany({ ...next, id: "third" })).rejects.toThrow("utilizado");
    await services.restoreCompany("other");
    expect(repo.getSnapshot().companies.find((c) => c.id === "other")?.status).toBe("Pausado");
  });
  it("TENANT-02 atendente não altera preço, configuração, financeiro ou outra loja", async () => {
    const { services, repo } = await fixture("attendant");
    await expect(services.saveProduct(company.id, product)).rejects.toThrow("perfil");
    await expect(services.setOnline(company.id, false)).rejects.toThrow("perfil");
    await expect(services.saveCompany(company)).rejects.toThrow("acesso");
    await services.addToCart(company.id, cartLine);
    const order = await services.checkout(
      company.id,
      repo.getSnapshot().tenants[company.id].cart.requestId,
      checkout,
    );
    await expect(services.changePayment(company.id, order.id, "Pago")).rejects.toThrow("perfil");
    await services.changeOrder(company.id, order.id, "Aceito");
  });
});
