import { z } from "zod";
import type { WorkspaceRepository } from "../core/ports.ts";
import {
  cartLineSchema,
  checkoutSchema,
  productSchema,
  type Workspace,
  type Identity,
  type Permission,
  type Company,
} from "../core/model.ts";
import { restaurantSchema, recipeSchema } from "../core/restaurantModel.ts";
import {
  restaurant,
  reserveStock,
  cashSummary,
  comboLines,
  validateSchedule,
} from "../core/restaurant.ts";
import { DomainError, uuid, iso, makeOrder, priceLine } from "../core/domain.ts";
import { minimumPizzaPrice } from "../core/pizza.ts";
import { markReplacedPizzaExtras } from "../core/catalogRules.ts";
import { appendPayment, dueCents, paidCents, paymentLedger } from "../core/payments.ts";
function singleFlavorConfig(
  config: NonNullable<Workspace["tenants"][string]["products"][number]["pizza"]>,
  flavor: NonNullable<Workspace["tenants"][string]["products"][number]["pizza"]>["flavors"][number],
) {
  return {
    ...structuredClone(config),
    menuPlacement: "catalog" as const,
    sizes: config.sizes.map((s) => ({
      ...structuredClone(s),
      allowedFlavorCounts: undefined,
      available:
        s.available &&
        (config.pricing === "fixed" ? flavor.prices[s.id] !== 0 : (flavor.prices[s.id] || 0) > 0),
    })),
    flavors: [{ ...structuredClone(flavor), available: true }],
  };
}

