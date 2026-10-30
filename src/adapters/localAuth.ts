import {
  DomainError,
  emptyTenant,
  iso,
  requirePermission,
  requireAvailableStoreSlug,
  uuid,
} from "../core/domain.ts";
import { trialRegistrationSchema } from "../core/model.ts";
import { newTrial, requireActiveTrial } from "../core/trials.ts";
import type { AuthPort, WorkspaceRepository } from "../core/ports.ts";
import type { Identity, Role, Workspace, User } from "../core/model.ts";
import type { KeyValueStorage } from "./migration.ts";
const SESSION_KEY = "brasa.session.v2";
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (v) => v.toString(16).padStart(2, "0")).join("");
export const tokenDigest = async (value: string) =>
  hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
async function passwordHash(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  return hex(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: encoder.encode(salt), iterations: 600_000, hash: "SHA-256" },
      key,
      256,
    ),
  );
}
function passwordValid(password: string) {
  if (
    password.length < 10 ||
    password.length > 128 ||
    !/[a-z]/i.test(password) ||
    !/\d/.test(password)
  )
    throw new DomainError("Use uma senha de 10 a 128 caracteres com letras e números.");
}
const safeUser = (user: User, demo: boolean): Identity => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  storeId: user.storeId,
  demo,
});
export function createLocalAuth(
  repo: WorkspaceRepository,
  storage: KeyValueStorage,
): AuthPort & {
  ready: Promise<void>;
  subscribe(fn: () => void): () => void;
  getToken(): string | null;
  startDemo(role: Role): Promise<void>;
  setup(name: string, email: string, password: string): Promise<void>;
  invite(name: string, email: string, role: Role, storeId: string | null): Promise<string>;
  acceptInvitation(token: string, password: string): Promise<void>;
  setUserActive(userId: string, active: boolean): Promise<void>;
  identity(state?: Workspace): Identity | null;
} {
  let hash = "",
    token: string | null = null;
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const fn of listeners) fn();
  };
  const identity = (state = repo.getSnapshot()): Identity | null => {
    const session = state.sessions.find(
      (s) => s.tokenHash === hash && Date.parse(s.expiresAt) > Date.now(),
    );
    const user = session && state.users.find((u) => u.id === session.userId && u.active);
    if (!session || !user) return null;
    if (user.role !== "admin" && !state.companies.some((c) => c.id === user.storeId && !c.archived))
      return null;
    return safeUser(user, session.demo);
  };
  const ready = (async () => {
    try {
      token = storage.getItem(SESSION_KEY);
      if (token) hash = await tokenDigest(token);
    } catch {
      token = null;
      hash = "";
    }
    notify();
  })();
  const newSession = async (userId: string, demo = false) => {
    const raw = uuid() + uuid(),
      digest = await tokenDigest(raw);
    await repo.transact((state) => {
      state.sessions = state.sessions.filter((s) => Date.parse(s.expiresAt) > Date.now());
      state.sessions.push({
        tokenHash: digest,
        userId,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        demo,
      });
    });
    try {
      storage.setItem(SESSION_KEY, raw);
    } catch {
      throw new DomainError("Permita o armazenamento de sessão no navegador.");
    }
    token = raw;
    hash = digest;
    notify();
  };
  const normalizedEmail = (email: string) => email.trim().toLowerCase();
  const checkEmail = (email: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new DomainError("Informe um e-mail válido.");
  };
  const api = {
    ready,
    current: () => identity(),
    identity,
    getToken: () => token,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    async signIn(email: string, password: string) {
      await ready;
      const user = repo
        .getSnapshot()
        .users.find(
          (u) => u.email === normalizedEmail(email) && u.active && !u.id.startsWith("demo-"),
        );
      if (
        !user ||
        !user.passwordHash ||
        (await passwordHash(password, user.salt)) !== user.passwordHash
      )
        throw new DomainError("E-mail ou senha inválidos.");
      await newSession(user.id);
    },
    async signOut() {
      const oldHash = hash;
      hash = "";
      token = null;
      try {
        storage.removeItem(SESSION_KEY);
      } finally {
        notify();
      }
      await repo.transact((state) => {
        state.sessions = state.sessions.filter((s) => s.tokenHash !== oldHash);
      });
    },
    async setup(name: string, email: string, password: string) {
      passwordValid(password);
      checkEmail(email);
      if (name.trim().length < 2) throw new DomainError("Informe seu nome.");
      const salt = uuid(),
        passwordDigest = await passwordHash(password, salt),
        userId = uuid();
      await repo.transact((state) => {
        if (state.users.some((u) => !u.id.startsWith("demo-") && u.role === "admin"))
          throw new DomainError(
            "A conta inicial já foi configurada. Entre ou recupere seu acesso.",
          );
        state.users.push({
          id: userId,
          name: name.trim(),
          email: normalizedEmail(email),
          role: "admin",
          storeId: null,
          active: true,
          passwordHash: passwordDigest,
          salt,
          createdAt: iso(),
        });
      });
      await newSession(userId);
    },
    async registerTrial(input: unknown) {
      await ready;
      if (identity())
        throw new DomainError("Saia da conta atual antes de criar outra conta de teste.");
      const parsed = trialRegistrationSchema.safeParse(input);
      if (!parsed.success)
        throw new DomainError(parsed.error.issues[0]?.message || "Revise o cadastro.");
      const data = parsed.data;
      const salt = uuid(),
        passwordDigest = await passwordHash(data.password, salt);
      const userId = uuid(),
        storeId = uuid();
      await repo.transact((state) => {
        if (state.users.some((u) => normalizedEmail(u.email) === data.email))
          throw new DomainError("Já existe uma conta com este e-mail. Entre para continuar.");
        requireAvailableStoreSlug(state.companies, data.slug);
        state.companies.push({
          id: storeId,
          name: data.storeName,
          slug: data.slug,
          primaryColor: data.primaryColor,
          logo: "",
          adminEmail: data.email,
          status: "Ativo",
          plan: "Essencial",
          createdAt: iso(),
          archived: false,
          trial: newTrial(),
        });
        state.tenants[storeId] = emptyTenant();
        state.tenants[storeId].online = false;
        state.tenants[storeId].settings.heroSegment = data.heroSegment;
        state.tenants[storeId].settings.description = "";
        state.users.push({
          id: userId,
          name: data.name,
          email: data.email,
          role: "owner",
          storeId,
          active: true,
          passwordHash: passwordDigest,
          salt,
          createdAt: iso(),
        });
      });
      await newSession(userId);
      return { storeId, slug: data.slug };
    },
    async startDemo(role: Role) {
      const id = `demo-${role}`;
      await repo.transact((state) => {
        const demo = state.companies.find((c) => c.slug === "demo" && !c.archived);
        if (!demo) throw new DomainError("Loja de demonstração indisponível.");
        if (!state.users.some((u) => u.id === id))
          state.users.push({
            id,
            name: {
              admin: "Admin de demonstração",
              owner: "Gestor de demonstração",
              attendant: "Atendente de demonstração",
            }[role],
            email: `${role}@example.com`,
            role,
            storeId: role === "admin" ? null : demo.id,
            active: true,
            passwordHash: "",
            salt: "",
            createdAt: iso(),
          });
      });
      await newSession(id, true);
    },
    async requestReset(email: string) {
      const user = repo
        .getSnapshot()
        .users.find(
          (u) => u.email === normalizedEmail(email) && u.active && !u.id.startsWith("demo-"),
        );
      if (!user) return null;
      const raw = uuid() + uuid(),
        digest = await tokenDigest(raw);
      await repo.transact((state) => {
        state.resets = state.resets.filter((r) => r.userId !== user.id);
        state.resets.push({
          id: uuid(),
          userId: user.id,
          tokenHash: digest,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          used: false,
        });
      });
      return raw;
    },
    async reset(raw: string, password: string) {
      passwordValid(password);
      const digest = await tokenDigest(raw),
        salt = uuid(),
        passwordDigest = await passwordHash(password, salt);
      await repo.transact((state) => {
        const reset = state.resets.find(
          (r) => r.tokenHash === digest && !r.used && Date.parse(r.expiresAt) > Date.now(),
        );
        if (!reset) throw new DomainError("Link de recuperação inválido ou expirado.");
        const user = state.users.find((u) => u.id === reset.userId && u.active);
        if (!user) throw new DomainError("Conta indisponível.");
        user.passwordHash = passwordDigest;
        user.salt = salt;
        reset.used = true;
        state.sessions = state.sessions.filter((s) => s.userId !== user.id);
      });
      if (!identity()) {
        hash = "";
        token = null;
        storage.removeItem(SESSION_KEY);
        notify();
      }
    },
    async invite(name: string, email: string, role: Role, storeId: string | null) {
      checkEmail(email);
      if (name.trim().length < 2) throw new DomainError("Informe o nome do integrante.");
      const raw = uuid() + uuid(),
        digest = await tokenDigest(raw);
      await repo.transact((state) => {
        const actor = identity(state);
        requirePermission(actor, "team", storeId || undefined);
        if (actor?.role !== "admin" && storeId)
          requireActiveTrial(state.companies.find((c) => c.id === storeId)!);
        if (actor?.role !== "admin" && role !== "attendant")
          throw new DomainError("Gestores podem convidar apenas atendentes da própria loja.");
        if (role !== "admin" && !state.companies.some((c) => c.id === storeId && !c.archived))
          throw new DomainError("Selecione um estabelecimento.");
        if (state.users.some((u) => u.email === normalizedEmail(email)))
          throw new DomainError("Já existe uma conta com este e-mail.");
        state.invitations = state.invitations.filter((i) => i.email !== normalizedEmail(email));
        state.invitations.push({
          id: uuid(),
          name: name.trim(),
          email: normalizedEmail(email),
          role,
          storeId: role === "admin" ? null : storeId,
          tokenHash: digest,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          used: false,
        });
      });
      return raw;
    },
    async acceptInvitation(raw: string, password: string) {
      passwordValid(password);
      const digest = await tokenDigest(raw),
        salt = uuid(),
        passwordDigest = await passwordHash(password, salt),
        userId = uuid();
      await repo.transact((state) => {
        const invite = state.invitations.find(
          (i) => i.tokenHash === digest && !i.used && Date.parse(i.expiresAt) > Date.now(),
        );
        if (!invite) throw new DomainError("Convite inválido ou expirado.");
        if (state.users.some((u) => u.email === invite.email))
          throw new DomainError("Essa conta já existe.");
        if (
          invite.role !== "admin" &&
          !state.companies.some((c) => c.id === invite.storeId && !c.archived)
        )
          throw new DomainError("O estabelecimento deste convite não está disponível.");
        if (invite.role !== "admin")
          requireActiveTrial(state.companies.find((c) => c.id === invite.storeId)!);
        state.users.push({
          id: userId,
          name: invite.name,
          email: invite.email,
          role: invite.role,
          storeId: invite.storeId,
          active: true,
          passwordHash: passwordDigest,
          salt,
          createdAt: iso(),
        });
        invite.used = true;
      });
      await newSession(userId);
    },
    async setUserActive(userId: string, active: boolean) {
      await repo.transact((state) => {
        const user = state.users.find((u) => u.id === userId);
        if (!user) throw new DomainError("Integrante não encontrado.");
        const actor = identity(state);
        requirePermission(actor, "team", user.storeId || undefined);
        if (actor?.role !== "admin" && user.storeId)
          requireActiveTrial(state.companies.find((c) => c.id === user.storeId)!);
        if (actor?.id === userId || userId.startsWith("demo-"))
          throw new DomainError("Essa conta não pode ser desativada por esta ação.");
        if (actor?.role !== "admin" && user.role !== "attendant")
          throw new DomainError("Você pode gerenciar apenas atendentes.");
        user.active = active;
        if (!active) state.sessions = state.sessions.filter((s) => s.userId !== userId);
      });
    },
  };
  return api;
}
