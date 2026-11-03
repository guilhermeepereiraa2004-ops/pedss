import { expect, it } from "vitest";
import { compactStoreSlug, resolveStoreCompany, storeSubdomain } from "../src/core/storeAddress.ts";
import { requireAvailableStoreSlug } from "../src/core/domain.ts";
import { company } from "./fixtures.ts";

it("SUBDOMAIN-01 reconhece somente subdomínios válidos da plataforma e mantém www/reservados separados", () => {
  expect(storeSubdomain("ciadapizza.pedss.com.br")).toBe("ciadapizza");
  expect(storeSubdomain("CIA-DA-PIZZA.PEDSS.COM.BR.")).toBe("cia-da-pizza");
  expect(storeSubdomain("cia-da-pizza.localhost")).toBe("cia-da-pizza");
  for (const host of [
    "www.pedss.com.br",
    "admin.pedss.com.br",
    "superadmin.pedss.com.br",
    "pedss.com.br",
    "ciadapizza.pedss.com.br.evil.test",
    "a.b.pedss.com.br",
    "-a.pedss.com.br",
    "127.0.0.1",
  ])
    expect(storeSubdomain(host)).toBe("");
  expect(storeSubdomain("shop.example.com", "example.com")).toBe("shop");
});

it("SUBDOMAIN-02 alias sem hífen preserva IDs e não escolhe lojas ambíguas", () => {
  const cia = { ...company, slug: "cia-da-pizza" };
  expect(compactStoreSlug(cia.slug)).toBe("ciadapizza");
  expect(resolveStoreCompany([cia], "ciadapizza")).toBe(cia);
  expect(resolveStoreCompany([cia], cia.slug)).toBe(cia);
  expect(resolveStoreCompany([cia], cia.id)).toBe(cia);
  const duplicate = { ...cia, id: "other", slug: "ciadapizz-a" };
  expect(resolveStoreCompany([cia, duplicate], "ciadapizza")).toBeUndefined();
  const exact = { ...cia, id: "exact", slug: "ciadapizza" };
  expect(resolveStoreCompany([cia, exact], "ciadapizza")).toBe(exact);
});

it("SUBDOMAIN-03 reserva aliases de lojas arquivadas e impede colisão em novos cadastros", () => {
  const cia = { ...company, slug: "cia-da-pizza", archived: true };
  expect(() => requireAvailableStoreSlug([cia], "ciadapizza")).toThrow("utilizado");
  expect(() => requireAvailableStoreSlug([cia], cia.slug, cia.id)).not.toThrow();
  expect(() => requireAvailableStoreSlug([], "superadmin")).toThrow("reservado");
});
