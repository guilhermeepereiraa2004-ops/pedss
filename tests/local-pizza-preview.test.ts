import { expect, it } from "vitest";
import { fixture } from "./fixtures.ts";
import { LOCAL_CIA_ID, prepareLocalPizzaPreview } from "../src/application/localPizzaPreview.ts";

it("LOCAL-PIZZA-01 restores catalog and builder without replacing other shops or later edits", async () => {
  const f = await fixture("admin");
  const before = structuredClone(f.repo.getSnapshot());
  await prepareLocalPizzaPreview(f.repo, f.auth);
  const next = f.repo.getSnapshot();
  expect(next.companies.find((c) => c.id === LOCAL_CIA_ID)?.slug).toBe("cia-da-pizza");
  expect(next.tenants[LOCAL_CIA_ID].products).toHaveLength(15);
  expect(next.tenants[LOCAL_CIA_ID].products.filter((p) => !p.pizza)).toHaveLength(14);
  expect(next.tenants[LOCAL_CIA_ID].products.find((p) => p.pizza)?.pizza?.flavors).toHaveLength(14);
  expect(next.tenants[LOCAL_CIA_ID].settings.heroSegment).toBe("pizza");
  expect(next.tenants[LOCAL_CIA_ID].orders).toEqual([]);
  for (const [id, tenant] of Object.entries(before.tenants))
    expect(next.tenants[id]).toEqual(tenant);
  expect(next.users).toEqual(before.users);
  expect(next.sessions).toEqual(before.sessions);
  await f.repo.transact((s) => {
    s.tenants[LOCAL_CIA_ID].products[0].priceCents = 12345;
  });
  const edited = structuredClone(f.repo.getSnapshot());
  await prepareLocalPizzaPreview(f.repo, f.auth);
  expect(f.repo.getSnapshot()).toEqual(edited);
});

it("LOCAL-PIZZA-02 requires central admin and preserves a conflicting existing address", async () => {
  const f = await fixture();
  const before = structuredClone(f.repo.getSnapshot());
  await expect(prepareLocalPizzaPreview(f.repo, f.auth)).rejects.toThrow();
  expect(f.repo.getSnapshot()).toEqual(before);
  const admin = await fixture("admin");
  await admin.repo.transact((s) => {
    s.companies[0].slug = "cia-da-pizza";
  });
  const conflict = structuredClone(admin.repo.getSnapshot());
  await prepareLocalPizzaPreview(admin.repo, admin.auth);
  expect(admin.repo.getSnapshot()).toEqual(conflict);
});
