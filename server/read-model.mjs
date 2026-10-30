import { workspaceSchema } from "../src/core/model.ts";
import { defaultsSettings, emptyTenant } from "../src/core/domain.ts";
import { isDeepStrictEqual } from "node:util";

export async function readWriteSnapshot(db, storeId, omitMedia = false, lock = true) {
  const { rows } = await db.query(
    `
    SELECT (data - 'tenants' - 'companies') || jsonb_build_object(
      'companies', CASE WHEN $4 THEN (SELECT jsonb_agg(c.value || '{"logo":""}'::jsonb) FROM jsonb_array_elements(data->'companies') c) ELSE data->'companies' END,
      'tenants', coalesce((
      SELECT jsonb_object_agg(t.key, CASE WHEN t.key = $1 THEN CASE WHEN $4 THEN t.value || jsonb_build_object(
        'settings', jsonb_set(t.value->'settings', '{banner}', '""'::jsonb),
        'products', coalesce((SELECT jsonb_agg(p.value || '{"image":"","cutoutImage":""}'::jsonb ||
          CASE WHEN jsonb_typeof(p.value->'pizza') = 'object' THEN jsonb_build_object('pizza', (p.value->'pizza') ||
            jsonb_build_object('flavors', (SELECT jsonb_agg(f.value - 'previewImage') FROM jsonb_array_elements(p.value->'pizza'->'flavors') f))) ELSE '{}'::jsonb END)
          FROM jsonb_array_elements(t.value->'products') p), '[]'::jsonb)
      ) ELSE t.value END ELSE
        $2::jsonb || jsonb_build_object('settings', $3::jsonb ||
          jsonb_build_object('heroSegment', coalesce(t.value->'settings'->'heroSegment', '"burger"'::jsonb))) END)
      FROM jsonb_each(data->'tenants') t
    ), '{}'::jsonb)) AS data FROM pedss.workspace WHERE id = 1 ${lock ? "FOR UPDATE" : ""}`,
    [
      storeId || "",
      JSON.stringify({ ...emptyTenant(), cart: { requestId: "write-view", lines: [] } }),
      JSON.stringify(defaultsSettings()),
      omitMedia,
    ],
  );
  if (!rows[0]) throw Error("Banco não inicializado.");
  return rows[0].data;
}

// Apply changed JSON paths under the existing row lock. Unloaded tenants and unchanged
// media never cross the wire back to Postgres, and are never overwritten by placeholders.
export async function writeChanges(db, before, after) {
  const patches = [];
  const walk = (old, next, path) => {
    if (isDeepStrictEqual(old, next)) return;
    if (
      old &&
      next &&
      !Array.isArray(old) &&
      !Array.isArray(next) &&
      typeof old === "object" &&
      typeof next === "object"
    ) {
      for (const key of new Set([...Object.keys(old), ...Object.keys(next)]))
        walk(old[key], next[key], [...path, key]);
    } else patches.push({ path, value: next });
  };
  walk(before, after, []);
  if (!patches.length) return;
  const values = [];
  let expression = `('{"checkoutRequests":{}}'::jsonb || data)`;
  for (const patch of patches) {
    values.push(patch.path);
    if (patch.value === undefined) expression = `(${expression} #- $${values.length}::text[])`;
    else {
      const pathIndex = values.length;
      values.push(JSON.stringify(patch.value));
      expression = `jsonb_set(${expression}, $${pathIndex}::text[], $${values.length}::jsonb, true)`;
    }
  }
  await db.query(
    `UPDATE pedss.workspace SET data = ${expression}, updated_at = now() WHERE id = 1`,
    values,
  );
}

export function requestScope(req) {
  const raw = req.headers["x-pedss-view"];
  if (!raw) return { kind: "legacy" }; // Old clients can finish an in-flight purchase.
  try {
    if (typeof raw !== "string" || raw.length > 400) throw Error();
    const value = JSON.parse(raw);
    if (!["store", "dashboard", "central", "tracking", "auth"].includes(value.kind)) throw Error();
    for (const key of ["store", "tracking"])
      if (value[key] !== undefined && (typeof value[key] !== "string" || value[key].length > 120))
        throw Error();
    return { kind: value.kind, store: value.store || "", tracking: value.tracking || "" };
  } catch {
    throw Object.assign(new Error("Tela inválida."), { status: 400 });
  }
}

