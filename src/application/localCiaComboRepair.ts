import { requirePermission, uuid } from "../core/domain.ts";
import { productSchema, type Identity, type Workspace } from "../core/model.ts";
import { comboLines } from "../core/restaurant.ts";
import type { WorkspaceRepository } from "../core/ports.ts";

const names = ["Calabresa", "Mussarela", "Margherita"];
const normalize = (name: string) => name.trim().toLocaleLowerCase("pt-BR");

/** One local data correction explicitly requested for Cia's R$180 Super Combo.
 * Called only by the opted-in development runtime, with central admin access.
 * No seed, name-only global migration, or change to past orders/carts/prices.
 */
export async function repairLocalCiaCombo(
  repo: WorkspaceRepository,
  auth: { identity(state: Workspace): Identity | null },
) {
  const locate = (state: Workspace) => {
    const store = state.companies.find((c) => c.slug === "cia-da-pizza" && !c.archived);
    const tenant = store && state.tenants[store.id];
    const matches = tenant?.products.filter(
      (p) => normalize(p.name) === "super combo" && p.priceCents === 18000 && p.combo,
    );
    if (!store || !tenant || matches?.length !== 1) return;
    const product = matches[0],
      groups = product.combo!.groups;
    if (groups.length !== 1 || groups[0].quantity !== 1 || groups[0].options.length !== 3) return;
    const options = names.map((name) =>
      groups[0].options.find((o) => {
        const child = tenant.products.find((p) => p.id === o.productId);
        return (
          child?.category === "Pizza" &&
          !child.combo &&
          normalize(child.name) === normalize(name) &&
          o.surchargeCents === 0 &&
          !o.customizePizza
        );
      }),
    );
    if (options.some((o) => !o) || new Set(options.map((o) => o!.productId)).size !== 3) return;
    return { store, tenant, product, options };
  };
  requirePermission(auth.identity(repo.getSnapshot()), "platform");
  if (!locate(repo.getSnapshot())) return false;
  return repo.transact((state) => {
    requirePermission(auth.identity(state), "platform");
    const found = locate(state);
    if (!found) return false;
    const { tenant, product, options } = found;
    const corrected = productSchema.parse({
      ...product,
      combo: {
        groups: options.map((option, i) => ({
          id: i === 0 ? product.combo!.groups[0].id : uuid(),
          name: names[i],
          quantity: 1,
          options: [{ ...option }],
        })),
      },
    });
    const products = tenant.products.map((p) => (p.id === corrected.id ? corrected : p));
    comboLines(
      {
        key: "local-cia-combo-repair",
        productId: corrected.id,
        quantity: 1,
        extraIds: [],
        removedIngredients: [],
        notes: "",
        comboChoices: corrected.combo!.groups.map((g) => ({
          groupId: g.id,
          productId: g.options[0].productId,
        })),
      },
      products,
      false,
    );
    tenant.products = products;
    return true;
  });
}
