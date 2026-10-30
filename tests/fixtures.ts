import { createMemoryRepository } from "../src/adapters/memoryRepository.ts";
import { createLocalAuth } from "../src/adapters/localAuth.ts";
import { createServices } from "../src/application/services.ts";
import { defaultsSettings, emptyTenant } from "../src/core/domain.ts";
import { productSchema, workspaceSchema } from "../src/core/model.ts";
export function storage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}
export const company = {
  id: "store-one",
  name: "Loja de teste",
  slug: "demo",
  primaryColor: "#d5f36b",
  logo: "",
  adminEmail: "store@example.com",
  status: "Ativo" as const,
  plan: "Essencial" as const,
  createdAt: "2026-10-20",
  archived: false,
};
export const trialInput = {
  name: "Pessoa de teste",
  email: "trial@example.com",
  password: "SenhaDeTeste123",
  storeName: "Pastel da Praça",
  slug: "pastel-da-praca",
  heroSegment: "pastel",
  primaryColor: "#e9ad73",
};
export const product = productSchema.parse({
  id: "burger",
  name: "Nome oficial",
  priceCents: 2990,
  category: "Hamburguer",
  description: "Teste",
  image: "",
  status: "Disponível",
  featured: true,
  ingredients: ["Cebola", "Picles"],
  extras: [{ id: "cheese", name: "Queijo", priceCents: 400, available: true }],
});
export function initial() {
  const tenant = emptyTenant(true);
  tenant.products = [structuredClone(product)];
  return workspaceSchema.parse({
    version: 2,
    revision: 0,
    companies: [company],
    tenants: { [company.id]: tenant },
    users: [],
    sessions: [],
    invitations: [],
    resets: [],
    platform: { name: "Central", supportEmail: "", description: "" },
  });
}
export async function fixture(role: "admin" | "owner" | "attendant" = "owner") {
  const repo = createMemoryRepository(initial()),
    auth = createLocalAuth(repo, storage());
  await auth.ready;
  await auth.startDemo(role);
  return { repo, auth, services: createServices(repo, auth) };
}
export const cartLine = {
  productId: "burger",
  quantity: 2,
  extraIds: ["cheese"],
  removedIngredients: ["Cebola"],
  notes: "Bem passado",
};
export const checkout = {
  name: "Cliente fictício",
  phone: "71999999999",
  fulfillment: "delivery",
  street: "Rua de teste",
  number: "123",
  neighborhood: "Centro",
  complement: "Casa",
  reference: "Portão azul",
  areaId: "centro",
  paymentMethod: "Dinheiro",
  changeForCents: 10000,
  notes: "Interfone",
  expectedTotalCents: 7280,
};
