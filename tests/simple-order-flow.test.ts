import { expect, it } from "vitest";
import { orderFixture } from "./order-amendment-fixture.ts";
import { company } from "./fixtures.ts";
import { nextStatuses } from "../src/core/domain.ts";
import { pizzaWorkItems } from "../src/core/pizzeriaOperations.ts";

it.each(["delivery", "pickup", "table"] as const)(
  "SIMPLE-ORDER-01 %s segue os status de 30/10 sem depender da cozinha",
  async (kind) => {
    const f = await orderFixture();
    const current = () => f.repo.getSnapshot().tenants[company.id].orders[0];
    await f.repo.transact((s) => {
      const o = s.tenants[company.id].orders[0];
      o.fulfillment = kind === "delivery" ? "delivery" : "pickup";
      o.channel = kind === "table" ? "table" : "site";
    });
    await expect(f.services.changeOrder(company.id, f.order.id, "Entregue")).rejects.toThrow();
    await f.services.changeOrder(company.id, f.order.id, "Aceito");
    await f.services.changeOrder(company.id, f.order.id, "Preparando");
    const work = pizzaWorkItems(current());
    expect(work.length).toBeGreaterThan(0);
    await f.repo.transact((s) => {
      s.tenants[company.id].orders[0].production = [
        {
          key: work[0].key,
          stage: "preparing",
          at: new Date().toISOString(),
          requestId: "legacy-production",
        },
      ];
    });
    const ready = kind === "delivery" ? "A caminho" : "Pronto para retirada";
    expect(nextStatuses(current())).toEqual([ready, "Cancelado"]);
    const history = structuredClone(current().production);
    await expect(f.services.changeOrder(company.id, f.order.id, "Entregue")).rejects.toThrow();
    await f.services.changeOrder(company.id, f.order.id, ready, "", current().updatedAt);
    await f.services.changeOrder(company.id, f.order.id, "Entregue", "", current().updatedAt);
    expect(current().status).toBe("Entregue");
    expect(current().paymentStatus).toBe("Pendente");
    expect(current().production).toEqual(history);
    expect(
      current()
        .history.filter((e) => e.kind === "order")
        .map((e) => e.to),
    ).toEqual(["Pendente", "Aceito", "Preparando", ready, "Entregue"]);
  },
);

it.each(["A caminho", "Pronto para retirada"] as const)(
  "SIMPLE-ORDER-01 pedido antigo %s continua podendo concluir",
  async (status) => {
    const f = await orderFixture();
    await f.repo.transact((s) => {
      s.tenants[company.id].orders[0].status = status;
    });
    await f.services.changeOrder(company.id, f.order.id, "Entregue");
    expect(f.repo.getSnapshot().tenants[company.id].orders[0].status).toBe("Entregue");
  },
);
