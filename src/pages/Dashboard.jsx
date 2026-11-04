import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  LayoutGrid,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
  Settings,
  Users,
  ArrowUpRight,
  Plus,
  Search,
  Pencil,
  Trash2,
  Flame,
  CircleDollarSign,
  Receipt,
  Truck,
  Package,
  Download,
  Bell,
  BellOff,
  QrCode,
  TicketPercent,
  FileSpreadsheet,
  Pizza,
} from "lucide-react";
import AdminShell from "../components/AdminShell";
import Metrics from "../components/Metrics";
import Modal from "../components/Modal";
import OrdersTable from "../components/OrdersTable";
import OrderDetail from "../components/OrderDetail";
import OrderItemChange from "../components/OrderItemChange";
import ProductEditor from "../components/ProductEditor";
import SettingsEditor from "../components/SettingsEditor";
import TeamPanel from "../components/TeamPanel";
import FoodImage from "../components/FoodImage";
import BusinessOverview from "../components/BusinessOverview";
import CouponPanel from "../components/CouponPanel";
import ExpensePanel from "../components/ExpensePanel";
import ProfitabilityPanel from "../components/ProfitabilityPanel";
import ShippingPanel from "../components/ShippingPanel";
import PizzaManagement from "../components/PizzaManagement";
import RestaurantPanel from "../components/RestaurantPanel";
import CatalogOperations from "../components/CatalogOperations";
import MenuQrPanel from "../components/MenuQrPanel";
import CatalogImport from "../components/CatalogImport";
import TrialAccess from "../components/TrialAccess";
import StoreAvailabilityControl from "../components/StoreAvailabilityControl";
import { CATALOG_TEMPLATE_URL, downloadCurrentCatalog } from "../application/catalogTransfer";
import useApplication, { useAction, useStore } from "../hooks/useApplication";
import { trialState } from "../core/trials.ts";
import useToast from "../hooks/useToast";
import { finance } from "../core/domain.ts";
import { currentStoreAddress, storeHref } from "../application/storeAddress";
import { categories, money, burgerPhoto } from "../lib/data";
import { getStorefrontTemplate } from "../lib/storefrontTemplates";
import "./Dashboard.css";
import "./Operations.css";

