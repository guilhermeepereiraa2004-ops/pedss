import { describe, it, expect } from "vitest";
import { createLocalRepository, WORKSPACE_KEY } from "../src/adapters/localRepository.ts";
import { migrateLegacy } from "../src/adapters/migration.ts";
import { initial, storage, company, product } from "./fixtures.ts";
const seed = { companies: [company], products: [{ ...product, price: 29.9 }], orders: [] };
describe("persistência e migração", () => {
  it("DATA-01 recupera arrays malformados e mantém cópia do original", () => {
    const db = storage();
    const state = initial();
    (state.tenants[company.id].products as unknown[]) = [null, product];
    const original = JSON.stringify(state);
    db.setItem(WORKSPACE_KEY, original);
    const repo = createLocalRepository(db, seed);
    expect(repo.getSnapshot().tenants[company.id].products).toHaveLength(1);
    expect(repo.warning).toContain("preservada");
    expect(
      [...db.values.entries()].some(
        ([k, v]) => k.startsWith("brasa.backup.invalid.") && v === original,
      ),
    ).toBe(true);
  });
  it("DATA-02 falha de armazenamento mantém o estado anterior sem sucesso falso", async () => {
    const db = storage();
    db.setItem(WORKSPACE_KEY, JSON.stringify(initial()));
    let fail = false;
    const repo = createLocalRepository(
      {
        ...db,
        setItem(key, value) {
          if (fail) throw new Error("Quota");
          db.setItem(key, value);
        },
      },
      seed,
    );
    fail = true;
    await expect(
      repo.transact((s) => {
        s.companies[0].name = "Não deve salvar";
      }),
    ).rejects.toThrow("Não foi possível salvar");
    expect(repo.getSnapshot().companies[0].name).toBe(company.name);
  });
  it("DATA-03 migra status legado, preço e pedidos sem inferir pagamento", () => {
    const db = storage();
    db.setItem("saas_companies", JSON.stringify([company]));
    db.setItem("company_status", "offline");
    db.setItem(
      "company_menu",
      JSON.stringify([
        { id: 1, name: "Legado", price: 19.9, category: "Hamburguer", status: "Disponível" },
      ]),
    );
    db.setItem(
      "company_orders",
      JSON.stringify([
        {
          id: "#1",
          customer: "Cliente anterior",
          items: "1x Legado",
          total: 19.9,
          status: "Entregue",
          date: "2026-10-20T15:00:00Z",
        },
      ]),
    );
    const state = migrateLegacy(db, seed);
    const t = state.tenants[company.id];
    expect(t.online).toBe(false);
    expect(t.products[0].priceCents).toBe(1990);
    expect(t.orders[0].paymentStatus).toBe("Pendente");
    expect(t.orders[0].legacyItems).toContain("Legado");
    expect(db.getItem("company_orders")).toContain("Cliente anterior");
  });
  it("DATA-04 preserva gravações concorrentes no mesmo adaptador", async () => {
    const db = storage(),
      repo = createLocalRepository(db, seed);
    await Promise.all([
      repo.transact((s) => {
        s.platform.description = "Atualizado";
      }),
      repo.transact((s) => {
        s.platform.name = "Outra central";
      }),
    ]);
    expect(repo.getSnapshot().platform).toMatchObject({
      name: "Outra central",
      description: "Atualizado",
    });
  });
});