export function syncPizzaCatalog(
  products: Workspace["tenants"][string]["products"],
  savedId: string,
  previous?: Workspace["tenants"][string]["products"][number],
) {
  const saved = products.find((p) => p.id === savedId)!;
  if (!saved.pizza) return;
  if (saved.pizza.flavors.length === 1 && saved.pizza.flavors[0].sourceProductId === saved.id) {
    const current = saved.pizza.flavors[0],
      before = previous?.pizza?.flavors[0];
    if (before && current.name !== before.name && saved.name === previous!.name)
      saved.name = current.name;
    if (before && JSON.stringify(current.ingredients) !== JSON.stringify(before.ingredients))
      saved.ingredients = current.ingredients || [];
    if (before && JSON.stringify(current.allergens) !== JSON.stringify(before.allergens))
      saved.allergens = current.allergens || [];
  }
  if (saved.pizza.flavors.length > 1) {
    for (const f of saved.pizza.flavors) {
      if (!f.sourceProductId) continue;
      const source = products.find((p) => p.id === f.sourceProductId);
      if (!source?.pizza || source.pizza.flavors.length !== 1)
        throw new DomainError("Vínculo de sabor inválido. Revise o catálogo.");
      source.pizza = singleFlavorConfig(saved.pizza, { ...f, sourceProductId: source.id });
      source.extras = markReplacedPizzaExtras(source).extras;
      source.name = f.name;
      source.ingredients = f.ingredients || source.ingredients;
      source.allergens = f.allergens || source.allergens;
      source.status = f.available ? "Disponível" : "Indisponível";
      source.priceCents = minimumPizzaPrice(source.pizza);
    }
  }
  const sources = products.filter(
    (p) => p.pizza?.flavors.length === 1 && p.pizza.flavors[0].sourceProductId === p.id,
  );
  for (const source of sources) {
    const canonical = source.pizza!.flavors[0];
    canonical.name = source.name;
    canonical.ingredients = source.ingredients;
    canonical.allergens = source.allergens;
    for (const p of products) {
      if (p.id === source.id || !p.pizza) continue;
      p.pizza.flavors = p.pizza.flavors.map((f) =>
        f.sourceProductId !== source.id
          ? f
          : {
              ...structuredClone(canonical),
              id: f.id,
              name: source.name,
              ingredients: source.ingredients,
              allergens: source.allergens,
              available: source.status === "Disponível",
              previewImage: source.cutoutImage || canonical.previewImage,
            },
      );
      p.priceCents = minimumPizzaPrice(p.pizza);
    }
  }
}
export function createRestaurantServices(
  repo: WorkspaceRepository,
  permit: (state: Workspace, permission: Permission, id?: string) => Identity,
  company: (state: Workspace, id: string) => Company,
) {
  const store = (state: Workspace, id: string) => {
    company(state, id);
    const t = state.tenants[id];
    if (!t) throw new DomainError("Loja não encontrada.");
    return t;
  };
  const parse = <T>(schema: z.ZodType<T>, input: unknown): T => {
    const v = schema.safeParse(input);
    if (!v.success) throw new DomainError(v.error.issues[0]?.message || "Revise os campos.");
    return v.data;
  };
  return {
    async linkPizzaCatalog(storeId: string, productId: string) {
      return repo.transact((state) => {
        permit(state, "catalog", storeId);
        const t = store(state, storeId),
          p = t.products.find((p) => p.id === productId);
        if (!p?.pizza) throw new DomainError("Selecione um montador.");
        for (const f of p.pizza.flavors) {
          if (f.sourceProductId) continue;
          const matches = t.products.filter(
            (v) =>
              v.id !== p.id &&
              v.category === "Pizza" &&
              v.name.toLocaleLowerCase() === f.name.toLocaleLowerCase(),
          );
          if (matches.length > 1)
            throw new DomainError(
              `Há produtos repetidos com o nome ${f.name}. Renomeie antes de vincular.`,
            );
          let source = matches[0];
          if (
            source?.pizza &&
            (source.pizza.flavors.length !== 1 ||
              (source.pizza.flavors[0].sourceProductId &&
                source.pizza.flavors[0].sourceProductId !== source.id))
          )
            throw new DomainError(`Revise o vínculo de ${f.name} antes de continuar.`);
          if (!source) {
            source = productSchema.parse({
              id: uuid(),
              name: f.name,
              category: "Pizza",
              priceCents: p.priceCents,
              status: f.available ? "Disponível" : "Indisponível",
            });
            t.products.push(source);
          }
          f.sourceProductId = source.id;
          f.ingredients = f.ingredients || source.ingredients;
          f.allergens = f.allergens || source.allergens;
          source.pizza = singleFlavorConfig(p.pizza, f);
        }
        syncPizzaCatalog(t.products, p.id);
      });
    },
    async saveInventoryItem(storeId: string, input: unknown) {
      const item = parse(restaurantSchema.shape.inventory.unwrap().element, input);
      return repo.transact((state) => {
        permit(state, "catalog", storeId);
        const r = restaurant(store(state, storeId));
        const current = r.inventory.find((i) => i.id === item.id);
        if (
          r.inventory.some(
            (i) => i.id !== item.id && i.name.toLowerCase() === item.name.toLowerCase(),
          )
        )
          throw new DomainError("Já existe um ingrediente com este nome.");
        if (current) {
          if (current.unit !== item.unit)
            throw new DomainError("A unidade de um ingrediente cadastrado é imutável.");
          Object.assign(current, { ...item, stock: current.stock });
        } else {
          r.inventory.push(item);
          if (item.stock)
            r.movements.push({
              id: uuid(),
              ingredientId: item.id,
              quantity: item.stock,
              reason: "Saldo inicial",
              at: iso(),
            });
        }
      });
    },
    async adjustStock(storeId: string, ingredientId: string, quantity: number, reason: string) {
      return repo.transact((state) => {
        permit(state, "catalog", storeId);
        if (
          !Number.isFinite(quantity) ||
          !quantity ||
          Math.abs(quantity) > 1e9 ||
          !reason.trim() ||
          reason.length > 200
        )
          throw new DomainError("Informe quantidade e motivo válidos.");
        const r = restaurant(store(state, storeId)),
          item = r.inventory.find((i) => i.id === ingredientId);
        if (!item || item.stock + quantity < 0)
          throw new DomainError("Saldo insuficiente ou ingrediente inexistente.");
        item.stock += quantity;
        r.movements.push({ id: uuid(), ingredientId, quantity, reason, at: iso() });
      });
    },
    async saveRecipe(
      storeId: string,
      productId: string,
      target: {
        kind: "product" | "flavor" | "dough" | "edge" | "flavorExtra" | "extra";
        id?: string;
        sizeId?: string;
        extraId?: string;
      },
      input: unknown,
    ) {
      const recipe = parse(recipeSchema, input);
      return repo.transact((state) => {
        permit(state, "catalog", storeId);
        const t = store(state, storeId),
          r = restaurant(t),
          p = t.products.find((p) => p.id === productId);
        if (
          !p ||
          recipe.some((row) => !r.inventory.some((i) => i.id === row.ingredientId)) ||
          new Set(recipe.map((v) => v.ingredientId)).size !== recipe.length
        )
          throw new DomainError("Revise os ingredientes da ficha técnica.");
        if (target.kind === "product") p.recipe = recipe;
        else if (target.kind === "extra") {
          const e = p.extras.find((e) => e.id === target.extraId);
          if (!e) throw new DomainError("Adicional não encontrado.");
          e.recipe = recipe;
        } else if (target.kind === "flavor") {
          const f = p.pizza?.flavors.find((f) => f.id === target.id);
          if (!f || !p.pizza?.sizes.some((s) => s.id === target.sizeId))
            throw new DomainError("Sabor/tamanho inválido.");
          f.recipeBySize = { ...f.recipeBySize, [target.sizeId!]: recipe };
        } else if (target.kind === "flavorExtra") {
          const extra = p.pizza?.flavors
            .find((f) => f.id === target.id)
            ?.extras?.find((e) => e.id === target.extraId);
          if (!extra) throw new DomainError("Adicional não encontrado.");
          extra.recipe = recipe;
        } else {
          const option = (target.kind === "dough" ? p.pizza?.doughs : p.pizza?.edges)?.find(
            (o) => o.id === target.id,
          );
          if (!option) throw new DomainError("Opção não encontrada.");
          option.recipe = recipe;
          const linkedIds = new Set([
            p.id,
            ...(p.pizza?.flavors.map((f) => f.sourceProductId).filter(Boolean) || []),
          ]);
          for (const related of t.products) {
            if (!related.pizza || related.id === p.id) continue;
            if (
              linkedIds.has(related.id) ||
              related.pizza.flavors.some((f) => linkedIds.has(f.sourceProductId || ""))
            ) {
              const shared = (
                target.kind === "dough" ? related.pizza.doughs : related.pizza.edges
              ).find((o) => o.id === target.id);
              if (shared) shared.recipe = structuredClone(recipe);
            }
          }
        }
        syncPizzaCatalog(t.products, p.id);
      });
    },
    async saveScheduling(storeId: string, input: unknown) {
      const config = parse(restaurantSchema.shape.scheduling, input);
      return repo.transact((state) => {
        permit(state, "settings", storeId);
        restaurant(store(state, storeId)).scheduling = config;
      });
    },
    async openCash(storeId: string, openingCents: number) {
      return repo.transact((state) => {
        const actor = permit(state, "finance", storeId),
          r = restaurant(store(state, storeId));
        parse(z.number().int().min(0).max(100_000_000), openingCents);
        if (r.cashSessions.some((s) => !s.closedAt))
          throw new DomainError("Já existe um caixa aberto.");
        r.cashSessions.push({
          id: uuid(),
          openedAt: iso(),
          openedBy: actor.name,
          openingCents,
          movements: [],
        });
      });
    },
    async recordOrderPayment(storeId: string, orderId: string, input: unknown) {
      const data = parse(
        z.object({
          requestId: z.string().min(1).max(120),
          kind: z.enum(["receipt", "refund"]),
          amountCents: z.number().int().positive().max(100_000_000),
          method: z.string(),
          reason: z.string().max(200).default(""),
          expectedUpdatedAt: z.string().optional(),
        }),
        input,
      );
      return repo.transact((state) => {
        const actor = permit(state, "finance", storeId),
          t = store(state, storeId),
          index = t.orders.findIndex((o) => o.id === orderId);
        if (index < 0) throw new DomainError("Pedido não encontrado.");
        const order = t.orders[index];
        if (order.payments?.some((p) => p.requestId === data.requestId)) return order;
        if (data.expectedUpdatedAt && data.expectedUpdatedAt !== order.updatedAt)
          throw new DomainError("Pedido atualizado. Confira o saldo novamente.");
        if (
          !t.settings.paymentMethods.includes(
            data.method as (typeof t.settings.paymentMethods)[number],
          ) &&
          !(
            data.kind === "refund" &&
            paymentLedger(order).some((p) => p.kind === "receipt" && p.method === data.method)
          )
        )
          throw new DomainError("Forma de pagamento indisponível.");
        t.orders[index] = appendPayment(
          order,
          data,
          actor.name,
          t.restaurant?.cashSessions.find((s) => !s.closedAt)?.id || "unassigned",
          data.kind === "refund"
            ? data.reason
            : data.reason || "Recebimento parcial conferido manualmente",
        );
        return t.orders[index];
      });
    },
    async payTab(storeId: string, tabId: string, input: unknown) {
      const data = parse(
        z.object({
          requestId: z.string().min(1).max(120),
          amountCents: z.number().int().positive().max(100_000_000),
          method: z.string(),
          orderIds: z.array(z.string()).optional(),
        }),
        input,
      );
      return repo.transact((state) => {
        const actor = permit(state, "finance", storeId),
          t = store(state, storeId),
          r = restaurant(t);
        if (t.orders.some((o) => o.payments?.some((p) => p.requestId === data.requestId))) return;
        if (!r.tabs.some((t) => t.id === tabId && !t.closedAt))
          throw new DomainError("Comanda não está aberta.");
        if (
          !t.settings.paymentMethods.includes(
            data.method as (typeof t.settings.paymentMethods)[number],
          )
        )
          throw new DomainError("Selecione uma forma de pagamento aceita.");
        const orders = t.orders
          .filter(
            (o) =>
              o.tabId === tabId &&
              o.status !== "Cancelado" &&
              (!data.orderIds || data.orderIds.includes(o.id)),
          )
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const due = orders.reduce((s, o) => s + dueCents(o), 0);
        if (
          data.orderIds &&
          (new Set(data.orderIds).size !== data.orderIds.length ||
            orders.length !== data.orderIds.length)
        )
          throw new DomainError("A seleção de pedidos mudou. Revise a comanda antes de receber.");
        if (data.amountCents > due)
          throw new DomainError("O recebimento supera o saldo dos pedidos selecionados.");
        let remaining = data.amountCents;
        for (const order of orders) {
          const amount = Math.min(remaining, dueCents(order));
          if (!amount) continue;
          const index = t.orders.findIndex((o) => o.id === order.id);
          t.orders[index] = appendPayment(
            order,
            { ...data, kind: "receipt", amountCents: amount },
            actor.name,
            r.cashSessions.find((s) => !s.closedAt)?.id || "unassigned",
            "Pagamento de comanda conferido manualmente",
          );
          remaining -= amount;
        }
      });
    },
    async transferTab(storeId: string, tabId: string, targetTableId: string, orderIds?: string[]) {
      return repo.transact((state) => {
        const actor = permit(state, "orders", storeId),
          t = store(state, storeId),
          r = restaurant(t),
          tab = r.tabs.find((v) => v.id === tabId && !v.closedAt),
          target = r.tables.find((v) => v.id === targetTableId && v.enabled);
        if (!tab || !target || tab.tableId === targetTableId)
          throw new DomainError("Selecione outra mesa disponível.");
        const targetTab = r.tabs.find((v) => v.tableId === targetTableId && !v.closedAt),
          from = r.tables.find((v) => v.id === tab.tableId)?.name || "Mesa";
        let destination = tab;
        const candidates = t.orders.filter(
          (o) => o.tabId === tabId && (!orderIds || orderIds.includes(o.id)),
        );
        if (orderIds) {
          if (
            !orderIds.length ||
            new Set(orderIds).size !== orderIds.length ||
            candidates.length !== orderIds.length ||
            candidates.some((o) => o.status === "Cancelado" || paidCents(o) > 0)
          )
            throw new DomainError("Selecione pedidos sem pagamento para dividir a comanda.");
          destination = targetTab || {
            id: uuid(),
            tableId: target.id,
            customer: tab.customer,
            openedAt: iso(),
          };
          if (!targetTab) r.tabs.push(destination);
        } else {
          if (targetTab)
            throw new DomainError(
              "A mesa está ocupada. Transfira pedidos selecionados para juntar as comandas.",
            );
          tab.tableId = target.id;
        }
        for (const o of candidates) {
          o.tabId = destination.id;
          o.tableName = target.name;
          const at = new Date(Math.max(Date.now(), Date.parse(o.updatedAt) + 1)).toISOString();
          o.updatedAt = at;
          o.history.push({
            id: uuid(),
            at,
            actor: actor.name,
            kind: "order",
            from: o.status,
            to: o.status,
            reason: `${orderIds ? "Divisão de comanda" : "Transferência de mesa"}: ${from} → ${target.name}`,
          });
        }
        if (orderIds && !t.orders.some((o) => o.tabId === tab.id && o.status !== "Cancelado"))
          tab.closedAt = iso();
        return destination;
      });
    },
    async moveCash(storeId: string, input: unknown) {
      const m = parse(
        z.object({
          kind: z.enum(["supply", "withdrawal"]),
          amountCents: z.number().int().positive().max(100_000_000),
          reason: z.string().trim().min(1).max(200),
        }),
        input,
      );
      return repo.transact((state) => {
        permit(state, "finance", storeId);
        const t = store(state, storeId),
          s = restaurant(t).cashSessions.find((s) => !s.closedAt);
        if (!s) throw new DomainError("Abra o caixa primeiro.");
        if (m.kind === "withdrawal" && m.amountCents > cashSummary(t, s).expectedCents)
          throw new DomainError("Sangria maior que o saldo em dinheiro.");
        s.movements.push({ ...m, id: uuid(), at: iso() });
      });
    },
    async closeCash(storeId: string, countedCents: number) {
      return repo.transact((state) => {
        const actor = permit(state, "finance", storeId),
          t = store(state, storeId),
          s = restaurant(t).cashSessions.find((s) => !s.closedAt);
        parse(z.number().int().min(0).max(100_000_000), countedCents);
        if (!s) throw new DomainError("Nenhum caixa aberto.");
        Object.assign(s, cashSummary(t, s), {
          closedAt: iso(),
          closedBy: actor.name,
          countedCents,
        });
      });
    },
    async saveTable(storeId: string, input: unknown) {
      const table = parse(restaurantSchema.shape.tables.unwrap().element, input);
      return repo.transact((state) => {
        permit(state, "settings", storeId);
        const r = restaurant(store(state, storeId));
        if (
          r.tables.some(
            (t) => t.id !== table.id && t.name.toLowerCase() === table.name.toLowerCase(),
          )
        )
          throw new DomainError("Nome de mesa repetido.");
        const current = r.tables.find((t) => t.id === table.id);
        if (!table.enabled && r.tabs.some((t) => t.tableId === table.id && !t.closedAt))
          throw new DomainError("Encerre a comanda antes de desativar a mesa.");
        if (current) Object.assign(current, table);
        else r.tables.push(table);
      });
    },
    async openTab(storeId: string, tableId: string, customer: string) {
      return repo.transact((state) => {
        permit(state, "orders", storeId);
        const r = restaurant(store(state, storeId));
        if (
          !r.tables.some((t) => t.id === tableId && t.enabled) ||
          r.tabs.some((t) => t.tableId === tableId && !t.closedAt)
        )
          throw new DomainError("Mesa indisponível ou já ocupada.");
        const tab = {
          id: uuid(),
          tableId,
          customer: parse(z.string().trim().max(70), customer),
          openedAt: iso(),
        };
        r.tabs.push(tab);
        return tab;
      });
    },
    async closeTab(storeId: string, tabId: string) {
      return repo.transact((state) => {
        permit(state, "orders", storeId);
        const t = store(state, storeId),
          tab = restaurant(t).tabs.find((v) => v.id === tabId && !v.closedAt);
        if (!tab) throw new DomainError("Comanda não encontrada.");
        if (
          t.orders.some(
            (o) =>
              o.tabId === tabId &&
              (o.status === "Cancelado"
                ? paidCents(o) > 0
                : dueCents(o) > 0 || o.status !== "Entregue"),
          )
        )
          throw new DomainError(
            "Conclua e registre o pagamento dos pedidos antes de fechar a comanda.",
          );
        tab.closedAt = iso();
      });
    },
    async createStaffOrder(storeId: string, input: unknown) {
      const data = parse(
        z.object({
          requestId: z.string().min(1).max(150),
          channel: z.enum(["counter", "phone", "table"]),
          tabId: z.string().optional(),
          lines: z.array(cartLineSchema).min(1).max(100),
          checkout: checkoutSchema.extend({
            name: z.string().trim().max(70).default(""),
            phone: z
              .string()
              .regex(/^(?:\d{10,11})?$/)
              .default(""),
          }),
        }),
        input,
      );
      return repo.transact((state) => {
        const actor = permit(state, "orders", storeId),
          t = store(state, storeId),
          existing = t.orders.find((o) => o.requestId === data.requestId);
        if (existing) return existing;
        if (data.channel === "phone" || data.checkout.fulfillment === "delivery")
          parse(checkoutSchema, data.checkout);
        else if (!data.checkout.name)
          data.checkout.name =
            data.channel === "table"
              ? restaurant(t).tabs.find((v) => v.id === data.tabId)?.customer || "Cliente da mesa"
              : "Consumidor no balcão";
        const copy = structuredClone(t);
        if (data.checkout.scheduledAt)
          validateSchedule(t, data.checkout.scheduledAt, new Date(), data.lines);
        copy.cart = { requestId: data.requestId, lines: data.lines };
        // Staff may register phone/counter sales outside public opening hours; payment stays pending.
        copy.online = true;
        copy.settings.scheduleEnabled = false;
        if (data.checkout.fulfillment === "pickup") {
          copy.settings.pickupEnabled = true;
          copy.settings.address ||= "Balcão da loja";
        }
        const order = makeOrder(company(state, storeId), copy, data.checkout);
        order.channel = data.channel;
        if (data.channel === "table") {
          const tab = restaurant(t).tabs.find((v) => v.id === data.tabId && !v.closedAt);
          if (!tab || data.checkout.fulfillment !== "pickup")
            throw new DomainError("Selecione uma comanda aberta para consumo na mesa.");
          order.tabId = tab.id;
          order.tableName = restaurant(t).tables.find((v) => v.id === tab.tableId)?.name;
        }
        order.history[0].actor = actor.name;
        reserveStock(t, data.lines, order, iso());
        t.orders.unshift(order);
        return order;
      });
    },
    async repeatOrder(storeId: string, trackingToken: string) {
      return repo.transact((state) => {
        const t = store(state, storeId),
          order = t.orders.find((o) => o.trackingToken === trackingToken);
        if (!order) throw new DomainError("Pedido não encontrado.");
        if (order.lines.some((l) => !l.selection))
          throw new DomainError(
            "Este pedido antigo não possui as opções necessárias. Escolha os produtos novamente.",
          );
        const lines = order.lines.map((l) => ({ ...structuredClone(l.selection!), key: uuid() }));
        lines.forEach((l) => priceLine(l, t.products));
        if (t.cart.lines.length + lines.length > 100)
          throw new DomainError("A sacola atingiu o limite.");
        t.cart.lines.push(...lines);
      });
    },
    async validateCombo(storeId: string, productId: string) {
      const t = store(repo.getSnapshot(), storeId),
        p = t.products.find((p) => p.id === productId);
      if (!p?.combo) throw new DomainError("Combo não encontrado.");
      return comboLines(
        {
          key: uuid(),
          productId,
          quantity: 1,
          extraIds: [],
          removedIngredients: [],
          notes: "",
          comboChoices: p.combo.groups.map((g) => ({
            groupId: g.id,
            productId: g.options[0].productId,
          })),
        },
        t.products,
      );
    },
  };
}
