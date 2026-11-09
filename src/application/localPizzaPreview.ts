import { emptyTenant, requirePermission } from "../core/domain.ts";
import { companySchema, type Identity, type Workspace } from "../core/model.ts";
import type { WorkspaceRepository } from "../core/ports.ts";
import { ciaMenuPhotosReady, mergeCiaPizzaCatalog } from "./ciaPizzaCatalog.ts";

export const LOCAL_CIA_ID = "b8b27514-5d20-4bfd-adff-106639a6364d";
const slug = "cia-da-pizza";

/** Prepares the development demo for an administrator without replacing an existing store. */
export async function prepareLocalPizzaPreview(
  repo: WorkspaceRepository,
  auth: { identity(state: Workspace): Identity | null },
) {
  const exists = (state: Workspace) =>
    state.companies.some((c) => c.id === LOCAL_CIA_ID || c.slug === slug) ||
    Boolean(state.tenants[LOCAL_CIA_ID]);
  requirePermission(auth.identity(repo.getSnapshot()), "platform");
  if (!ciaMenuPhotosReady || exists(repo.getSnapshot())) return;
  await repo.transact((state) => {
    requirePermission(auth.identity(state), "platform");
    if (exists(state)) return;
    const tenant = emptyTenant(true);
    tenant.products = mergeCiaPizzaCatalog([]);
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
