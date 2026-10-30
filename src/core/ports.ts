import type { Workspace, Identity } from "./model.ts";
export interface WorkspaceRepository {
  getSnapshot(): Workspace;
  subscribe(callback: () => void): () => void;
  transact<T>(work: (draft: Workspace) => T | Promise<T>): Promise<T>;
}
export interface AuthContext {
  current(): Identity | null;
  token(): string | null;
}
/** Future adapter must authorize on the server; browser role checks are only local simulation. */
export interface AuthPort {
  current(): Identity | null;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  registerTrial(input: unknown): Promise<{ storeId: string; slug: string }>;
  requestReset(email: string): Promise<string | null>;
  reset(token: string, password: string): Promise<void>;
}
