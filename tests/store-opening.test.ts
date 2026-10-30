import { describe, expect, it } from "vitest";
import { storeOpeningStatus } from "../src/core/storeOpening.ts";
import { emptyTenant } from "../src/core/domain.ts";
import { company } from "./fixtures.ts";

describe("motivos de indisponibilidade do atendimento", () => {
  it("OPEN-01 frete legado sem áreas explica o que salvar, mesmo com online ativado", () => {
    const tenant = emptyTenant();
    const result = storeOpeningStatus(company, tenant);
    expect(tenant.online).toBe(true);
    expect(result.availability.open).toBe(false);
    expect(result.blockers).toEqual([
      expect.objectContaining({ code: "fulfillment", target: "shipping" }),
    ]);
    expect(result.blockers[0].message).toMatch(/não há áreas de entrega salvas/);
    expect(result.schedule).toBeNull();
  });
  it("OPEN-02 retirada configurada ou área salva liberam atendimento, sem exigir os dois", () => {
    const tenant = emptyTenant(true);
    tenant.settings.deliveryEnabled = false;
    expect(storeOpeningStatus(company, tenant).availability.open).toBe(true);
    tenant.settings.deliveryEnabled = true;
    tenant.settings.pickupEnabled = false;
    expect(storeOpeningStatus(company, tenant).availability.open).toBe(true);
    expect(storeOpeningStatus(company, tenant).blockers).toEqual([]);
  });
  it("OPEN-03 fora do horário explica programação e não confunde com frete incompleto", () => {
    const tenant = emptyTenant(true);
    tenant.online = false;
    tenant.settings.scheduleEnabled = true;
    tenant.settings.hours.forEach((hour) => (hour.enabled = false));
    const result = storeOpeningStatus(company, tenant, new Date("2026-10-30T15:00:00Z"));
    expect(result.blockers).toEqual([]);
    expect(result.schedule).toMatchObject({ code: "schedule", target: "settings" });
    expect(result.schedule?.message).toMatch(/não abre a loja fora do horário/);
    expect(tenant.online).toBe(false);
  });
  it("OPEN-04 acumula pausa da central e configuração, sem ocultar uma pendência pela outra", () => {
    const result = storeOpeningStatus({ ...company, status: "Pausado" }, emptyTenant());
    expect(result.blockers.map((issue) => issue.code)).toEqual(["paused", "fulfillment"]);
    expect(result.schedule).toBeNull();
  });
});
