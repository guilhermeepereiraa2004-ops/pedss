import { describe, it, expect } from "vitest";
import { fixture, company } from "./fixtures.ts";
import { createLocalAuth } from "../src/adapters/localAuth.ts";
import { storage } from "./fixtures.ts";
describe("acesso local", () => {
  it("AUTH-01 senha é derivada, login valida e logout revoga sessão", async () => {
    const { auth, repo } = await fixture();
    await auth.setup("Pessoa de teste", "admin@example.com", "SenhaTeste123");
    const user = repo.getSnapshot().users.find((u) => u.email === "admin@example.com")!;
    expect(user.passwordHash).not.toContain("SenhaTeste123");
    expect(user.salt.length).toBeGreaterThan(20);
    await auth.signOut();
    expect(auth.current()).toBeNull();
    await expect(auth.signIn("admin@example.com", "errada")).rejects.toThrow("inválidos");
    await auth.signIn("ADMIN@example.com", "SenhaTeste123");
    expect(auth.current()?.role).toBe("admin");
  });
  it("AUTH-02 recuperação tem uso único e encerra sessões anteriores", async () => {
    const { auth } = await fixture();
    await auth.setup("Pessoa de teste", "reset@example.com", "SenhaTeste123");
    const token = await auth.requestReset("reset@example.com");
    expect(token).toBeTruthy();
    await auth.reset(token!, "OutraSenha123");
    expect(auth.current()).toBeNull();
    await expect(auth.reset(token!, "OutraSenha123")).rejects.toThrow("inválido");
    await expect(auth.signIn("reset@example.com", "SenhaTeste123")).rejects.toThrow();
    await auth.signIn("reset@example.com", "OutraSenha123");
    expect(auth.current()?.email).toBe("reset@example.com");
  });
  it("AUTH-03 convite cria atendente da loja e não pode ser reutilizado", async () => {
    const { auth } = await fixture("admin");
    const token = await auth.invite(
      "Atendente Teste",
      "staff@example.com",
      "attendant",
      company.id,
    );
    await auth.acceptInvitation(token, "SenhaTeste123");
    expect(auth.current()).toMatchObject({ role: "attendant", storeId: company.id });
    await expect(auth.acceptInvitation(token, "SenhaTeste123")).rejects.toThrow("inválido");
  });
  it("AUTH-04 gestor não convida administrador nem acessa outra loja", async () => {
    const { auth, services } = await fixture("owner");
    await expect(auth.invite("Teste", "admin2@example.com", "admin", null)).rejects.toThrow();
    await expect(
      auth.invite("Teste", "staff2@example.com", "attendant", "other"),
    ).rejects.toThrow();
    await expect(services.saveProduct("other", {})).rejects.toThrow();
  });
  it("AUTH-05 sessão expirada e conta desativada perdem autorização", async () => {
    const { auth, repo, services } = await fixture("owner");
    await repo.transact((s) => {
      s.sessions.forEach((v) => {
        v.expiresAt = "2020-01-01T00:00:00Z";
      });
    });
    expect(auth.current()).toBeNull();
    await expect(services.setOnline(company.id, false)).rejects.toThrow("Entre");
    const manager = createLocalAuth(repo, storage());
    await manager.ready;
    await manager.startDemo("admin");
    const invitation = await manager.invite(
      "Atendente",
      "disable@example.com",
      "attendant",
      company.id,
    );
    await auth.acceptInvitation(invitation, "SenhaTeste123");
    const userId = auth.current()!.id;
    await manager.setUserActive(userId, false);
    expect(auth.current()).toBeNull();
  });
  it("AUTH-06 sair limpa identidade mesmo quando falha a gravação compartilhada", async () => {
    const { repo } = await fixture();
    const sessionStorage = storage();
    const auth = createLocalAuth(repo, sessionStorage);
    await auth.ready;
    await auth.startDemo("owner");
    const oldTransact = repo.transact;
    repo.transact = async () => {
      throw new Error("Sem espaço");
    };
    await expect(auth.signOut()).rejects.toThrow("Sem espaço");
    expect(auth.current()).toBeNull();
    expect(sessionStorage.getItem("brasa.session.v2")).toBeNull();
    repo.transact = oldTransact;
  });
});
