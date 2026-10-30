import type { WorkspaceRepository } from "../core/ports.ts";
import { workspaceSchema, type Workspace } from "../core/model.ts";
/** Deterministic test adapter. No database or browser global required. */
export function createMemoryRepository(initial: Workspace): WorkspaceRepository {
  let state = structuredClone(initial),
    queue = Promise.resolve();
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    transact(work) {
      const run = async () => {
        const next = structuredClone(state),
          result = await work(next);
        next.revision++;
        state = workspaceSchema.parse(next);
        for (const fn of listeners) fn();
        return result;
      };
      const promise = queue.then(run, run);
      queue = promise.then(
        () => undefined,
        () => undefined,
      );
      return promise;
    },
  };
}
