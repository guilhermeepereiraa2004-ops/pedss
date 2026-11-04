export function isPageLoadError(error) {
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w-]+ failed|Unable to preload CSS/i.test(
    error?.message || "",
  );
}

export async function loadPage(loader) {
  try {
    return await loader();
  } catch (error) {
    if (!isPageLoadError(error)) throw error;
    if (await reloadNewVersion()) return new Promise(() => {});
    await new Promise((resolve) => setTimeout(resolve, 750));
    return loader();
  }
}
import { reloadNewVersion } from "../adapters/pageRecovery.js";
