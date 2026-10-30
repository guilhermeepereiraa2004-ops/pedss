import { expect, it } from "vitest";
import { fixture, company, product } from "./fixtures.ts";
import { repairLocalCiaCombo } from "../src/application/localCiaComboRepair.ts";
import { comboLines } from "../src/core/restaurant.ts";
import { priceLine } from "../src/core/domain.ts";

async function setup() {
  const f = await fixture("admin");
  await f.repo.transact((s) => {
    s.companies[0].slug = "cia-da-pizza";
    const pizzas = ["Calabresa", "Mussarela", "Margherita"].map((name, i) => ({
      ...product,
      id: `pizza-${i}`,
      name,
      category: "Pizza",
      priceCents: 3990 + i * 500,
      image: `/own-${i}.png`,
      extras: [],
    }));
    s.tenants[company.id].products = [
      ...pizzas,
      {
        ...product,
        id: "existing-combo-id",
        name: "Super Combo",
        priceCents: 18000,
        category: "Pizza",
        description: "Super combo brabo",
        extras: [],
        combo: {
          groups: [
            {
              id: "original-group-id",
              name: "Super combo",
              quantity: 1,
              options: pizzas.map((p) => ({ productId: p.id, surchargeCents: 0 })),
            },
          ],
        },
      },
    ];
  });
  return f;
}
it("CIA-COMBO-01 corrige somente o cadastro autorizado, inclui as três pizzas e preserva preço/fotos/dados", async () => {
  const f = await setup();
  const before = structuredClone(f.repo.getSnapshot());
  expect(await repairLocalCiaCombo(f.repo, f.auth)).toBe(true);
  const after = f.repo.getSnapshot(),
    tenant = after.tenants[company.id];
  const combo = tenant.products.find((p) => p.id === "existing-combo-id")!;
  expect(combo.combo!.groups.map((g) => [g.name, g.quantity, g.options.length])).toEqual([
    ["Calabresa", 1, 1],
    ["Mussarela", 1, 1],
    ["Margherita", 1, 1],
  ]);
  expect(combo.combo!.groups[0].id).toBe("original-group-id");
  expect({ ...combo, combo: undefined }).toEqual({
    ...before.tenants[company.id].products[3],
    combo: undefined,
  });
  expect(tenant.products.slice(0, 3)).toEqual(before.tenants[company.id].products.slice(0, 3));
  expect({ ...tenant, products: [] }).toEqual({ ...before.tenants[company.id], products: [] });
  expect(after.companies).toEqual(before.companies);
  expect(after.users).toEqual(before.users);
  const line = {
    key: "test",
    productId: combo.id,
    quantity: 1,
    extraIds: [],
    removedIngredients: [],
    notes: "",
    comboChoices: combo.combo!.groups.map((g) => ({
      groupId: g.id,
      productId: g.options[0].productId,
    })),
  };
  await f.services.addToCart(company.id, line);
  const saved = f.repo.getSnapshot().tenants[company.id].cart.lines[0];
  expect(comboLines(saved, tenant.products).map((c) => c.productId)).toEqual([
    "pizza-0",
    "pizza-1",
    "pizza-2",
  ]);
  expect(priceLine(saved, tenant.products).totalCents).toBe(18000);
  const current = structuredClone(f.repo.getSnapshot());
  expect(await repairLocalCiaCombo(f.repo, f.auth)).toBe(false);
  expect(f.repo.getSnapshot()).toEqual(current);
});
it("CIA-COMBO-02 não altera outras lojas, outros preços ou composição já personalizada", async () => {
  for (const variant of [
    "other-store",
    "other-price",
    "different-flavor",
    "quantity",
    "surcharge",
  ]) {
    const f = await setup();
    await f.repo.transact((s) => {
      const c = s.tenants[company.id].products[3];
      if (variant === "other-store") s.companies[0].slug = "outra-pizzaria";
      if (variant === "other-price") c.priceCents = 19000;
      if (variant === "different-flavor") s.tenants[company.id].products[2].name = "Portuguesa";
      if (variant === "quantity") c.combo!.groups[0].quantity = 3;
      if (variant === "surcharge") c.combo!.groups[0].options[0].surchargeCents = 100;
    });
    const before = structuredClone(f.repo.getSnapshot());
    expect(await repairLocalCiaCombo(f.repo, f.auth)).toBe(false);
    expect(f.repo.getSnapshot()).toEqual(before);
  }
});
it("CIA-COMBO-03 exige autorização de gestão central antes da correção", async () => {
  const f = await fixture();
  const before = structuredClone(f.repo.getSnapshot());
  await expect(repairLocalCiaCombo(f.repo, f.auth)).rejects.toThrow();
  expect(f.repo.getSnapshot()).toEqual(before);
});
