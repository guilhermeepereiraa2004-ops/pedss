import { createLocalRepository } from "../adapters/localRepository.ts";
import { createLocalAuth } from "../adapters/localAuth.ts";
import { createServices } from "./services.ts";
import { defaultCompanies, defaultMenu, defaultOrders } from "../lib/data.js";
import { createRemoteRuntime } from "./remoteRuntime.js";
import { createLocalShippingGateway } from "../adapters/shippingGateway.ts";
let runtime;
export function getRuntime() {
  if (!runtime) {
    if (import.meta.env.VITE_RUNTIME_MODE === "remote") {
      runtime = createRemoteRuntime();
      return runtime;
    }
    const repository = createLocalRepository(
      window.localStorage,
      { companies: defaultCompanies, products: defaultMenu, orders: defaultOrders },
      window,
    );
    const auth = createLocalAuth(repository, window.sessionStorage);
    runtime = {
      repository,
      auth,
      services: createServices(repository, auth, createLocalShippingGateway()),
    };
    if (import.meta.env.DEV && import.meta.env.VITE_LOCAL_CIA_PREVIEW !== "false") {
      runtime.refresh = async () => {
        await auth.ready;
        if (auth.current()?.role !== "admin") return;
        const { prepareLocalPizzaPreview } = await import("./localPizzaPreview.ts");
        await prepareLocalPizzaPreview(repository, auth);
        if (import.meta.env.VITE_LOCAL_CIA_PREVIEW === "true") {
          const { repairLocalCiaCombo } = await import("./localCiaComboRepair.ts");
          await repairLocalCiaCombo(repository, auth);
        }
      };
    }
  }
  return runtime;
}
