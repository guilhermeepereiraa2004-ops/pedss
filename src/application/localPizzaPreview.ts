import { localPizzaCatalog } from "../adapters/localPizzaCatalog.ts";
import { emptyTenant, requirePermission } from "../core/domain.ts";
import { companySchema, productSchema, type Identity, type Workspace } from "../core/model.ts";
import { minimumPizzaPrice } from "../core/pizza.ts";
import type { WorkspaceRepository } from "../core/ports.ts";

export const LOCAL_CIA_ID = "b8b27514-5d20-4bfd-adff-106639a6364d";
const slug = "cia-da-pizza";

/** Explicit development opt-in only. Never imports production accounts or replaces local edits. */
export async function prepareLocalPizzaPreview(
  repo: WorkspaceRepository,
  auth: { identity(state: Workspace): Identity | null },
) {
  const exists = (state: Workspace) =>
    state.companies.some((c) => c.id === LOCAL_CIA_ID || c.slug === slug) ||
    Boolean(state.tenants[LOCAL_CIA_ID]);
  requirePermission(auth.identity(repo.getSnapshot()), "platform");
  if (exists(repo.getSnapshot())) return;
  await repo.transact((state) => {
    requirePermission(auth.identity(state), "platform");
    if (exists(state)) return;
    const products = localPizzaCatalog.map((p) => productSchema.parse(p));
    const pizza = {
      menuPlacement: "builder" as const,
      pricing: "highest" as const,
      sizes: [
        { id: "medium", name: "Média", diameterCm: 30, slices: 6, maxFlavors: 2, available: true },
        { id: "large", name: "Grande", diameterCm: 35, slices: 8, maxFlavors: 4, available: true },
      ],
      flavors: products.map((p) => ({
        id: `flavor-${p.id}`,
        name: p.name,
        available: true,
        prices: { medium: p.priceCents, large: p.priceCents + 1000 },
      })),
      doughs: [
        { id: "classic", name: "Tradicional", priceCents: 0, available: true },
        { id: "thin", name: "Fina", priceCents: 200, available: true },
      ],
      edges: [
        { id: "plain", name: "Sem recheio", priceCents: 0, available: true },
        { id: "cream", name: "Requeijão", priceCents: 800, available: true },
      ],
    };
    products.push(
      productSchema.parse({
        id: "cia-local-pizza-builder",
        name: "Monte sua pizza",
        category: "Pizza",
        priceCents: minimumPizzaPrice(pizza),
        status: "Disponível",
        pizza,
      }),
    );
    const tenant = emptyTenant(true);
    tenant.products = products;
    tenant.settings.heroSegment = "pizza";
    tenant.settings.description = "Prévia local da Cia da Pizza. Escolha seu sabor favorito.";
    tenant.settings.deliveryEnabled = false;
    state.companies.push(
      companySchema.parse({
        id: LOCAL_CIA_ID,
        name: "Cia da Pizza",
        slug,
        primaryColor: "#f06000",
        adminEmail: "cia-pizza-local@example.com",
        status: "Ativo",
        plan: "Essencial",
        createdAt: "2026-10-26",
      }),
    );
    state.tenants[LOCAL_CIA_ID] = tenant;
  });
}
