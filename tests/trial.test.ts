import { afterEach, expect, it, vi } from "vitest";
import { createMemoryRepository } from "../src/adapters/memoryRepository.ts";
import { createLocalAuth } from "../src/adapters/localAuth.ts";
import { createServices } from "../src/application/services.ts";
import { defaultsSettings, openState } from "../src/core/domain.ts";
import { trialState } from "../src/core/trials.ts";
import { initial, storage, product, company, checkout, trialInput } from "./fixtures.ts";
afterEach(() => vi.useRealTimers());
async function anonymous() {
  const repo = createMemoryRepository(initial());
  const auth = createLocalAuth(repo, storage());
  await auth.ready;
  return { repo, auth, services: createServices(repo, auth) };
}

it("TRIAL-01 cadastro cria apenas gestor e loja própria vazia, com sete dias exatos e sessão", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
  const f = await anonymous(),
    previous = structuredClone(f.repo.getSnapshot());
  const result = await f.auth.registerTrial({ ...trialInput, email: "TRIAL@EXAMPLE.COM" });
  const s = f.repo.getSnapshot(),
    c = s.companies.find((c) => c.id === result.storeId)!;
  expect(result.slug).toBe(trialInput.slug);
  expect(f.auth.current()).toMatchObject({
    role: "owner",
    storeId: c.id,
    email: trialInput.email,
    demo: false,
  });
  expect(c.trial).toEqual({
    startedAt: "2026-11-01T12:00:00.000Z",
    endsAt: "2026-11-08T12:00:00.000Z",
  });
  expect(c).toMatchObject({
    name: trialInput.storeName,
    primaryColor: trialInput.primaryColor,
    plan: "Essencial",
  });
  expect(s.tenants[c.id]).toMatchObject({
    products: [],
    orders: [],
    expenses: [],
    coupons: [],
    online: false,
    settings: { heroSegment: "pastel" },
  });
  expect(s.tenants[company.id]).toEqual(previous.tenants[company.id]);
  expect(s.users[0].passwordHash).not.toBe(trialInput.password);
  expect(JSON.stringify(s)).not.toContain(trialInput.password);
  expect(s.sessions[0].tokenHash).not.toBe(f.auth.getToken());
  await expect(f.services.saveProduct(company.id, product)).rejects.toThrow(/acesso/);
  await expect(f.services.saveCompany({ ...company, name: "Outro nome" })).rejects.toThrow(
    /acesso/,
  );
});

it("TRIAL-02 campos de privilégios e prazo forjados não criam conta nem loja", async () => {
  const f = await anonymous(),
    before = structuredClone(f.repo.getSnapshot());
  for (const injection of [
    { role: "admin" },
    { storeId: company.id },
    { trial: { endsAt: "2099-01-01" } },
    { plan: "Rede" },
  ]) {
    await expect(f.auth.registerTrial({ ...trialInput, ...injection })).rejects.toThrow();
    expect(f.repo.getSnapshot()).toEqual(before);
  }
});

it("TRIAL-03 e-mail normalizado, endereço usado/arquivado e reservado não duplicam cadastros", async () => {
  const f = await anonymous();
  await f.auth.registerTrial(trialInput);
  await f.auth.signOut();
  const before = structuredClone(f.repo.getSnapshot());
  await expect(
    f.auth.registerTrial({ ...trialInput, email: "TRIAL@EXAMPLE.COM", slug: "outra-loja" }),
  ).rejects.toThrow(/e-mail/);
  await expect(f.auth.registerTrial({ ...trialInput, email: "outra@example.com" })).rejects.toThrow(
    /endereço/,
  );
  await expect(
    f.auth.registerTrial({ ...trialInput, email: "outra@example.com", slug: "cadastro" }),
  ).rejects.toThrow(/reservado/);
  expect(f.repo.getSnapshot()).toEqual(before);
  await f.repo.transact((s) => {
    s.companies.find((c) => c.slug === trialInput.slug)!.archived = true;
  });
  await expect(f.auth.registerTrial({ ...trialInput, email: "outra@example.com" })).rejects.toThrow(
    /endereço/,
  );
});

it("TRIAL-04 duas tentativas concorrentes reservam e-mail/endereço uma única vez", async () => {
  const f = await anonymous();
  const outcomes = await Promise.allSettled([
    f.auth.registerTrial(trialInput),
    f.auth.registerTrial(trialInput),
  ]);
  expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(f.repo.getSnapshot().companies.filter((c) => c.slug === trialInput.slug)).toHaveLength(1);
  expect(f.repo.getSnapshot().users.filter((u) => u.email === trialInput.email)).toHaveLength(1);
});