// Select in PostgreSQL, before crossing the database -> application boundary. No migration or
// duplicate source of truth: the legacy aggregate and its transactional writes are preserved.
export async function readAccess(db, tokenHash) {
  const { rows } = await db.query(
    `
    WITH w AS (SELECT data FROM pedss.workspace WHERE id = 1),
    login AS (
      SELECT u.value AS usr, s.value AS session FROM w,
        jsonb_array_elements(data->'sessions') s,
        jsonb_array_elements(data->'users') u
      WHERE s.value->>'tokenHash' = $1 AND s.value->>'userId' = u.value->>'id'
        AND (s.value->>'expiresAt')::timestamptz > now() AND (u.value->>'active')::boolean
        AND (u.value->>'role' = 'admin' OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(data->'companies') c
          WHERE c.value->>'id' = u.value->>'storeId' AND NOT coalesce((c.value->>'archived')::boolean, false)
        )) LIMIT 1
    )
    SELECT (data->>'revision')::bigint AS revision,
      (SELECT jsonb_build_object('id', usr->'id', 'name', usr->'name', 'email', usr->'email',
        'role', usr->'role', 'storeId', usr->'storeId', 'demo', coalesce(session->'demo', 'false'::jsonb)) FROM login) AS identity,
      NOT EXISTS (SELECT 1 FROM jsonb_array_elements(data->'users') u WHERE u.value->>'role' = 'admin') AS "setupAvailable"
    FROM w`,
    [tokenHash],
  );
  if (!rows[0]) throw Error("Banco não inicializado.");
  return { ...rows[0], revision: Number(rows[0].revision) };
}

async function selectView(
  db,
  { identity, scope, tracking, catalog = true, operations = true, expectedRevision },
  manifest = false,
) {
  const { rows } = await db.query(
    `
    WITH w AS (SELECT data FROM pedss.workspace WHERE id = 1), selected AS (
      SELECT c.value AS company, data->'tenants'->(c.value->>'id') AS tenant,
        ($2 = 'admin' OR c.value->>'id' = $4) AS own
      FROM w, jsonb_array_elements(data->'companies') c
      WHERE $1 = 'legacy' OR ($1 = 'central' AND $2 = 'admin')
        OR ($1 IN ('store', 'dashboard') AND (c.value->>'id' = $3 OR c.value->>'slug' = $3))
        OR ($1 IN ('auth', 'dashboard') AND $3 = '' AND c.value->>'id' = $4)
        OR ($1 = 'tracking' AND $5 <> '' AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(data->'tenants'->(c.value->>'id')->'orders') o
          WHERE o.value->>'trackingToken' = $5))
    ), view AS (
    SELECT jsonb_build_object(
      'version', 2, 'revision', data->'revision', 'platform', data->'platform',
      'companies', coalesce((SELECT jsonb_agg(CASE WHEN $7 THEN company ELSE company || '{"logo":""}'::jsonb END) FROM selected), '[]'::jsonb),
      'tenants', coalesce((SELECT jsonb_object_agg(company->>'id', jsonb_build_object(
        'products', CASE WHEN $7 AND $1 IN ('store', 'dashboard', 'legacy') THEN tenant->'products' ELSE '[]'::jsonb END,
        'orders', CASE WHEN $8 AND $1 IN ('dashboard', 'legacy') AND own THEN tenant->'orders'
          WHEN $8 AND $5 <> '' THEN coalesce((SELECT jsonb_agg(o.value) FROM jsonb_array_elements(tenant->'orders') o
            WHERE o.value->>'trackingToken' = $5), '[]'::jsonb) ELSE '[]'::jsonb END,
        'settings', CASE WHEN NOT $7 THEN $6::jsonb WHEN $1 = 'central' THEN $6::jsonb || jsonb_build_object('heroSegment', coalesce(tenant->'settings'->'heroSegment', '"burger"'::jsonb))
          WHEN $1 = 'auth' THEN $6::jsonb ELSE tenant->'settings' END,
        'online', CASE WHEN $7 THEN tenant->'online' ELSE 'false'::jsonb END, 'cart', jsonb_build_object('requestId', 'remote-view', 'lines', '[]'::jsonb),
        'coupons', CASE WHEN $7 AND $1 IN ('dashboard', 'legacy') AND own AND $2 IN ('admin', 'owner') THEN coalesce(tenant->'coupons', '[]'::jsonb)
          WHEN $7 AND $1 IN ('store', 'legacy') THEN coalesce((SELECT jsonb_agg(c.value) FROM jsonb_array_elements(tenant->'coupons') c
            WHERE (c.value->>'active')::boolean AND (c.value->>'advertised')::boolean), '[]'::jsonb) ELSE '[]'::jsonb END,
        'expenses', CASE WHEN $8 AND $1 IN ('dashboard', 'legacy') AND own AND $2 IN ('admin', 'owner') THEN coalesce(tenant->'expenses', '[]'::jsonb) ELSE '[]'::jsonb END
      ) || CASE WHEN jsonb_typeof(tenant->'restaurant') = 'object' AND $1 IN ('store', 'dashboard', 'legacy')
        THEN jsonb_build_object('restaurant',
          CASE WHEN $7 THEN jsonb_strip_nulls(jsonb_build_object('scheduling', tenant->'restaurant'->'scheduling')) ELSE '{}'::jsonb END ||
          CASE WHEN $8 AND own AND $1 IN ('dashboard', 'legacy') THEN
            CASE WHEN $2 IN ('admin', 'owner') THEN (tenant->'restaurant') - 'scheduling'
              ELSE jsonb_build_object('tables', coalesce(tenant->'restaurant'->'tables', '[]'::jsonb),
                'tabs', coalesce(tenant->'restaurant'->'tabs', '[]'::jsonb)) END
            ELSE '{}'::jsonb END)
        ELSE '{}'::jsonb END) FROM selected), '{}'::jsonb),
      'users', coalesce((SELECT jsonb_agg(u.value || '{"passwordHash":"","salt":""}'::jsonb) FROM jsonb_array_elements(data->'users') u
        WHERE $8 AND $1 IN ('central', 'dashboard', 'legacy') AND $2 IN ('admin', 'owner')
          AND (($2 = 'admin' AND $1 IN ('central', 'legacy')) OR u.value->>'storeId' IN (SELECT company->>'id' FROM selected))
          AND ($2 = 'admin' OR u.value->>'storeId' = $4)), '[]'::jsonb),
      'invitations', coalesce((SELECT jsonb_agg(i.value || '{"tokenHash":""}'::jsonb) FROM jsonb_array_elements(data->'invitations') i
        WHERE $8 AND $1 IN ('central', 'dashboard', 'legacy') AND $2 IN ('admin', 'owner')
          AND (($2 = 'admin' AND $1 IN ('central', 'legacy')) OR i.value->>'storeId' IN (SELECT company->>'id' FROM selected))
          AND ($2 = 'admin' OR i.value->>'storeId' = $4)), '[]'::jsonb),
      'sessions', '[]'::jsonb, 'resets', '[]'::jsonb
    ) AS data FROM w
    ) ${
      manifest
        ? `SELECT (data->>'revision')::bigint AS revision,
      md5(jsonb_build_object('companies', data->'companies', 'platform', data->'platform',
        'catalog', (SELECT jsonb_object_agg(t.key, (t.value - 'orders' - 'expenses' - 'cart' - 'restaurant') ||
          jsonb_build_object('scheduling', t.value->'restaurant'->'scheduling')) FROM jsonb_each(data->'tenants') t))::text) AS catalog,
      md5(jsonb_build_object('users', data->'users', 'invitations', data->'invitations',
        'operations', (SELECT jsonb_object_agg(t.key, jsonb_build_object('orders', t.value->'orders', 'expenses', t.value->'expenses',
          'restaurant', (t.value->'restaurant') - 'scheduling')) FROM jsonb_each(data->'tenants') t))::text) AS operations
      FROM view WHERE $9::bigint IS NULL OR (data->>'revision')::bigint = $9`
        : `SELECT data FROM view WHERE $9::bigint IS NULL OR (data->>'revision')::bigint = $9`
    }`,
    [
      scope.kind,
      identity?.role || "",
      scope.store || "",
      identity?.storeId || "",
      tracking || "",
      JSON.stringify(defaultsSettings()),
      catalog,
      operations,
      expectedRevision ?? null,
    ],
  );
  return rows[0] || null;
}
export async function readManifest(db, view) {
  const row = await selectView(db, view, true);
  if (!row) throw Error("Banco não inicializado.");
  return { ...row, revision: Number(row.revision) };
}
export async function readScoped(db, view) {
  const row = await selectView(db, view);
  if (!row && view.expectedRevision !== undefined) return null;
  if (!row) throw Error("Banco não inicializado.");
  return workspaceSchema.parse(row.data);
}