const EMPTY = [];
export default function Dashboard() {
  const [params, setParams] = useSearchParams();
  const account = useApplication();
  const slug =
    currentStoreAddress() ||
    params.get("store") ||
    account.state.companies.find((c) => c.id === account.identity?.storeId)?.slug ||
    "demo";
  const app = useStore(slug);
  const { company, tenant, identity, services, availability, now } = app;
  const action = useAction(),
    detailAction = useAction(),
    exportAction = useAction(),
    quickAction = useAction();
  const exportController = useRef(null);
  useEffect(() => () => exportController.current?.abort(), []);
  const [toast, notify] = useToast();
  const canManage = identity?.role === "admin" || identity?.role === "owner";
  const baseNav = [
    { id: "overview", label: "Visão geral", icon: LayoutGrid },
    { id: "orders", label: "Pedidos", icon: ShoppingBag },
    { id: "counter", label: "Balcão e telefone", icon: Receipt },
    { id: "tables", label: "Mesas e comandas", icon: UtensilsCrossed },
  ];
  const nav = canManage
    ? [
        ...baseNav,
        { id: "menu", label: "Cardápio", icon: UtensilsCrossed },
        ...(tenant?.settings.heroSegment === "pizza" ||
        tenant?.products.some((p) => p.category === "Pizza")
          ? [{ id: "pizza", label: "Pizzaria", icon: Pizza }]
          : []),
        { id: "digital-menu", label: "Cardápio digital", icon: QrCode },
        { id: "coupons", label: "Cupons", icon: TicketPercent },
        { id: "combos", label: "Combos", icon: ShoppingBag },
        { id: "inventory", label: "Estoque e fichas", icon: Package },
        { id: "cash", label: "Caixa", icon: CircleDollarSign },
        { id: "scheduling", label: "Agendamento", icon: LayoutGrid },
        { id: "finance", label: "Financeiro", icon: Wallet },
        { id: "shipping", label: "Frete", icon: Truck },
        { id: "settings", label: "Configurações", icon: Settings },
        { id: "team", label: "Equipe", icon: Users },
      ]
    : baseNav;
  const requested = params.get("tab") || "overview",
    active =
      requested === "kitchen"
        ? "orders"
        : requested === "expenses" && canManage
          ? "finance"
          : nav.some((n) => n.id === requested)
            ? requested
            : "overview";
  const [financeView, setFinanceView] = useState(
    requested === "expenses" ? "expenses" : "receipts",
  );
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("Todos"),
    [filter, setFilter] = useState("Todos"),
    [paymentFilter, setPaymentFilter] = useState("Todos");
  const [editing, setEditing] = useState(null),
    [importModal, setImportModal] = useState(false),
    [productModal, setProductModal] = useState(false),
    [deleting, setDeleting] = useState(null),
    [selectedId, setSelectedId] = useState(null),
    [itemChange, setItemChange] = useState(null),
    [sound, setSound] = useState(false);
  const [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const previous = useRef(null),
    audio = useRef(null);
  const orders = tenant?.orders || EMPTY,
    products = tenant?.products || EMPTY;
  useEffect(() => {
    const ids = new Set(orders.map((o) => o.id));
    if (previous.current) {
      const fresh = orders.filter((o) => !previous.current.has(o.id) && o.status === "Pendente");
      if (fresh.length) {
        queueMicrotask(() => notify(`${fresh.length} novo(s) pedido(s) recebido(s).`));
        if (sound && audio.current) {
          const context = audio.current,
            osc = context.createOscillator(),
            gain = context.createGain();
          osc.connect(gain);
          gain.connect(context.destination);
          osc.frequency.value = 660;
          gain.gain.setValueAtTime(0.08, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.4);
          osc.start();
          osc.stop(context.currentTime + 0.4);
        }
      }
    }
    previous.current = ids;
  }, [orders, sound, notify]);
  useEffect(
    () => () => {
      audio.current?.close();
    },
    [],
  );
  if (!company || !tenant)
    return (
      <div className="store-not-found">
        <Flame size={50} />
        <h1>Estabelecimento não encontrado.</h1>
        <Link className="button button-dark" to="/super-admin">
          Abrir central
        </Link>
      </div>
    );
  if (identity.role !== "admin" && identity.storeId !== company.id)
    return (
      <div className="store-not-found">
        <h1>Este acesso pertence a outra loja.</h1>
        <Link className="button button-dark" to="/login">
          Escolher acesso
        </Link>
      </div>
    );
  if (identity.role !== "admin" && trialState(company, now)?.expired)
    return (
      <AdminShell
        storeName={company.name}
        storeId={slug}
        items={[]}
        active="access"
        onNavigate={() => {}}
      >
        <TrialAccess company={company} now={now} />
      </AdminShell>
    );
  const pending = orders.filter((o) => !["Entregue", "Cancelado"].includes(o.status));
  nav.find((n) => n.id === "orders").count = orders.filter((o) => o.status === "Pendente").length;
  const navigate = (tab) => {
    setSearch("");
    if (tab === "expenses") {
      setFinanceView("expenses");
      tab = "finance";
    }
    setParams(currentStoreAddress() ? { tab } : { store: slug, tab });
  };
  const day = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "America/Bahia" });
  const selectedOrders = orders.filter(
    (o) => (!from || day(o.createdAt) >= from) && (!to || day(o.createdAt) <= to),
  );
  const totals = finance(active === "finance" ? selectedOrders : orders);
  const metrics = canManage
    ? [
        {
          label: "Recebimentos confirmados",
          value: money(totals.receivedCents / 100),
          detail: "Registro manual de pagamentos",
          icon: CircleDollarSign,
        },
        {
          label: "Pedidos de hoje",
          value: String(orders.filter((o) => day(o.createdAt) === day(new Date())).length).padStart(
            2,
            "0",
          ),
          detail: "Recebidos neste dia",
          icon: ShoppingBag,
        },
        {
          label: "A receber",
          value: money(totals.pendingCents / 100),
          detail: "Pedidos não cancelados",
          icon: Receipt,
        },
        {
          label: active === "finance" ? "Estornos registrados" : "Produtos no cardápio",
          value:
            active === "finance"
              ? money(totals.refundedCents / 100)
              : String(products.length).padStart(2, "0"),
          detail:
            active === "finance"
              ? "Conferidos manualmente"
              : `${products.filter((p) => p.status === "Disponível").length} disponíveis`,
          icon: Package,
        },
      ]
    : [
        {
          label: "Novos pedidos",
          value: orders.filter((o) => o.status === "Pendente").length,
          detail: "Aguardando aceite",
          icon: Bell,
        },
        {
          label: "Em andamento",
          value: pending.length,
          detail: "Pedidos da operação",
          icon: ShoppingBag,
        },
      ];
  const advanceOrder = (order, next) =>
    quickAction.run(
      () => services.changeOrder(company.id, order.id, next, "", order.updatedAt),
      () => notify("Etapa do pedido atualizada."),
    );
  const selected = orders.find((o) => o.id === selectedId);
  const headings = {
    overview: ["Bom movimento por aqui.", `Vamos acompanhar a ${company.name}.`],
    orders: ["Cada pedido, no seu tempo.", "Aceite, prepare e acompanhe cada etapa."],
    menu: ["Um cardápio de dar fome.", "Produtos, ingredientes, adicionais e disponibilidade."],
    finance: [
      "Receber e entregar são coisas diferentes.",
      "Valores pagos, pendentes e estornados, sem inferir pagamento pela entrega.",
    ],
    settings: ["Tudo do seu jeito.", "Identidade, horários e formas de pagamento."],
    pizza: ["Sua pizzaria, do seu jeito.", "Tamanhos, fatias e valores de cada combinação."],
    counter: ["Atendimento da loja.", "Vendas de balcão, telefone e consumo nas mesas."],
    tables: ["Cada mesa, uma comanda.", "Consumo e fechamento pelo painel da equipe."],
    combos: ["Combinações que vendem.", "Conjuntos com opções e preço próprio."],
    inventory: ["Ingredientes sob controle.", "Fichas técnicas, custos e movimentos de estoque."],
    cash: ["O caixa do turno.", "Abertura, movimentos e conferência do dinheiro."],
    scheduling: ["Um horário para cada pedido.", "Antecedência e capacidade de atendimento."],
    shipping: ["O frete, do seu jeito.", "Taxa única ou por quilômetro, entrega e retirada."],
    team: ["Gente que faz acontecer.", "Acessos e permissões da operação."],
    "digital-menu": [
      "Seu cardápio, em cada mesa.",
      "Consulta presencial, link próprio e QR code para compartilhar.",
    ],
    coupons: ["Um bom motivo para voltar.", "Cupons de desconto para seus clientes."],
    expenses: [
      "Cada saída, no controle.",
      "Registre despesas pagas para completar a visão do seu caixa.",
    ],
  };
  const exportCsv = () => {
    const cell = (v) =>
      `"${String(v)
        .replaceAll('"', '""')
        .replace(/^[\s]*[=+@-]/, "'$&")}"`;
    const content =
      "\ufeffPedido;Cliente;Data;Total;Operação;Pagamento\n" +
      selectedOrders
        .map((o) =>
          [
            o.number,
            o.customer.name,
            day(o.createdAt),
            (o.totalCents / 100).toFixed(2).replace(".", ","),
            o.status,
            o.paymentStatus,
          ]
            .map(cell)
            .join(";"),
        )
        .join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "brasa-financeiro.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Relatório exportado.");
  };
  return (
    <AdminShell
      active={active}
      items={nav}
      onNavigate={navigate}
      storeName={company.name}
      storeId={slug}
      toast={toast}
    >
      <TrialAccess company={company} now={now} welcome={params.get("welcome") === "trial"} />
      <div className="admin-page-head">
        <div>
          <h1>{headings[active][0]}</h1>
          <p>{headings[active][1]}</p>
        </div>
        <div className="head-actions">
          {active === "menu" && (
            <div className="catalog-transfer-actions">
              <button
                className="button button-outline"
                disabled={exportAction.busy}
                onClick={() => {
                  exportController.current?.abort();
                  exportController.current = new AbortController();
                  exportAction.run(
                    () =>
                      downloadCurrentCatalog(services, company.id, exportController.current.signal),
                    (result) =>
                      notify(
                        result.parts > 1
                          ? `Cardápio exportado em ${result.parts} planilhas no ZIP. Extraia e importe cada parte separadamente.`
                          : "Cardápio exportado. Mantenha os códigos e ative a atualização ao reimportar.",
                      ),
                  );
                }}
              >
                <Download size={15} />
                {exportAction.busy ? "Exportando…" : "Exportar cardápio"}
              </button>
              <a
                className="button button-outline"
                href={CATALOG_TEMPLATE_URL}
                download="modelo-cardapio-pedss.xlsx"
              >
                <Download size={15} />
                Baixar modelo
              </a>
              <button className="button button-outline" onClick={() => setImportModal(true)}>
                <FileSpreadsheet size={15} />
                Importar planilha
              </button>
              <button
                className="button button-dark"
                onClick={() => {
                  setEditing(null);
                  action.setError("");
                  setProductModal(true);
                }}
              >
                <Plus size={16} /> Novo produto
              </button>
            </div>
          )}
        </div>
      </div>
      {active === "overview" && (
        <StoreAvailabilityControl
          company={company}
          tenant={tenant}
          now={now}
          canManage={canManage}
          isAdmin={identity.role === "admin"}
          services={services}
          onNavigate={navigate}
          onNotice={notify}
        />
      )}
      {active === "menu" && (
        <p className="catalog-export-help">
          Exporte todos os produtos para editar e reimportar. Produtos sem código recebem um código
          fixo; mantenha os códigos na planilha.
        </p>
      )}
      {active === "menu" && nav.some((n) => n.id === "pizza") && (
        <button className="button button-outline" onClick={() => navigate("pizza")}>
          <Pizza size={16} />
          Configurar tamanhos e preços das pizzas
        </button>
      )}
      {active === "menu" && exportAction.error && (
        <p className="form-error" role="alert">
          {exportAction.error}
        </p>
      )}
      {action.error && !productModal && !deleting && (
        <p className="form-error" role="alert">
          {action.error}
        </p>
      )}
      {["overview", "orders"].includes(active) && (
        <div className="notification-setting">
          <button
            className="button button-outline button-small"
            onClick={() => {
              if (!sound) {
                const Audio = window.AudioContext || window.webkitAudioContext;
                if (Audio) {
                  audio.current = audio.current || new Audio();
                  audio.current.resume();
                  setSound(true);
                }
              } else setSound(false);
            }}
          >
            {sound ? <Bell size={13} /> : <BellOff size={13} />}{" "}
            {sound ? "Som de novos pedidos ativo" : "Ativar som de novos pedidos"}
          </button>
          <span>Alertas neste navegador e entre abas.</span>
        </div>
      )}
      {active === "overview" && (
        <>
          {canManage ? (
            <BusinessOverview
              company={company}
              tenant={tenant}
              now={now}
              onExpenses={() => navigate("expenses")}
              onCatalog={() => navigate("menu")}
            />
          ) : (
            <div style={{ marginTop: 22 }}>
              <Metrics items={metrics} />
            </div>
          )}
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>
                  Pedidos em andamento <span className="small-count">{pending.length}</span>
                </h2>
                <p>{availability.reason}</p>
              </div>
              <button className="text-link" onClick={() => navigate("orders")}>
                Ver todos <ArrowUpRight size={13} />
              </button>
            </div>
            <OrdersTable
              onAdvance={advanceOrder}
              busy={quickAction.busy}
              orders={pending.slice(0, 5)}
              onSelect={(id) => {
                detailAction.setError("");
                setSelectedId(id);
              }}
            />
          </section>
          <div className="dashboard-bottom-grid">
            <section className="menu-promo">
              <div>
                <span className="eyebrow">Sua vitrine digital</span>
                <h2>
                  Deu fome?
                  <br />É esse o objetivo.
                </h2>
                <p>Veja como os clientes encontram os seus sabores.</p>
                <Link to={storeHref(company.slug)} className="button button-dark button-small">
                  Explorar minha loja <ArrowUpRight size={13} />
                </Link>
              </div>
              <img src={burgerPhoto} alt="Burger artesanal" />
            </section>
            <section className="quick-links panel">
              <span className="section-kicker">Faça acontecer</span>
              {canManage && (
                <>
                  <button onClick={() => navigate("menu")}>
                    <span className="quick-icon">
                      <Plus size={17} />
                    </span>
                    <div>
                      <strong>Tem novidade no cardápio?</strong>
                      <span>Adicione um novo produto.</span>
                    </div>
                    <ArrowUpRight size={15} />
                  </button>
                  <button onClick={() => navigate("settings")}>
                    <span className="quick-icon">
                      <Settings size={17} />
                    </span>
                    <div>
                      <strong>Deixe com a sua cara.</strong>
                      <span>Personalize a loja e o atendimento.</span>
                    </div>
                    <ArrowUpRight size={15} />
                  </button>
                </>
              )}
              <button onClick={() => navigate("orders")}>
                <span className="quick-icon">
                  <ShoppingBag size={17} />
                </span>
                <div>
                  <strong>Um olho em cada pedido.</strong>
                  <span>Confira os detalhes da operação.</span>
                </div>
                <ArrowUpRight size={15} />
              </button>
            </section>
          </div>
        </>
      )}
      {quickAction.error && (
        <p className="form-error" role="alert">
          {quickAction.error}
        </p>
      )}
      {active === "orders" && (
        <>
          <div className="table-toolbar" style={{ marginTop: 22 }}>
            <div className="filter-tabs">
              {[
                "Todos",
                "Pendente",
                "Aceito",
                "Preparando",
                "A caminho",
                "Pronto para retirada",
                "Entregue",
                "Cancelado",
              ].map((s) => (
                <button
                  key={s}
                  className={filter === s ? "active" : ""}
                  onClick={() => setFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <label className="search-field">
              <Search size={15} />
              <input
                aria-label="Buscar pedido ou cliente"
                placeholder="Número, nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <section className="panel">
            <OrdersTable
              onAdvance={advanceOrder}
              busy={quickAction.busy}
              orders={orders.filter(
                (o) =>
                  (filter === "Todos" || o.status === filter) &&
                  `${o.number} ${o.customer.name} ${o.customer.phone}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              )}
              onSelect={(id) => {
                detailAction.setError("");
                setSelectedId(id);
              }}
            />
          </section>
        </>
      )}
      {active === "menu" && (
        <>
          <div className="table-toolbar">
            <div className="filter-tabs">
              {categories.map(([value, label]) => (
                <button
                  key={value}
                  className={category === value ? "active" : ""}
                  onClick={() => setCategory(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="search-field">
              <Search size={15} />
              <input
                aria-label="Buscar produto"
                placeholder="Buscar um sabor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="admin-menu-grid">
            {products
              .filter(
                (p) =>
                  (category === "Todos" || p.category === category) &&
                  p.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((p) => (
                <article className="admin-product" key={p.id}>
                  <FoodImage product={p} />
                  <div className="admin-product-info">
                    <span className={`tag ${p.status === "Disponível" ? "" : "neutral"}`}>
                      {p.status}
                    </span>
                    <h2>{p.name}</h2>
                    <p>{p.description}</p>
                    <small className="muted">
                      {p.extras.length} adicionais · {p.ingredients.length} ingredientes opcionais
                    </small>
                    <footer>
                      <strong>{money(p.priceCents / 100)}</strong>
                      <div>
                        <button
                          className="icon-button"
                          aria-label={`Editar ${p.name}`}
                          onClick={() => {
                            setEditing(p);
                            action.setError("");
                            setProductModal(true);
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon-button danger"
                          aria-label={`Excluir ${p.name}`}
                          onClick={() => {
                            action.setError("");
                            setDeleting(p);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </footer>
                  </div>
                </article>
              ))}
          </div>
          {!products.length && (
            <div className="empty-state">
              <UtensilsCrossed size={28} />
              <h3>Seu primeiro sabor começa aqui.</h3>
              <p>Cadastre um produto para abrir o cardápio.</p>
            </div>
          )}
        </>
      )}
      {["counter", "cash", "tables", "scheduling"].includes(active) && (
        <RestaurantPanel
          key={`${company.id}-${active}`}
          view={active}
          mode={app.mode}
          company={company}
          tenant={tenant}
          services={services}
          now={now}
          canFinance={canManage}
          onDetail={setSelectedId}
          onCounter={() => navigate("counter")}
        />
      )}
      {["inventory", "combos"].includes(active) && (
        <CatalogOperations
          key={`${company.id}-${active}`}
          view={active}
          company={company}
          tenant={tenant}
          services={services}
        />
      )}
      {active === "pizza" && (
        <PizzaManagement
          key={company.id}
          company={company}
          products={products}
          services={services}
          onSaved={() => notify("Configurações da pizzaria salvas.")}
        />
      )}
      {active === "finance" && (
        <>
          <div className="finance-sections" role="tablist" aria-label="Seções do financeiro">
            <button
              role="tab"
              aria-selected={financeView === "receipts"}
              onClick={() => setFinanceView("receipts")}
            >
              Recebimentos
            </button>
            <button
              role="tab"
              aria-selected={financeView === "expenses"}
              onClick={() => setFinanceView("expenses")}
            >
              Despesas
            </button>
            <button
              role="tab"
              aria-selected={financeView === "margin"}
              onClick={() => setFinanceView("margin")}
            >
              Custos e margem
            </button>
          </div>
          {financeView === "expenses" ? (
            <ExpensePanel
              key={company.id}
              company={company}
              tenant={tenant}
              services={services}
              now={now}
            />
          ) : financeView === "margin" ? (
            <ProfitabilityPanel
              orders={orders}
              from={from}
              to={to}
              onFrom={setFrom}
              onTo={setTo}
              onCatalog={() => navigate("menu")}
              onOrder={(id) => {
                detailAction.setError("");
                setSelectedId(id);
              }}
            />
          ) : (
            <>
              <div className="table-toolbar">
                <div className="csv-export">
                  <label className="field">
                    De
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </label>
                  <label className="field">
                    Até
                    <input
                      type="date"
                      value={to}
                      min={from}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </label>
                  <button className="button button-outline button-small" onClick={exportCsv}>
                    <Download size={13} /> Exportar CSV
                  </button>
                </div>
                <div className="filter-tabs">
                  {["Todos", "Pendente", "Pago", "Estornado"].map((s) => (
                    <button
                      key={s}
                      className={paymentFilter === s ? "active" : ""}
                      onClick={() => setPaymentFilter(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <Metrics items={metrics} />
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Recebimentos da operação</h2>
                    <p>Abra um pedido para registrar pagamento ou estorno manual.</p>
                  </div>
                </div>
                <OrdersTable
                  onAdvance={advanceOrder}
                  busy={quickAction.busy}
                  orders={selectedOrders.filter(
                    (o) => paymentFilter === "Todos" || o.paymentStatus === paymentFilter,
                  )}
                  onSelect={(id) => {
                    detailAction.setError("");
                    setSelectedId(id);
                  }}
                />
              </section>
              <p className="audit-info">
                Vendas entregues no período: {money(totals.deliveredCents / 100)}. Dados de
                pagamento são registros manuais; nenhuma transação financeira é executada.
              </p>
            </>
          )}
        </>
      )}
      {active === "shipping" && (
        <ShippingPanel key={company.id} company={company} tenant={tenant} services={services} />
      )}
      {active === "settings" && (
        <SettingsEditor
          onShipping={() => navigate("shipping")}
          key={company.id}
          company={company}
          settings={tenant.settings}
          busy={action.busy}
          error={action.error}
          onSave={(settings, branding) =>
            action.run(
              () => services.configureStore(company.id, settings, branding),
              () => notify("Configurações e identidade salvas."),
            )
          }
        />
      )}
      {active === "team" && <TeamPanel storeId={company.id} />}
      {active === "digital-menu" && (
        <MenuQrPanel key={company.id} company={company} mode={app.mode} />
      )}
      {active === "coupons" && (
        <CouponPanel
          key={company.id}
          company={company}
          tenant={tenant}
          services={services}
          now={now}
        />
      )}
      {productModal && (
        <Modal
          title={editing ? "Editar sabor" : "Um novo sabor na casa."}
          onClose={() => setProductModal(false)}
        >
          <ProductEditor
            catalog={tenant.products}
            product={editing}
            defaultCategory={getStorefrontTemplate(tenant.settings.heroSegment).category}
            busy={action.busy}
            error={action.error}
            onClose={() => setProductModal(false)}
            onSave={(product) =>
              action.run(
                () => services.saveProduct(company.id, product),
                () => {
                  setProductModal(false);
                  notify("Produto salvo.");
                },
              )
            }
          />
        </Modal>
      )}
      {importModal && (
        <Modal
          title="Importar cardápio por planilha"
          className="catalog-import-modal"
          onClose={() => setImportModal(false)}
        >
          <CatalogImport
            products={products}
            onImport={(document, options) => services.importCatalog(company.id, document, options)}
            onImported={(result) => {
              setImportModal(false);
              notify(
                `Importação concluída: ${result.created} produtos adicionados e ${result.updated} atualizados.`,
              );
            }}
          />
        </Modal>
      )}
      {deleting && (
        <Modal title="Retirar do cardápio?" onClose={() => setDeleting(null)}>
          <p className="small-copy muted">
            O produto “{deleting.name}” deixará de aparecer na loja. Pedidos anteriores mantêm sua
            composição.
          </p>
          {action.error && (
            <p role="alert" className="form-error">
              {action.error}
            </p>
          )}
          <div className="modal-actions">
            <button className="button button-outline" onClick={() => setDeleting(null)}>
              Manter produto
            </button>
            <button
              className="button button-dark"
              disabled={action.busy}
              onClick={() =>
                action.run(
                  () => services.removeProduct(company.id, deleting.id),
                  () => {
                    setDeleting(null);
                    notify("Produto removido.");
                  },
                )
              }
            >
              Remover produto
            </button>
          </div>
        </Modal>
      )}
      {selected && (
        <Modal
          title={`Pedido ${selected.number}`}
          className={itemChange ? "pizza-builder-modal" : ""}
          onClose={() => {
            setItemChange(null);
            setSelectedId(null);
          }}
        >
          {itemChange ? (
            <OrderItemChange
              key={`${selected.id}-${itemChange.kind}-${itemChange.lineIndex}`}
              order={selected}
              tenant={tenant}
              {...itemChange}
              canFinance={canManage}
              onBack={() => {
                setItemChange(null);
                detailAction.setError("");
              }}
              onSave={(input) =>
                detailAction.run(
                  () => services.amendOrderItem(company.id, selected.id, input),
                  () => {
                    setItemChange(null);
                    notify("Item atualizado. Confira os valores e o saldo do pedido.");
                  },
                )
              }
              busy={detailAction.busy}
              error={detailAction.error}
            />
          ) : (
            <OrderDetail
              storeName={company.name}
              key={selected.id}
              order={selected}
              canFinance={canManage}
              paymentMethods={tenant.settings.paymentMethods}
              onEditItem={
                services.amendOrderItem
                  ? (lineIndex) => {
                      detailAction.setError("");
                      setItemChange({ lineIndex, kind: "edit" });
                    }
                  : undefined
              }
              onCancelItem={
                services.amendOrderItem
                  ? (lineIndex) => {
                      detailAction.setError("");
                      setItemChange({ lineIndex, kind: "cancel" });
                    }
                  : undefined
              }
              onPartialPayment={
                services.recordOrderPayment
                  ? (input) =>
                      detailAction.run(
                        async () => {
                          await services.recordOrderPayment(company.id, selected.id, {
                            ...input,
                            expectedUpdatedAt: selected.updatedAt,
                          });
                          return true;
                        },
                        () => notify("Recebimento atualizado."),
                      )
                  : undefined
              }
              busy={detailAction.busy}
              error={detailAction.error}
              onTransition={(next, reason) =>
                detailAction.run(
                  () =>
                    services.changeOrder(company.id, selected.id, next, reason, selected.updatedAt),
                  () => notify("Etapa do pedido atualizada."),
                )
              }
              onPayment={(next, reason) =>
                detailAction.run(
                  () =>
                    services.changePayment(
                      company.id,
                      selected.id,
                      next,
                      reason,
                      selected.updatedAt,
                    ),
                  () => notify("Registro de pagamento atualizado."),
                )
              }
            />
          )}
        </Modal>
      )}
    </AdminShell>
  );
}
