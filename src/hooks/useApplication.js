import { useContext, useState } from "react";
import { ApplicationContext } from "./ApplicationContext";
import { openState } from "../core/domain.ts";
import { resolveStoreCompany } from "../core/storeAddress.ts";
export default function useApplication() {
  const value = useContext(ApplicationContext);
  if (!value) throw new Error("ApplicationProvider ausente.");
  return value;
}
export function useStore(slug) {
  const app = useApplication();
  const resolved = resolveStoreCompany(app.state.companies, slug);
  const company = resolved && !resolved.archived ? resolved : undefined;
  const tenant = company && app.state.tenants[company.id];
  return {
    ...app,
    company,
    tenant,
    availability:
      company && tenant
        ? openState(company, tenant, app.now)
        : { open: false, reason: "Estabelecimento não encontrado." },
  };
}
export function useAction() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const run = async (fn, onSuccess) => {
    setError("");
    setBusy(true);
    try {
      const result = await fn();
      onSuccess?.(result);
      return result;
    } catch (e) {
      setError(
        e.name === "DomainError"
          ? e.message
          : "Não foi possível concluir. Confira os dados e tente novamente.",
      );
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  return { error, setError, busy, run };
}