// POST already holds the authoritative workspace for validation; trim only its response.
export function scopeState(state, identity, scope, tracking) {
  if (scope.kind === "legacy") return state;
  const companies = state.companies.filter(
    (c) =>
      (scope.kind === "central" && identity?.role === "admin") ||
      (["store", "dashboard"].includes(scope.kind) &&
        (c.id === scope.store || c.slug === scope.store)) ||
      (["auth", "dashboard"].includes(scope.kind) && !scope.store && c.id === identity?.storeId) ||
      (scope.kind === "tracking" &&
        tracking &&
        state.tenants[c.id].orders.some((o) => o.trackingToken === tracking)),
  );
  const tenants = Object.fromEntries(
    companies.map((c) => {
      const tenant = state.tenants[c.id];
      const own = identity?.role === "admin" || identity?.storeId === c.id;
      return [
        c.id,
        {
          ...tenant,
          products: ["store", "dashboard"].includes(scope.kind) ? tenant.products : [],
          orders:
            scope.kind === "dashboard" && own
              ? tenant.orders
              : tenant.orders.filter((o) => tracking && o.trackingToken === tracking),
          expenses: scope.kind === "dashboard" && own ? tenant.expenses : [],
          coupons: ["store", "dashboard"].includes(scope.kind) ? tenant.coupons : [],
          restaurant: ["store", "dashboard"].includes(scope.kind) ? tenant.restaurant : undefined,
          settings:
            scope.kind === "central"
              ? { ...defaultsSettings(), heroSegment: tenant.settings.heroSegment }
              : tenant.settings,
        },
      ];
    }),
  );
  const central = scope.kind === "central" && identity?.role === "admin";
  const selectedIds = new Set(companies.map((c) => c.id));
  return {
    ...state,
    companies,
    tenants,
    users: central
      ? state.users
      : scope.kind === "dashboard"
        ? state.users.filter((u) => selectedIds.has(u.storeId))
        : [],
    invitations: central
      ? state.invitations
      : scope.kind === "dashboard"
        ? state.invitations.filter((i) => selectedIds.has(i.storeId))
        : [],
  };
}