it("TRIAL-05 período funciona até o último instante e expiração bloqueia gestão/equipe/pedidos sem apagar dados", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
  const f = await anonymous(),
    { storeId } = await f.auth.registerTrial(trialInput);
  const read = () => f.repo.getSnapshot().companies.find((c) => c.id === storeId)!;
  const settings = defaultsSettings(true);
  await f.services.configureStore(storeId, settings, {
    name: trialInput.storeName,
    logo: "",
    primaryColor: trialInput.primaryColor,
  });
  await f.services.saveShipping(storeId, {
    ...settings,
    shipping: {
      mode: "areas",
      originPostalCode: "",
      fixedFeeCents: 500,
      perKmCents: 200,
      baseFeeCents: 0,
      minimumFeeCents: 0,
      maxDistanceKm: 10,
    },
  });
  await f.services.setOnline(storeId, true);
  await f.services.saveProduct(storeId, product);
  const end = read().trial!.endsAt;
  vi.setSystemTime(new Date(Date.parse(end) - 1));
  // The eight-hour session is refreshed with the existing password; the trial is not restarted.
  await f.auth.signIn(trialInput.email, trialInput.password);
  expect(trialState(read())?.expired).toBe(false);
  await f.services.saveProduct(storeId, { ...product, name: "Último instante" });
  expect(openState(read(), f.repo.getSnapshot().tenants[storeId]).open).toBe(true);
  vi.setSystemTime(new Date(end));
  const before = structuredClone(f.repo.getSnapshot());
  expect(trialState(read())?.expired).toBe(true);
  expect(openState(read(), f.repo.getSnapshot().tenants[storeId]).open).toBe(false);
  await expect(f.services.saveProduct(storeId, product)).rejects.toThrow(/7 dias/);
  await expect(
    f.services.configureStore(storeId, settings, {
      name: "Nova marca",
      logo: "",
      primaryColor: "#ffffff",
    }),
  ).rejects.toThrow(/7 dias/);
  await expect(
    f.auth.invite("Atendente", "atendente@example.com", "attendant", storeId),
  ).rejects.toThrow(/7 dias/);
  await expect(
    f.services.addToCart(storeId, {
      productId: product.id,
      quantity: 1,
      extraIds: [],
      removedIngredients: [],
      notes: "",
    }),
  ).rejects.toThrow(/indisponível/);
  await expect(
    f.services.checkout(storeId, before.tenants[storeId].cart.requestId, checkout),
  ).rejects.toThrow();
  await expect(f.services.activatePlan(storeId, "Rede")).rejects.toThrow(/acesso/);
  expect(f.repo.getSnapshot()).toEqual(before);
  await f.auth.signOut();
  await f.auth.signIn(trialInput.email, trialInput.password);
  expect(read().trial!.endsAt).toBe(end);
  await expect(f.services.setOnline(storeId, true)).rejects.toThrow(/7 dias/);
  await f.auth.startDemo("admin");
  await f.services.activatePlan(storeId, "Rede");
  expect(read().trial).toMatchObject({ endsAt: end, convertedAt: new Date(end).toISOString() });
  expect(trialState(read())).toBeNull();
  await f.auth.signIn(trialInput.email, trialInput.password);
  await f.services.saveProduct(storeId, product);
  expect(f.repo.getSnapshot().tenants[storeId].products).toHaveLength(1);
});

it("TRIAL-06 configuração da marca não permite trocar ID, plano ou prazo do teste", async () => {
  const f = await anonymous(),
    { storeId } = await f.auth.registerTrial(trialInput);
  const c = structuredClone(f.repo.getSnapshot().companies.find((c) => c.id === storeId)!);
  await f.services.configureStore(storeId, defaultsSettings(true), {
    name: "Marca atualizada",
    logo: "",
    primaryColor: "#ffffff",
    id: company.id,
    plan: "Rede",
    trial: {
      ...c.trial,
      convertedAt: new Date().toISOString(),
      endsAt: "2099-01-01T00:00:00.000Z",
    },
  } as any);
  const updated = f.repo.getSnapshot().companies.find((c) => c.id === storeId)!;
  expect(updated).toMatchObject({
    id: storeId,
    name: "Marca atualizada",
    plan: "Essencial",
    trial: c.trial,
  });
});
