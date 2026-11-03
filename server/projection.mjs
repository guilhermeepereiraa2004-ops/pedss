import { emptyCart } from "../src/core/domain.ts";
import { trialState } from "../src/core/trials.ts";

export function publicOrder(order) {
  const {
    requestId: _request,
    stockUsage: _stock,
    payments: _payments,
    amendments: _amendments,
    ...safe
  } = order;
  return {
    ...safe,
    ...(safe.production
      ? {
          production: safe.production.map(
            ({ actor: _actor, requestId: _request, ...event }) => event,
          ),
        }
      : {}),
    lines: safe.lines.map(({ unitCostCents: _cost, stockUsage: _usage, ...line }) => line),
    history: safe.history
      .filter((h) => h.kind === "order")
      .map(({ actor: _actor, cashSessionId: _cash, ...event }) => event),
  };
}

function publicProduct({ costCents: _cost, recipe: _recipe, ...p }) {
  const stripRecipe = ({ recipe: _r, ...v }) => v;
  return {
    ...p,
    extras: p.extras.map(({ costCents: _c, recipe: _r, ...e }) => e),
    ...(p.pizza
      ? {
          pizza: {
            ...p.pizza,
            flavors: p.pizza.flavors.map(({ recipeBySize: _recipes, ...f }) => ({
              ...f,
              ...(f.extras ? { extras: f.extras.map(stripRecipe) } : {}),
            })),
            doughs: p.pizza.doughs.map(stripRecipe),
            edges: p.pizza.edges.map(stripRecipe),
          },
        }
      : {}),
  };
}

/** Explicit projection: no credentials, sessions, token hashes or other tenants' private data. */
export function projectState(state, identity, trackingToken = "") {
  const admin = identity?.role === "admin";
  const stateView = {
    version: 2,
    revision: state.revision,
    platform: state.platform,
    companies: [],
    tenants: {},
    users: [],
    invitations: [],
    sessions: [],
    resets: [],
  };
  for (const company of state.companies) {
    const own = admin || identity?.storeId === company.id;
    const management = own && ["admin", "owner"].includes(identity?.role);
    const tenant = state.tenants[company.id];
    const tracked = trackingToken && tenant.orders.find((o) => o.trackingToken === trackingToken);
    if (company.archived && !own && !tracked) continue;
    stateView.companies.push(
      own
        ? company
        : {
            id: company.id,
            slug: company.slug,
            name: company.name,
            logo: company.logo,
            primaryColor: company.primaryColor,
            status: company.status,
            archived: company.archived,
          },
    );
    stateView.tenants[company.id] = {
      products: management ? tenant.products : tenant.products.map(publicProduct),
      orders: own
        ? management
          ? tenant.orders
          : tenant.orders.map(publicOrder)
        : tracked
          ? [publicOrder(tracked)]
          : [],
      settings: tenant.settings,
      online: tenant.online && !trialState(company)?.expired,
      cart: emptyCart(),
      coupons: management
        ? tenant.coupons
        : tenant.coupons
            .filter((c) => c.active && c.advertised)
            .map((c) => ({
              id: c.id,
              code: c.code,
              description: c.description,
              kind: c.kind,
              value: c.value,
              minSubtotalCents: c.minSubtotalCents,
              validFrom: c.validFrom,
              validUntil: c.validUntil,
              active: true,
              advertised: true,
              perCustomerLimit: c.perCustomerLimit,
              usageLimit: null,
            })),
      expenses: management ? tenant.expenses : [],
      ...(tenant.restaurant
        ? {
            restaurant: management
              ? tenant.restaurant
              : {
                  scheduling: tenant.restaurant.scheduling,
                  ...(own
                    ? { tables: tenant.restaurant.tables, tabs: tenant.restaurant.tabs }
                    : {}),
                },
          }
        : {}),
    };
  }
  if (identity && ["admin", "owner"].includes(identity.role)) {
    stateView.users = state.users
      .filter((u) => admin || u.storeId === identity.storeId)
      .map(({ passwordHash: _password, salt: _salt, ...u }) => u);
    stateView.invitations = state.invitations
      .filter((i) => admin || i.storeId === identity.storeId)
      .map(({ tokenHash: _hash, ...i }) => i);
  }
  return stateView;
}
