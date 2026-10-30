import { migrateLegacy } from "../src/adapters/migration.ts";
import { defaultCompanies, defaultMenu } from "../src/lib/data.js";

export function seedWorkspace({ demo = true } = {}) {
  const state = migrateLegacy(
    { getItem: () => null },
    {
      companies: demo ? defaultCompanies.filter((c) => c.id === "demo" || c.slug === "demo") : [],
      products: demo ? defaultMenu : [],
      orders: [],
    },
  );
  state.platform.name = "Pedss";
  return state;
}
