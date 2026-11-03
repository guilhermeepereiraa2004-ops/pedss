import { useState } from "react";
import { useAction } from "../hooks/useApplication";
import { uuid, priceLine } from "../core/domain.ts";
import { cashSummary, comboStartingPrice } from "../core/restaurant.ts";
import { paidCents, dueCents } from "../core/payments.ts";
import { restaurantSchema } from "../core/restaurantModel.ts";
import { money } from "../lib/data";
import MoneyInput from "./MoneyInput";
import Modal from "./Modal";
import ProductOptions from "./ProductOptions";
import Checkout from "./Checkout";
import PaymentReceipt from "./PaymentReceipt";
import "./RestaurantPanel.css";

function Feedback({ action, message }) {
  return (
    <>
      {action.error && (
        <p className="form-error" role="alert">
          {action.error}
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
    </>
  );
}
function Counter({ tenant, company, services, onDetail }) {
  const [lines, setLines] = useState([]),
    [selected, setSelected] = useState(null),
    [channel, setChannel] = useState("counter"),
    [tabId, setTabId] = useState(""),
    [requestId, setRequestId] = useState(uuid),
    [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [editingLineKey, setEditingLineKey] = useState(null);
  const action = useAction();
  const copy = {
    ...tenant,
    cart: { requestId, lines },
    settings: {
      ...tenant.settings,
      pickupEnabled: true,
      address: tenant.settings.address || "Balcão da loja",
      ...(channel !== "phone" ? { deliveryEnabled: false } : {}),
    },
  };
  return (
    <div className="restaurant-stack">
      <div className="restaurant-intro">
        <span>ATENDIMENTO DA CASA</span>
        <h2>Um novo pedido.</h2>
        <p>
          Monte a venda sem alterar a sacola do cliente. O pagamento entra como pendente e deve ser
          registrado no pedido.
        </p>
      </div>
      <Feedback action={action} message={message} />
      <div className="form-grid">
        <label className="field">
          Origem do pedido
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="counter">Balcão</option>
            <option value="phone">Telefone</option>
            <option value="table">Mesa / comanda</option>
          </select>
        </label>
        {channel === "table" && (
          <label className="field">
            Comanda aberta
            <select required value={tabId} onChange={(e) => setTabId(e.target.value)}>
              <option value="">Selecione</option>
              {tenant.restaurant?.tabs
                .filter((t) => !t.closedAt)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {tenant.restaurant.tables.find((m) => m.id === t.tableId)?.name} ·{" "}
                    {t.customer || "Sem nome"}
                  </option>
                ))}
            </select>
          </label>
        )}
      </div>
      <div className="counter-columns">
        <section className="panel restaurant-stack">
          <h3>Escolha os produtos</h3>
          <label className="field">
            Buscar produto
            <input value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <div className="counter-products">
            {tenant.products
              .filter(
                (p) =>
                  p.status === "Disponível" &&
                  (!p.combo || comboStartingPrice(p, tenant.products) !== null) &&
                  p.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((p) => (
                <button
                  className="counter-product"
                  key={p.id}
                  onClick={() => {
                    action.setError("");
                    setEditingLineKey(null);
                    setSelected(p);
                  }}
                >
                  <strong>{p.name}</strong>
                  <span>
                    {p.pizza || p.combo ? "A partir de " : ""}
                    {money((p.combo ? comboStartingPrice(p, tenant.products) : p.priceCents) / 100)}
                  </span>
                </button>
              ))}
          </div>
        </section>
        <section className="panel">
          <h3>Resumo do atendimento</h3>
          <Checkout
            key={channel}
            tenant={copy}
            availability={{ open: true, reason: "" }}
            customerOptional={channel !== "phone"}
            onEditLine={(key) => {
              const line = lines.find((l) => l.key === key);
              const p = tenant.products.find((p) => p.id === line?.productId);
              if (p) {
                setEditingLineKey(key);
                setSelected(p);
                action.setError("");
              }
            }}
            onQuantity={(key, quantity) =>
              setLines((v) =>
                quantity
                  ? v.map((l) => (l.key === key ? { ...l, quantity } : l))
                  : v.filter((l) => l.key !== key),
              )
            }
            busy={action.busy}
            error={action.error}
            onSubmit={(checkout) =>
              action.run(
                () =>
                  services.createStaffOrder(company.id, {
                    requestId,
                    channel,
                    tabId: tabId || undefined,
                    lines,
                    checkout,
                  }),
                (order) => {
                  setLines([]);
                  setRequestId(uuid());
                  setMessage(`Pedido ${order.number} registrado.`);
                  onDetail(order.id);
                },
              )
            }
          />
        </section>
      </div>
      {selected && (
        <Modal
          title={selected.name}
          onClose={() => {
            setSelected(null);
            setEditingLineKey(null);
          }}
          className={selected.pizza || selected.combo ? "pizza-builder-modal" : ""}
        >
          <ProductOptions
            product={selected}
            products={tenant.products}
            initialLine={lines.find((l) => l.key === editingLineKey)}
            onAdd={(line) => {
              const checked = { ...line, key: editingLineKey || uuid() };
              try {
                priceLine(checked, tenant.products);
                setLines((v) =>
                  editingLineKey
                    ? v.map((l) => (l.key === editingLineKey ? checked : l))
                    : [...v, checked],
                );
                setSelected(null);
                setEditingLineKey(null);
              } catch (e) {
                action.setError(e.message);
              }
            }}
            error={action.error}
          />
        </Modal>
      )}
    </div>
  );
}
function Cash({ tenant, company, services }) {
  const action = useAction(),
    [message, setMessage] = useState("");
  const sessions = tenant.restaurant?.cashSessions || [],
    session = sessions.find((s) => !s.closedAt),
    summary = session ? cashSummary(tenant, session) : null;
  const [opening, setOpening] = useState(0),
    [amount, setAmount] = useState(0),
    [counted, setCounted] = useState(0),
    [kind, setKind] = useState("supply"),
    [reason, setReason] = useState("");
  const run = (fn, msg) => action.run(fn, () => setMessage(msg));
  return (
    <section className="restaurant-stack">
      <div className="restaurant-intro">
        <span>CONFERÊNCIA POR TURNO</span>
        <h2>Caixa da loja.</h2>
        <p>
          O saldo da gaveta considera abertura, pagamentos em dinheiro, estornos, suprimentos e
          sangrias. Pix e cartão aparecem separados. Despesas do financeiro não saem automaticamente
          da gaveta: registre a sangria correspondente para não contar duas vezes.
        </p>
      </div>
      <Feedback action={action} message={message} />
      {!session ? (
        <form
          className="panel form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => services.openCash(company.id, opening), "Caixa aberto.");
          }}
        >
          <h3>Abrir caixa</h3>
          <label className="field">
            Dinheiro inicial (R$)
            <MoneyInput cents={opening} onChange={setOpening} />
          </label>
          <button className="button button-dark" disabled={action.busy}>
            Abrir turno
          </button>
        </form>
      ) : (
        <>
          <div className="restaurant-metrics">
            <article>
              <small>Saldo esperado em dinheiro</small>
              <strong>{money(summary.expectedCents / 100)}</strong>
            </article>
            {Object.entries(summary.receipts).map(([method, value]) => (
              <article key={method}>
                <small>Recebimentos líquidos · {method}</small>
                <strong>{money(value / 100)}</strong>
              </article>
            ))}
          </div>
          <div className="restaurant-grid">
            <form
              className="panel form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () => services.moveCash(company.id, { kind, amountCents: amount, reason }),
                  "Movimento registrado.",
                );
              }}
            >
              <h3>Movimentar dinheiro</h3>
              <label className="field">
                Tipo
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="supply">Suprimento (entrada)</option>
                  <option value="withdrawal">Sangria (saída)</option>
                </select>
              </label>
              <label className="field">
                Valor (R$)
                <MoneyInput cents={amount} onChange={setAmount} />
              </label>
              <label className="field">
                Motivo
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  maxLength="200"
                />
              </label>
              <button className="button button-dark" disabled={action.busy}>
                Registrar movimento
              </button>
            </form>
            <form
              className="panel form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () => services.closeCash(company.id, counted),
                  "Caixa fechado. Conferência preservada no histórico.",
                );
              }}
            >
              <h3>Conferir e fechar</h3>
              <label className="field">
                Dinheiro contado (R$)
                <MoneyInput cents={counted} onChange={setCounted} />
              </label>
              <p>
                Diferença: <strong>{money((counted - summary.expectedCents) / 100)}</strong>
              </p>
              <button className="button button-dark" disabled={action.busy}>
                Fechar turno
              </button>
            </form>
          </div>
          <div className="panel">
            <h3>Movimentos do turno</h3>
            {session.movements.length === 0 ? (
              <p>Sem suprimentos ou sangrias.</p>
            ) : (
              session.movements.map((m) => (
                <p key={m.id}>
                  {m.kind === "supply" ? "Entrada" : "Saída"} · {money(m.amountCents / 100)} ·{" "}
                  {m.reason}
                </p>
              ))
            )}
          </div>
        </>
      )}
      <div className="panel">
        <h3>Turnos encerrados</h3>
        {sessions
          .filter((s) => s.closedAt)
          .slice()
          .reverse()
          .map((s) => (
            <article className="restaurant-line" key={s.id}>
              <strong>
                {new Date(s.openedAt).toLocaleString("pt-BR")} →{" "}
                {new Date(s.closedAt).toLocaleString("pt-BR")}
              </strong>
              <p>
                Esperado: {money(s.expectedCents / 100)} · Contado: {money(s.countedCents / 100)} ·
                Diferença: {money((s.countedCents - s.expectedCents) / 100)}
              </p>
              <small>
                {s.openedBy} / {s.closedBy}
              </small>
            </article>
          ))}
      </div>
    </section>
  );
}
function TabActions({ tab, orders, table, tenant, company, services, onCounter, canFinance }) {
  const action = useAction(),
    [message, setMessage] = useState(""),
    [target, setTarget] = useState(""),
    [selected, setSelected] = useState([]),
    [people, setPeople] = useState(2);
  const remaining = orders.reduce((s, o) => s + dueCents(o), 0),
    base = Math.floor(remaining / people),
    remainder = remaining % people;
  const run = (fn, msg) =>
    action.run(
      async () => {
        await fn();
        return true;
      },
      () => {
        setMessage(msg);
        setSelected([]);
      },
    );
  return (
    <>
      <p>
        {tab.customer || "Comanda sem nome"} · {orders.length} pedidos · Total{" "}
        {money(orders.reduce((s, o) => s + o.totalCents, 0) / 100)}
      </p>
      <p>
        Saldo a receber: <strong>{money(remaining / 100)}</strong>
      </p>
      <fieldset className="form-stack">
        <legend>Pedidos desta comanda</legend>
        {orders.map((o) => (
          <label className="checkbox-field" key={o.id}>
            <input
              type="checkbox"
              checked={selected.includes(o.id)}
              onChange={(e) =>
                setSelected((v) =>
                  e.target.checked ? [...v, o.id] : v.filter((id) => id !== o.id),
                )
              }
            />
            {o.number} · {o.status} · falta {money(dueCents(o) / 100)}
            {paidCents(o) > 0 ? ` · recebido ${money(paidCents(o) / 100)}` : ""}
          </label>
        ))}
      </fieldset>
      {canFinance && remaining > 0 && (
        <details>
          <summary>Receber / dividir pagamento</summary>
          <p>
            Sem seleção, recebe a comanda toda. Com pedidos marcados, recebe apenas o saldo deles. O
            valor é distribuído do pedido mais antigo ao mais recente.
          </p>
          <label className="field">
            Dividir saldo em quantas pessoas?
            <input
              type="number"
              min="1"
              max="100"
              value={people}
              onChange={(e) => setPeople(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            />
          </label>
          <small>
            {people - remainder} pessoa(s) de {money(base / 100)}
            {remainder > 0 ? ` e ${remainder} pessoa(s) de ${money((base + 1) / 100)}` : ""}.
            Sugestão para o saldo total; cada recebimento é lançado abaixo.
          </small>
          <PaymentReceipt
            maximum={
              selected.length
                ? orders.filter((o) => selected.includes(o.id)).reduce((s, o) => s + dueCents(o), 0)
                : remaining
            }
            methods={tenant.settings.paymentMethods}
            busy={action.busy}
            onSubmit={(input) =>
              run(
                () =>
                  services.payTab(company.id, tab.id, {
                    ...input,
                    kind: undefined,
                    reason: undefined,
                    ...(selected.length ? { orderIds: selected } : {}),
                  }),
                "Pagamento da comanda registrado.",
              )
            }
          />
        </details>
      )}
      <details>
        <summary>Transferir mesa / dividir pedidos</summary>
        <label className="field">
          Mesa de destino
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Selecione outra mesa</option>
            {tenant.restaurant.tables
              .filter((t) => t.enabled && t.id !== table.id)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </label>
        <p>
          Transfira toda a comanda para uma mesa livre, ou marque pedidos sem pagamentos para abrir
          ou juntar uma conta na mesa de destino.
        </p>
        <div className="restaurant-actions">
          <button
            className="button button-outline"
            disabled={!target || action.busy}
            onClick={() =>
              run(() => services.transferTab(company.id, tab.id, target), "Comanda transferida.")
            }
          >
            Transferir comanda inteira
          </button>
          <button
            className="button button-outline"
            disabled={
              !target ||
              !selected.length ||
              action.busy ||
              orders.some((o) => selected.includes(o.id) && paidCents(o) > 0)
            }
            onClick={() =>
              run(
                () => services.transferTab(company.id, tab.id, target, selected),
                "Pedidos transferidos.",
              )
            }
          >
            Transferir pedidos selecionados
          </button>
        </div>
      </details>
      <button className="button button-dark" onClick={onCounter}>
        Adicionar consumo pelo balcão
      </button>
      <button
        className="button button-outline"
        disabled={action.busy}
        onClick={() => run(() => services.closeTab(company.id, tab.id), "Comanda encerrada.")}
      >
        Encerrar comanda
      </button>
      <Feedback action={action} message={message} />
    </>
  );
}
function Tables({ tenant, company, services, onCounter, canFinance }) {
  const action = useAction(),
    [name, setName] = useState(""),
    [customer, setCustomer] = useState(""),
    [message, setMessage] = useState("");
  const r = tenant.restaurant;
  return (
    <section className="restaurant-stack">
      <div className="restaurant-intro">
        <span>SALÃO ORGANIZADO</span>
        <h2>Mesas e comandas.</h2>
        <p>
          A equipe registra o consumo pelo balcão. O QR continua somente para consulta do cardápio.
        </p>
      </div>
      <Feedback action={action} message={message} />
      <form
        className="panel form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          action.run(
            () => services.saveTable(company.id, { id: uuid(), name, enabled: true }),
            () => {
              setName("");
              setMessage("Mesa cadastrada.");
            },
          );
        }}
      >
        <label className="field">
          Nome da mesa
          <input required maxLength="40" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button className="button button-dark" disabled={action.busy}>
          Cadastrar mesa
        </button>
      </form>
      <label className="field">
        Nome para a próxima comanda (opcional)
        <input maxLength="70" value={customer} onChange={(e) => setCustomer(e.target.value)} />
      </label>
      <div className="restaurant-grid">
        {r?.tables.map((table) => {
          const tab = r.tabs.find((t) => t.tableId === table.id && !t.closedAt),
            orders = tab
              ? tenant.orders.filter((o) => o.tabId === tab.id && o.status !== "Cancelado")
              : [];
          return (
            <article className="panel restaurant-stack" key={table.id}>
              <h3>{table.name}</h3>
              <span className="tag">
                {tab ? "Ocupada" : table.enabled ? "Livre" : "Desativada"}
              </span>
              {tab ? (
                <>
                  <TabActions
                    key={tab.id}
                    {...{ tab, orders, table, tenant, company, services, onCounter, canFinance }}
                  />
                </>
              ) : (
                <button
                  className="button button-dark"
                  disabled={!table.enabled || action.busy}
                  onClick={() =>
                    action.run(
                      () => services.openTab(company.id, table.id, customer),
                      () => setMessage("Comanda aberta."),
                    )
                  }
                >
                  Abrir comanda
                </button>
              )}
              <button
                className="text-link"
                disabled={!!tab || action.busy}
                onClick={() =>
                  action.run(() =>
                    services.saveTable(company.id, { ...table, enabled: !table.enabled }),
                  )
                }
              >
                {table.enabled ? "Desativar mesa" : "Ativar mesa"}
              </button>
            </article>
          );
        })}
      </div>
      <div className="panel">
        <h3>Histórico de comandas</h3>
        {r?.tabs
          .filter((t) => t.closedAt)
          .slice()
          .reverse()
          .map((t) => (
            <p key={t.id}>
              {r.tables.find((m) => m.id === t.tableId)?.name} · {t.customer || "Sem nome"} ·
              Encerrada em {new Date(t.closedAt).toLocaleString("pt-BR")}
            </p>
          ))}
      </div>
    </section>
  );
}
function Scheduling({ tenant, company, services }) {
  const [config, setConfig] = useState(() => ({
    ...restaurantSchema.parse({}).scheduling,
    ...tenant.restaurant?.scheduling,
  }));
  const action = useAction(),
    [message, setMessage] = useState("");
  return (
    <section className="restaurant-stack">
      <div className="restaurant-intro">
        <span>CAPACIDADE DA COZINHA</span>
        <h2>Pedidos agendados.</h2>
        <p>
          O cliente escolhe um horário de entrega ou retirada. A capacidade limita a quantidade de
          pedidos e, opcionalmente, a quantidade de pizzas por horário. Combos contam todas as
          pizzas incluídas.
        </p>
      </div>
      <form
        className="panel form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          action.run(
            () => services.saveScheduling(company.id, config),
            () => setMessage("Agendamento configurado."),
          );
        }}
      >
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
          />
          Permitir agendamento
        </label>
        <div className="form-grid">
          {[
            ["leadMinutes", "Antecedência mínima (min)", 15, 1440],
            ["slotMinutes", "Intervalo entre horários (min)", 15, 120],
            ["capacity", "Pedidos por horário", 1, 500],
            ["days", "Máximo de dias à frente", 1, 30],
          ].map(([key, label, min, max]) => (
            <label className="field" key={key}>
              {label}
              <input
                type="number"
                required
                min={min}
                max={max}
                value={config[key]}
                onChange={(e) => setConfig({ ...config, [key]: Number(e.target.value) })}
              />
            </label>
          ))}
        </div>
        <label className="field">
          Pizzas por horário (opcional)
          <input
            type="number"
            min="1"
            max="5000"
            value={config.pizzaCapacity ?? ""}
            onChange={(e) => {
              const next = { ...config };
              if (e.target.value === "") delete next.pizzaCapacity;
              else next.pizzaCapacity = Number(e.target.value);
              setConfig(next);
            }}
          />
          <small>
            Vazio: limita apenas pedidos. Cada pizza conta uma unidade, independentemente do
            tamanho.
          </small>
        </label>
        <p className="small-copy muted">
          Horário de referência: Bahia (UTC−3). Os intervalos partem de 00:00. Quando o horário de
          funcionamento está ativo nas Configurações, só são aceitos agendamentos dentro dele.
          Pedidos cancelados liberam a vaga.
        </p>
        <label className="field">
          Espaços simultâneos do forno (opcional)
          <input
            type="number"
            min="1"
            max="100"
            value={config.ovenSlots ?? ""}
            onChange={(e) => {
              const next = { ...config };
              if (e.target.value === "") delete next.ovenSlots;
              else next.ovenSlots = Number(e.target.value);
              setConfig(next);
            }}
          />
          <small>
            Vazio: sem limite de forno. Cada tamanho reserva espaços por um tempo, configurados em
            Pizzaria → Tamanhos e fatias. Padrão: 1 espaço por 10 minutos. O sistema considera
            sobreposição entre horários, inclusive combos. Não organiza fornadas automaticamente:
            reserve capacidade suficiente para as pizzas assarem antes do horário combinado.
          </small>
        </label>
        <Feedback action={action} message={message} />
        <button className="button button-dark" disabled={action.busy}>
          Salvar agendamento
        </button>
      </form>
    </section>
  );
}
export default function RestaurantPanel(props) {
  if (!props.services.createStaffOrder)
    return (
      <p className="notice">
        Estes recursos estão disponíveis no ambiente local. A integração remota será preparada em
        uma etapa posterior.
      </p>
    );
  const Component = {
    counter: Counter,
    cash: Cash,
    tables: Tables,
    scheduling: Scheduling,
  }[props.view];
  return Component ? <Component {...props} /> : null;
}
