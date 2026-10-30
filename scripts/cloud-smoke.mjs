import fs from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { createPostgresStore, database } from "../server/database.mjs";
const file = ".quality/pedss-qa.local.json";
const store = createPostgresStore();
if (process.argv.includes("--cleanup")) {
  const qa = JSON.parse(fs.readFileSync(file, "utf8"));
  await store.transact((state) => {
    const company = state.companies.find((c) => c.id === qa.storeId);
    if (company && !company.slug.startsWith("qa-")) throw new Error("Loja não é de teste.");
    state.companies = state.companies.filter((c) => c.id !== qa.storeId);
    delete state.tenants[qa.storeId];
    const users = new Set([qa.adminId, qa.ownerId]);
    state.users = state.users.filter((u) => !users.has(u.id));
    state.sessions = state.sessions.filter((s) => !users.has(s.userId));
    state.invitations = state.invitations.filter((i) => i.storeId !== qa.storeId);
    state.checkoutRequests = Object.fromEntries(
      Object.entries(state.checkoutRequests).filter(([key]) => !key.startsWith(qa.storeId + ":")),
    );
  });
  fs.unlinkSync(file);
  console.log("Removidos somente usuário, loja e pedido criados pelo teste.");
} else {
  const base = process.env.PEDSS_SMOKE_URL || "http://localhost:5175";
  const origin = new URL(base).origin;
  const password = randomBytes(24).toString("hex") + "A1";
  const email = `qa-${randomUUID()}@example.invalid`;
  let cookie = "";
  async function api(body, options = {}) {
    const response = await fetch(`${base}/api/app`, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Pedss-Client": "web",
        Origin: origin,
        ...(options.public ? {} : { Cookie: cookie }),
        ...(options.tracking ? { "X-Pedss-Tracking": options.tracking } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (response.headers.get("set-cookie"))
      cookie = response.headers.get("set-cookie").split(";")[0];
    if (!response.ok) throw new Error(`API ${response.status}: ${data.error?.message}`);
    return data;
  }
  const call = (kind, command, args = [], options) => api({ kind, command, args }, options);
  const initial = await api();
  if (!initial.setupAvailable)
    throw new Error("Conta inicial já existe: não alterar acesso real para fazer teste.");
  const setup = await call("auth", "setup", [
    "QA Pedss",
    email,
    password,
    process.env.PEDSS_SETUP_TOKEN,
  ]);
  const qa = { base, email, password, adminId: setup.identity.id, storeId: randomUUID() };
  fs.writeFileSync(file, JSON.stringify(qa));
  const company = {
    id: qa.storeId,
    slug: `qa-${randomUUID()}`,
    name: "QA Pedss — teste temporário",
    heroSegment: "burger",
    primaryColor: "#d5f36b",
    logo: "",
    adminEmail: email,
    status: "Ativo",
    plan: "Essencial",
    createdAt: new Date().toISOString(),
    archived: false,
  };
  qa.slug = company.slug;
  fs.writeFileSync(file, JSON.stringify(qa));
  await call("service", "saveCompany", [company]);
  const publicData = await api(undefined, { public: true });
  const settings = {
    ...publicData.state.tenants[qa.storeId].settings,
    address: "Endereço fictício de teste",
    deliveryEnabled: false,
    pickupEnabled: true,
  };
  await call("service", "saveSettings", [qa.storeId, settings]);
  const product = {
    id: randomUUID(),
    sku: "QA-001",
    name: "Produto fictício QA",
    category: "Hamburguer",
    priceCents: 2500,
    costCents: 1000,
    description: "Teste temporário",
    image: "",
    ingredients: [],
    extras: [],
    status: "Disponível",
    featured: true,
  };
  await call("service", "saveProduct", [qa.storeId, product]);
  const invite = await call("auth", "invite", [
    "QA Gestor",
    `owner-${randomUUID()}@example.invalid`,
    "owner",
    qa.storeId,
  ]);
  const owner = await call("auth", "acceptInvitation", [invite.result, password]);
  qa.ownerId = owner.identity.id;
  fs.writeFileSync(file, JSON.stringify(qa));
  const cart = {
    requestId: randomUUID(),
    lines: [
      {
        key: randomUUID(),
        productId: product.id,
        quantity: 1,
        extraIds: [],
        removedIngredients: [],
        notes: "",
      },
    ],
  };
  const customer = {
    name: "Cliente fictício QA",
    phone: "71999999999",
    fulfillment: "pickup",
    street: "",
    number: "",
    neighborhood: "",
    complement: "",
    reference: "",
    areaId: "",
    paymentMethod: "Dinheiro",
    changeForCents: null,
    notes: "Teste automatizado",
    expectedTotalCents: 2500,
  };
  const result = await call("checkout", "create", [qa.storeId, cart, customer], { public: true });
  const repeat = await call("checkout", "create", [qa.storeId, cart, customer], { public: true });
  if (result.result.id !== repeat.result.id) throw new Error("Pedido duplicado.");
  const tracking = await api(undefined, { public: true, tracking: result.result.trackingToken });
  if (tracking.state.tenants[qa.storeId].orders.length !== 1)
    throw new Error("Acompanhamento ausente.");
  const accepted = await call("service", "changeOrder", [
    qa.storeId,
    result.result.id,
    "Aceito",
    "",
    result.result.updatedAt,
  ]);
  await call("service", "changePayment", [
    qa.storeId,
    result.result.id,
    "Pago",
    "Teste",
    accepted.result.updatedAt,
  ]);
  await call("auth", "signOut");
  await call("auth", "signIn", [email, password]);
  const source = await store.read();
  const persisted = source.tenants[qa.storeId].orders.find((o) => o.id === result.result.id);
  if (
    persisted?.totalCents !== 2500 ||
    persisted.paymentStatus !== "Pago" ||
    persisted.status !== "Aceito"
  )
    throw new Error("Persistência não confirmada.");
  console.log(
    "API → Neon → resposta verificados: configuração, sessão, loja, catálogo, convite/gestor, checkout idempotente, acompanhamento, aceite, pagamento e novo login. Credenciais QA apenas em arquivo local ignorado.",
  );
}
await database().end();
