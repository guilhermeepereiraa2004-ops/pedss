import { workspaceSchema, type Workspace } from "../core/model.ts";
import type { WorkspaceRepository } from "../core/ports.ts";
import { DomainError } from "../core/domain.ts";
import {
  migrateLegacy,
  recoverWorkspace,
  type DemoSeed,
  type KeyValueStorage,
} from "./migration.ts";

export const WORKSPACE_KEY = "brasa.workspace.v2";
type BrowserEvents = Pick<Window, "addEventListener" | "removeEventListener" | "dispatchEvent">;
export function createLocalRepository(
  storage: KeyValueStorage,
  seed: DemoSeed,
  events?: BrowserEvents,
): WorkspaceRepository & { warning: string } {
  let warning = "",
    cachedRaw: string | null = null,
    cached: Workspace;
  const listeners = new Set<() => void>();
  const load = () => {
    let raw: string | null;
    try {
      raw = storage.getItem(WORKSPACE_KEY);
    } catch {
      throw new DomainError(
        "O armazenamento local está indisponível. Permita o armazenamento neste navegador.",
      );
    }
    if (cached && raw === cachedRaw) return cached;
    if (raw === null) {
      cached = migrateLegacy(storage, seed);
      cachedRaw = JSON.stringify(cached);
      try {
        storage.setItem(WORKSPACE_KEY, cachedRaw);
      } catch {
        throw new DomainError("Não foi possível preparar o armazenamento local.");
      }
      return cached;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    const result = workspaceSchema.safeParse(parsed);
    if (result.success) {
      cached = result.data;
      cachedRaw = raw;
      return cached;
    }
    try {
      storage.setItem(`brasa.backup.invalid.${Date.now()}`, raw);
      cached = recoverWorkspace(parsed);
      cachedRaw = JSON.stringify(workspaceSchema.parse(cached));
      storage.setItem(WORKSPACE_KEY, cachedRaw);
      warning =
        "Dados inválidos foram isolados. Uma cópia original está preservada no armazenamento local.";
      return cached;
    } catch {
      throw new DomainError(
        "Os dados locais precisam de recuperação. O original foi preservado; não limpe o navegador.",
      );
    }
  };
  load();
  const notify = () => {
    for (const callback of listeners) callback();
  };
  events?.addEventListener("storage", notify);
  let queue = Promise.resolve();
  const transact = async <T>(work: (draft: Workspace) => T | Promise<T>): Promise<T> => {
    const operation = async () => {
      const before = load();
      const draft = structuredClone(before);
      const result = await work(draft);
      draft.revision = before.revision + 1;
      const checked = workspaceSchema.safeParse(draft);
      if (!checked.success)
        throw new DomainError("Os dados da operação não são válidos. Revise os campos.");
      try {
        const raw = JSON.stringify(checked.data);
        storage.setItem(WORKSPACE_KEY, raw);
        cached = checked.data;
        cachedRaw = raw;
      } catch {
        throw new DomainError(
          "Não foi possível salvar. O armazenamento pode estar cheio; seus dados anteriores foram mantidos.",
        );
      }
      notify();
      return result;
    };
    const run = () =>
      typeof navigator !== "undefined" && navigator.locks
        ? navigator.locks.request(WORKSPACE_KEY, operation)
        : operation();
    const pending = queue.then(run, run);
    queue = pending.then(
      () => undefined,
      () => undefined,
    );
    return pending;
  };
  return {
    get warning() {
      return warning;
    },
    getSnapshot: load,
    subscribe(callback) {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    transact,
  };
}
