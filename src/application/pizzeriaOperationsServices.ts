import { z } from "zod";
import type { Identity, Permission, Workspace, Tenant } from "../core/model.ts";
import type { WorkspaceRepository } from "../core/ports.ts";
import { supplierSchema, purchaseInputSchema } from "../core/restaurantModel.ts";
import { restaurant } from "../core/restaurant.ts";
import { DomainError, transition, uuid } from "../core/domain.ts";
import { localDay } from "../core/calendar.ts";
import { pizzaWorkItems, pizzaStages, pizzaStageLabels } from "../core/pizzeriaOperations.ts";

export function createPizzeriaOperationsServices(
  repo: WorkspaceRepository,
  permit: (s: Workspace, permission: Permission, id: string) => Identity,
  tenant: (s: Workspace, id: string) => Tenant,
) {
  return {
    async saveSupplier(storeId: string, input: unknown) {
      const data = supplierSchema.parse(input);
      return repo.transact((s) => {
        permit(s, "catalog", storeId);
        const r = restaurant(tenant(s, storeId));
        if (
          r.suppliers.some(
            (v) => v.id !== data.id && v.name.toLocaleLowerCase() === data.name.toLocaleLowerCase(),
          )
        )
          throw new DomainError("Fornecedor já cadastrado.");
        const index = r.suppliers.findIndex((v) => v.id === data.id);
        if (index < 0) r.suppliers.push(data);
        else r.suppliers[index] = data;
      });
    },
    async receivePurchase(storeId: string, input: unknown) {
      const data = purchaseInputSchema.parse(input);
      return repo.transact((s) => {
        const actor = permit(s, "catalog", storeId),
          r = restaurant(tenant(s, storeId));
        const existing = r.purchases.find((p) => p.requestId === data.requestId);
        if (existing) {
          const saved = purchaseInputSchema.parse(existing);
          if (JSON.stringify(saved) !== JSON.stringify(data))
            throw new DomainError("Esta confirmação já foi usada com outra compra.");
          return;
        }
        const today = localDay(new Date());
        if (!r.suppliers.some((v) => v.id === data.supplierId))
          throw new DomainError("Escolha um fornecedor cadastrado.");
        if (data.receivedOn > today) throw new DomainError("Recebimento não pode estar no futuro.");
        const total = data.lines.reduce((sum, l) => sum + l.totalCents, 0);
        if (!Number.isSafeInteger(total) || total > 100_000_000)
          throw new DomainError("Valor total da compra inválido.");
        for (const row of data.lines) {
          const item = r.inventory.find((i) => i.id === row.ingredientId);
          if (!item || item.stock + row.quantity > 1e9)
            throw new DomainError("Revise o ingrediente e a quantidade da compra.");
          if (row.expiresOn && (row.expiresOn < today || row.expiresOn < data.receivedOn))
            throw new DomainError(
              "Não receba lote vencido ou com validade anterior ao recebimento.",
            );
          const stock = Math.round((item.stock + row.quantity) * 10000) / 10000;
          const cost =
            Math.round(((item.stock * item.costPerUnitCents + row.totalCents) / stock) * 1e6) / 1e6;
          if (!Number.isFinite(cost) || cost > 1e8)
            throw new DomainError("Revise o custo e a unidade do ingrediente nesta compra.");
          item.costPerUnitCents = cost;
          item.stock = stock;
          r.movements.push({
            id: uuid(),
            ingredientId: item.id,
            quantity: row.quantity,
            reason: `Compra${data.invoice ? ` ${data.invoice}` : ""}${row.batch ? ` · lote ${row.batch}` : ""}`,
            at: new Date().toISOString(),
          });
        }
        r.purchases.push({
          ...data,
          id: uuid(),
          at: new Date().toISOString(),
          actor: actor.name,
          totalCents: total,
        });
      });
    },
    async changePizzaProduction(storeId: string, orderId: string, input: unknown) {
      const data = z
        .object({
          key: z.string().min(1).max(600),
          stage: z.enum(["preparing", "baking", "ready"]),
          requestId: z.string().min(1).max(120),
          expectedUpdatedAt: z.string().min(1),
        })
        .parse(input);
      return repo.transact((s) => {
        const actor = permit(s, "orders", storeId),
          t = tenant(s, storeId);
        const index = t.orders.findIndex((o) => o.id === orderId),
          order = t.orders[index];
        if (!order) throw new DomainError("Pedido não encontrado.");
        const duplicate = order.production?.find((p) => p.requestId === data.requestId);
        if (duplicate) {
          if (duplicate.key !== data.key || duplicate.stage !== data.stage)
            throw new DomainError("Confirmação já usada em outra etapa.");
          return order;
        }
        if (order.updatedAt !== data.expectedUpdatedAt)
          throw new DomainError("Este pedido mudou. Confira o pedido novamente.");
        if (!["Aceito", "Preparando"].includes(order.status))
          throw new DomainError(
            "Aceite o pedido antes de iniciar a produção. Pedidos concluídos não podem ser alterados.",
          );
        const item = pizzaWorkItems(order).find((p) => p.key === data.key);
        if (!item || pizzaStages.indexOf(data.stage) !== pizzaStages.indexOf(item.stage) + 1)
          throw new DomainError("Etapa de produção inválida.");
        if ((order.production?.length || 0) >= 900)
          throw new DomainError("Limite de registros de produção atingido.");
        const at = new Date(Math.max(Date.now(), Date.parse(order.updatedAt) + 1)).toISOString();
        const next =
          order.status === "Aceito" ? transition(order, "Preparando", actor.name) : order;
        t.orders[index] = {
          ...next,
          updatedAt: at,
          production: [...(order.production || []), { ...data, at, actor: actor.name }],
          history: [
            ...next.history,
            {
              id: uuid(),
              at,
              actor: actor.name,
              kind: "production",
              from: pizzaStageLabels[item.stage],
              to: pizzaStageLabels[data.stage],
              reason: `${item.name} · ${item.size}`,
            },
          ],
        };
        return t.orders[index];
      });
    },
  };
}
