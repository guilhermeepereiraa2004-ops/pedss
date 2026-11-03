import { z } from "zod";
import {
  cartLineSchema,
  checkoutSchema,
  companySchema,
  storeSegmentSchema,
  productSchema,
  pizzaConfigSchema,
  settingsSchema,
  shippingSchema,
  couponSchema,
  expenseSchema,
  type Company,
  type Product,
  type Settings,
  type Workspace,
  type CartLine,
  type Identity,
  type OrderStatus,
  type PaymentStatus,
} from "../core/model.ts";
import {
  DomainError,
  emptyCart,
  emptyTenant,
  finance,
  iso,
  makeOrder,
  openState,
  priceLine,
  recordPayment,
  requirePermission,
  requireAvailableStoreSlug,
  transition,
  uuid,
} from "../core/domain.ts";
import type { WorkspaceRepository } from "../core/ports.ts";
import { prepareCatalogExport } from "../core/catalogExport.ts";
import { localDay } from "../core/calendar.ts";
import { minimumPizzaPrice } from "../core/pizza.ts";
import { createRestaurantServices, syncPizzaCatalog } from "./restaurantServices.ts";
import { createOrderAmendmentServices } from "./orderAmendmentServices.ts";
import { createPizzeriaOperationsServices } from "./pizzeriaOperationsServices.ts";
import { pizzaWorkItems } from "../core/pizzeriaOperations.ts";
import { markReplacedPizzaExtras } from "../core/catalogRules.ts";
import { appendPayment, dueCents, paidCents } from "../core/payments.ts";
import { reserveStock, restoreStock, comboLines } from "../core/restaurant.ts";
import { requireActiveTrial } from "../core/trials.ts";
import { shippingMode, type ShippingGateway } from "../core/shipping.ts";
import {
  assertImportDocument,
  catalogFingerprint,
  planCatalogImport,
} from "../core/catalogImport.ts";
type IdentityProvider = { identity(state: Workspace): Identity | null };
export function createServices(
  repo: WorkspaceRepository,
  auth: IdentityProvider,
  shipping?: ShippingGateway,
) {
  const company = (state: Workspace, id: string) => {
    const c = state.companies.find((c) => c.id === id && !c.archived);
    if (!c) throw new DomainError("Estabelecimento não encontrado.");
    return c;
  };
  const tenant = (state: Workspace, id: string) => {
    company(state, id);
    const t = state.tenants[id];
    if (!t) throw new DomainError("Dados da loja indisponíveis.");
    return t;
  };
  const permit = (
    state: Workspace,
    permission: Parameters<typeof requirePermission>[1],
    id?: string,
  ) => {
    const actor = auth.identity(state);
    requirePermission(actor, permission, id);
    if (id && actor?.role !== "admin" && permission !== "view")
      requireActiveTrial(company(state, id));
    return actor!;
  };
  const parsed = <T>(schema: z.ZodType<T>, value: unknown): T => {
    const result = schema.safeParse(value);
    if (!result.success)
      throw new DomainError(result.error.issues[0]?.message || "Revise os campos.");
    return result.data;
  };
  return {
    ...createRestaurantServices(repo, permit, company),
    ...createOrderAmendmentServices(repo, permit, tenant),
    ...createPizzeriaOperationsServices(repo, permit, tenant),
    async quoteShipping(storeId: string, postalCode: string) {
      const t = tenant(repo.getSnapshot(), storeId);
      requireActiveTrial(company(repo.getSnapshot(), storeId));
      if (shippingMode(t.settings) !== "distance")
        throw new DomainError("Esta loja não utiliza frete por quilômetro.");
      if (!shipping)
        throw new DomainError(
          "Cálculo por km indisponível. Peça à central para configurar o serviço de rotas.",
        );
      return shipping.quote(storeId, t.settings, postalCode);
    },
    async saveShipping(storeId: string, input: unknown) {
      const config = parsed(
        z.object({
          shipping: shippingSchema,
          deliveryEnabled: z.boolean(),
          pickupEnabled: z.boolean(),
          address: z.string().trim().max(200),
          areas: settingsSchema.shape.areas,
        }),
        input,
      );
      if (config.pickupEnabled && !config.address)
        throw new DomainError("Informe o endereço para retirada.");
      if (new Set(config.areas.map((a) => a.name.toLowerCase())).size !== config.areas.length)
        throw new DomainError("Não repita áreas de entrega.");
      return repo.transact((state) => {
        permit(state, "settings", storeId);
        Object.assign(tenant(state, storeId).settings, config);
      });
    },
    async saveCompany(input: unknown) {
      const c = parsed(companySchema, input);
      const { heroSegment } = parsed(
        z.object({ heroSegment: storeSegmentSchema.optional() }),
        input,
      );
      return repo.transact((state) => {
        permit(state, "platform");
        requireAvailableStoreSlug(state.companies, c.slug, c.id);
        const existing = state.companies.find((o) => o.id === c.id);
        if (existing) {
          if (existing.slug !== c.slug) throw new DomainError("O endereço da loja é imutável.");
          Object.assign(existing, c, { trial: existing.trial });
          if (heroSegment !== undefined) state.tenants[c.id].settings.heroSegment = heroSegment;
        } else {
          if (!heroSegment) throw new DomainError("Escolha o tipo de estabelecimento.");
          state.companies.push(c);
          state.tenants[c.id] = emptyTenant();
          state.tenants[c.id].settings.heroSegment = heroSegment;
        }
        return c;
      });
    },
    async activatePlan(storeId: string, input: unknown) {
      const plan = parsed(z.enum(["Essencial", "Rede"]), input);
      return repo.transact((state) => {
        permit(state, "platform");
        const c = company(state, storeId);
        c.plan = plan;
        if (c.trial && !c.trial.convertedAt) c.trial.convertedAt = iso();
      });
    },
    async archiveCompany(id: string) {
      return repo.transact((state) => {
        permit(state, "platform");
        const c = company(state, id);
        if (c.slug === "demo") throw new DomainError("A loja de demonstração deve ser preservada.");
        c.archived = true;
        c.status = "Pausado";
        state.sessions = state.sessions.filter(
          (s) => !state.users.some((u) => u.id === s.userId && u.storeId === id),
        );
      });
    },
    async saveProduct(storeId: string, input: unknown) {
      const candidate =
        input && typeof input === "object" && "pizza" in input && input.pizza
          ? { ...input, priceCents: minimumPizzaPrice(parsed(pizzaConfigSchema, input.pizza)) }
          : input;
      const product = markReplacedPizzaExtras(parsed(productSchema, candidate));
      if (product.pizza) {
        if (product.category !== "Pizza")
          throw new DomainError("Montador permitido apenas na categoria Pizza.");
        product.priceCents = minimumPizzaPrice(product.pizza);
      }
      return repo.transact((state) => {
        permit(state, "catalog", storeId);
        const t = tenant(state, storeId);
        if (product.sku && t.products.some((p) => p.id !== product.id && p.sku === product.sku))
          throw new DomainError("Já existe um produto com este código na loja.");
        const index = t.products.findIndex((p) => p.id === product.id);
        const previous = index >= 0 ? t.products[index] : undefined;
        if (
          t.products.some(
            (p) =>
              p.id !== product.id && p.pizza?.flavors.some((f) => f.sourceProductId === product.id),
          ) &&
          (!product.pizza ||
            product.pizza.flavors.length !== 1 ||
            product.pizza.flavors[0].sourceProductId !== product.id)
        )
          throw new DomainError(
            "Desvincule este sabor dos montadores antes de desativar sua configuração de pizza.",
          );
        if (index < 0) t.products.push(product);
        else t.products[index] = product;
        syncPizzaCatalog(t.products, product.id, previous);
        if (product.combo) {
          if (
            product.pizza ||
            new Set(product.combo.groups.map((g) => g.id)).size !== product.combo.groups.length
          )
            throw new DomainError("Revise os grupos do combo.");
          for (const group of product.combo.groups)
            for (const option of group.options) {
              if (new Set(group.options.map((o) => o.productId)).size !== group.options.length)
                throw new DomainError("Não repita produtos no mesmo grupo do combo.");
              comboLines(
                {
                  key: uuid(),
                  productId: product.id,
                  quantity: 1,
                  extraIds: [],
                  removedIngredients: [],
                  notes: "",
                  comboChoices: product.combo.groups.map((g) => ({
                    groupId: g.id,
                    productId: g.id === group.id ? option.productId : g.options[0].productId,
                  })),
                },
                t.products,
                false,
              );
            }
        }
        return product;
      });
    },
    async exportCatalog(storeId: string) {
      return repo.transact((state) => {
        permit(state, "catalog", storeId);
        const t = tenant(state, storeId);
        const prepared = prepareCatalogExport(t.products, () => `P-${uuid().toUpperCase()}`);
        t.products = prepared.products;
        const c = company(state, storeId);
        return {
          products: structuredClone(t.products),
          codesAssigned: prepared.codesAssigned,
          storeName: c.name,
          storeSlug: c.slug,
        };
      });
    },
    async importCatalog(
      storeId: string,
      document: unknown,
      options: { allowUpdates: boolean; expectedFingerprint: string },
    ) {
      assertImportDocument(document);
      if (
        !options ||
        typeof options.allowUpdates !== "boolean" ||
        typeof options.expectedFingerprint !== "string"
      )
        throw new DomainError("Revise as opções da importação.");
      return repo.transact((state) => {
        permit(state, "catalog", storeId);
        const t = tenant(state, storeId);
        if (catalogFingerprint(t.products) !== options.expectedFingerprint)
          throw new DomainError(
            "O cardápio foi alterado após a prévia. Confira os dados e prepare uma nova prévia antes de importar.",
          );
        const plan = planCatalogImport(document, t.products, options.allowUpdates);
        if (plan.issues.length) {
          const first = plan.issues[0];
          throw new DomainError(`${first.sheet}, linha ${first.line}: ${first.message}`);
        }
        const beforeProducts = structuredClone(t.products);
        for (const entry of plan.entries) {
          const index = t.products.findIndex((p) => p.id === entry.product.id);
          if (index >= 0) t.products[index] = entry.product;
          else t.products.push(entry.product);
        }
        // Keep explicit edits from individual flavour rows when a builder price sheet changes
        // in the same batch. Synchronization must not depend on spreadsheet row order.
        const planned = structuredClone(plan.entries);
        const isLinkedSource = (p: Product) =>
          p.pizza?.flavors.length === 1 && p.pizza.flavors[0].sourceProductId === p.id;
        for (const entry of planned.filter((e) => !isLinkedSource(e.product))) {
          const before = beforeProducts.find((p) => p.id === entry.product.id);
          if (JSON.stringify(before) !== JSON.stringify(entry.product))
            syncPizzaCatalog(t.products, entry.product.id, before);
        }
        for (const entry of planned.filter((e) => isLinkedSource(e.product))) {
          const before = beforeProducts.find((p) => p.id === entry.product.id),
            live = t.products.find((p) => p.id === entry.product.id)!;
          if (!before?.pizza || !live.pizza) continue;
          for (const field of ["name", "ingredients", "allergens", "status"] as const) {
            if (JSON.stringify(entry.product[field]) !== JSON.stringify(before[field]))
              Object.assign(live, { [field]: structuredClone(entry.product[field]) });
          }
          const imported = entry.product.pizza!.flavors[0],
            old = before.pizza.flavors[0],
            current = live.pizza.flavors[0];
          for (const field of Object.keys(imported) as (keyof typeof imported)[]) {
            if (JSON.stringify(imported[field]) === JSON.stringify(old[field])) continue;
            if (
              JSON.stringify(current[field]) !== JSON.stringify(old[field]) &&
              JSON.stringify(current[field]) !== JSON.stringify(imported[field])
            )
              throw new DomainError(
                "O sabor foi alterado de formas diferentes no montador e na linha individual. Edite sua tabela de preços somente no montador.",
              );
            Object.assign(current, { [field]: structuredClone(imported[field]) });
          }
          live.priceCents = minimumPizzaPrice(live.pizza);
        }
        const linked = t.products.find(isLinkedSource);
        if (linked) syncPizzaCatalog(t.products, linked.id);
        t.products = t.products.map(markReplacedPizzaExtras);
        return { created: plan.created, updated: plan.updated };
      });
    },
    async saveCoupon(storeId: string, input: unknown) {
      const coupon = parsed(couponSchema, input);
      return repo.transact((state) => {
        permit(state, "catalog", storeId);
        const t = tenant(state, storeId);
        if (t.coupons.some((c) => c.code === coupon.code && c.id !== coupon.id))
          throw new DomainError("Já existe um cupom com este código nesta loja.");
        const existing = t.coupons.find((c) => c.id === coupon.id);
        if (existing && existing.code !== coupon.code)
          throw new DomainError("O código do cupom é fixo para preservar o histórico.");
        if (existing) Object.assign(existing, coupon);
        else t.coupons.push(coupon);
        return coupon;
      });
    },
    async saveExpense(storeId: string, input: unknown) {
      const expense = parsed(expenseSchema, input);
      if (expense.paidOn > localDay(new Date()))
        throw new DomainError("Informe uma despesa já paga, sem data futura.");
      return repo.transact((state) => {
        permit(state, "finance", storeId);
        const t = tenant(state, storeId);
        const existing = t.expenses.find((e) => e.id === expense.id);
        if (existing) Object.assign(existing, expense, { createdAt: existing.createdAt });
        else t.expenses.push(expense);
        return expense;
      });
    },
    async voidExpense(storeId: string, id: string, voided: boolean) {
      return repo.transact((state) => {
        permit(state, "finance", storeId);
        const expense = tenant(state, storeId).expenses.find((e) => e.id === id);
        if (!expense) throw new DomainError("Despesa não encontrada.");
        expense.voided = voided;
      });
    },
    async removeProduct(storeId: string, id: string) {
      return repo.transact((state) => {
        permit(state, "catalog", storeId);
        const t = tenant(state, storeId);
        if (
          t.products.some(
            (p) =>
              p.id !== id &&
              (p.pizza?.flavors.some((f) => f.sourceProductId === id) ||
                p.combo?.groups.some((g) => g.options.some((o) => o.productId === id))),
          )
        )
          throw new DomainError(
            "Este produto está vinculado a um montador ou combo. Marque como indisponível ou remova o vínculo antes de excluir.",
          );
        t.products = t.products.filter((p) => p.id !== id);
      });
    },
    async saveSettings(storeId: string, input: unknown) {
      const settings = parsed(settingsSchema, input);
      if (settings.pickupEnabled && !settings.address.trim())
        throw new DomainError("Informe o endereço da loja para permitir retirada.");
      if (new Set(settings.areas.map((a) => a.name.toLowerCase())).size !== settings.areas.length)
        throw new DomainError("As áreas de entrega devem ter nomes diferentes.");
      if (settings.hours.some((h) => h.enabled && h.open === h.close))
        throw new DomainError("A abertura e o fechamento devem ter horários diferentes.");
      return repo.transact((state) => {
        permit(state, "settings", storeId);
        tenant(state, storeId).settings = settings;
      });
    },
    async setOnline(storeId: string, online: boolean) {
      return repo.transact((state) => {
        permit(state, "settings", storeId);
        if (company(state, storeId).status === "Pausado")
          throw new DomainError("A central pausou este estabelecimento.");
        tenant(state, storeId).online = online;
      });
    },
    async configureStore(
      storeId: string,
      input: unknown,
      branding: { name: string; logo: string; primaryColor: string },
    ) {
      const settings = parsed(settingsSchema, input);
      const safeBranding = parsed(
        companySchema.pick({ name: true, logo: true, primaryColor: true }),
        branding,
      );
      if (settings.pickupEnabled && !settings.address.trim())
        throw new DomainError("Informe o endereço de retirada.");
      if (new Set(settings.areas.map((a) => a.name.toLowerCase())).size !== settings.areas.length)
        throw new DomainError("Não repita áreas de entrega.");
      if (
        new Set(settings.hours.map((h) => h.day)).size !== 7 ||
        settings.hours.some((h) => h.enabled && h.open === h.close)
      )
        throw new DomainError("Revise os sete dias e os horários de abertura e fechamento.");
      return repo.transact((state) => {
        permit(state, "settings", storeId);
        const c = company(state, storeId);
        const updated = parsed(companySchema, { ...c, ...safeBranding });
        Object.assign(c, updated);
        const current = tenant(state, storeId).settings;
        Object.assign(settings, {
          shipping: current.shipping,
          areas: current.areas,
          deliveryEnabled: current.deliveryEnabled,
          pickupEnabled: current.pickupEnabled,
          address: current.address,
        });
        tenant(state, storeId).settings = settings;
      });
    },
    async savePlatform(input: Workspace["platform"]) {
      const p = parsed(
        z.object({
          name: z.string().trim().min(1).max(60),
          supportEmail: z.union([z.literal(""), z.email()]),
          description: z.string().max(180),
        }),
        input,
      );
      return repo.transact((state) => {
        permit(state, "platform");
        state.platform = p;
      });
    },
    async addToCart(storeId: string, input: Omit<CartLine, "key">) {
      const line = parsed(cartLineSchema, { ...input, key: uuid() });
      return repo.transact((state) => {
        const t = tenant(state, storeId);
        const availability = openState(company(state, storeId), t);
        if (!availability.open && !availability.canSchedule)
          throw new DomainError(availability.reason);
        priceLine(line, t.products);
        const p = t.products.find((p) => p.id === line.productId && p.status === "Disponível");
        if (!p) throw new DomainError("Produto indisponível.");
        if (t.cart.lines.length >= 100)
          throw new DomainError("A sacola atingiu o limite de itens.");
        const signature = (l: CartLine) =>
          JSON.stringify([
            l.productId,
            [...l.extraIds].sort(),
            [...l.removedIngredients].sort(),
            l.notes,
            l.pizza || null,
            l.comboChoices || null,
          ]);
        const existing = t.cart.lines.find((l) => signature(l) === signature(line));
        if (existing) {
          if (existing.quantity + line.quantity > 99)
            throw new DomainError("Limite de 99 unidades por item.");
          existing.quantity += line.quantity;
        } else t.cart.lines.push(line);
      });
    },
    async changeCart(storeId: string, key: string, quantity: number) {
      return repo.transact((state) => {
        const t = tenant(state, storeId);
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99)
          throw new DomainError("Quantidade inválida.");
        if (quantity === 0) t.cart.lines = t.cart.lines.filter((l) => l.key !== key);
        else {
          const line = t.cart.lines.find((l) => l.key === key);
          if (line) line.quantity = quantity;
        }
      });
    },
    async updateCartLine(storeId: string, key: string, input: unknown) {
      const replacement = parsed(cartLineSchema, {
        ...(input && typeof input === "object" ? input : {}),
        key,
      });
      return repo.transact((state) => {
        const t = tenant(state, storeId),
          index = t.cart.lines.findIndex((l) => l.key === key);
        if (index < 0 || t.cart.lines[index].productId !== replacement.productId)
          throw new DomainError("O item mudou. Abra a sacola novamente.");
        priceLine(replacement, t.products);
        t.cart.lines[index] = replacement;
      });
    },
    async checkout(storeId: string, requestId: string, input: unknown) {
      const checkout = parsed(checkoutSchema, input);
      return repo.transact((state) => {
        const t = tenant(state, storeId),
          existing = t.orders.find((o) => o.requestId === requestId);
        if (existing) return existing;
        if (requestId !== t.cart.requestId)
          throw new DomainError("A sacola mudou. Confira os itens antes de confirmar.");
        const shippingQuote =
          checkout.fulfillment === "delivery" && shippingMode(t.settings) === "distance"
            ? shipping?.verify(
                checkout.shippingQuoteToken,
                storeId,
                t.settings,
                checkout.postalCode,
              )
            : undefined;
        const order = makeOrder(company(state, storeId), t, checkout, new Date(), shippingQuote);
        reserveStock(t, t.cart.lines, order, iso());
        t.orders.unshift(order);
        t.cart = emptyCart();
        return order;
      });
    },
    async changeOrder(
      storeId: string,
      id: string,
      next: OrderStatus,
      reason = "",
      expectedUpdatedAt?: string,
    ) {
      return repo.transact((state) => {
        const actor = permit(state, "orders", storeId),
          t = tenant(state, storeId),
          index = t.orders.findIndex((o) => o.id === id);
        if (index < 0) throw new DomainError("Pedido não encontrado.");
        if (expectedUpdatedAt && t.orders[index].updatedAt !== expectedUpdatedAt)
          throw new DomainError(
            "Este pedido foi atualizado por outra pessoa. Confira o status atual.",
          );
        const previous = t.orders[index];
        if (
          ["A caminho", "Pronto para retirada", "Entregue"].includes(next) &&
          previous.production?.length &&
          pizzaWorkItems(previous).some((p) => p.stage !== "ready")
        )
          throw new DomainError(
            "Conclua a produção de todas as pizzas antes de despachar o pedido.",
          );
        t.orders[index] = transition(previous, next, actor.name, reason);
        if (next === "Cancelado" && ["Pendente", "Aceito"].includes(previous.status))
          restoreStock(t, previous, iso());
        return t.orders[index];
      });
    },
    async changePayment(
      storeId: string,
      id: string,
      next: PaymentStatus,
      reason = "",
      expectedUpdatedAt?: string,
    ) {
      return repo.transact((state) => {
        const actor = permit(state, "finance", storeId),
          t = tenant(state, storeId),
          index = t.orders.findIndex((o) => o.id === id);
        if (index < 0) throw new DomainError("Pedido não encontrado.");
        if (expectedUpdatedAt && t.orders[index].updatedAt !== expectedUpdatedAt)
          throw new DomainError("Pedido atualizado. Revise os valores antes de registrar.");
        const previous = t.orders[index];
        recordPayment(previous, next, actor.name, reason);
        t.orders[index] = appendPayment(
          previous,
          {
            requestId: uuid(),
            kind: next === "Pago" ? "receipt" : "refund",
            amountCents: next === "Pago" ? dueCents(previous) : paidCents(previous),
            method: previous.paymentMethod,
          },
          actor.name,
          t.restaurant?.cashSessions.find((s) => !s.closedAt)?.id || "unassigned",
          reason,
        );
        return t.orders[index];
      });
    },
    async clearCart(storeId: string) {
      return repo.transact((state) => {
        tenant(state, storeId).cart = emptyCart();
      });
    },
    async restoreCompany(id: string) {
      return repo.transact((state) => {
        permit(state, "platform");
        const c = state.companies.find((c) => c.id === id);
        if (c) {
          c.archived = false;
          c.status = "Pausado";
        }
      });
    },
    finance,
    // Stable action IDs are used in tests and can be exposed by a future HTTP adapter.
    actionIds: [
      "company.save",
      "company.archive",
      "product.save",
      "product.remove",
      "store.settings",
      "store.online",
      "cart.add",
      "cart.edit",
      "cart.quantity",
      "checkout.create",
      "order.transition",
      "order.payment",
      "pizza.catalog.link",
      "stock.save",
      "stock.adjust",
      "recipe.save",
      "cash.open",
      "cash.move",
      "cash.close",
      "table.save",
      "tab.open",
      "tab.close",
      "tab.transfer",
      "tab.payment",
      "order.payment.partial",
      "order.staff",
      "order.repeat",
      "schedule.save",
    ] as const,
  };
}
