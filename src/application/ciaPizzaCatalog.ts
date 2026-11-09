import {
  ciaJuiceFlavors,
  ciaPastelFlavors,
  ciaPizzaDrinks,
  ciaPizzaFlavors,
  ciaPizzaSides,
  ciaPizzaSizes,
} from "../adapters/ciaPizzaMenu.ts";
import ciaPizzaPhotos from "../lib/ciaPizzaPhotos.json" with { type: "json" };
import { requirePermission } from "../core/domain.ts";
import { productSchema, type Identity, type Product, type Workspace } from "../core/model.ts";
import type { PizzaConfig } from "../core/pizza.ts";
import type { WorkspaceRepository } from "../core/ports.ts";

const builderSku = "CIA-MONTADOR";
const photos: Record<string, string | undefined> = ciaPizzaPhotos;
const menuRows = [...ciaPizzaFlavors, ...ciaPizzaSides, ...ciaPizzaDrinks];
export const ciaMenuPhotosReady = menuRows.every(([key]) => Boolean(photos[key]));
const normalized = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
const formerNames: Record<string, string[]> = {
  "frango-requeijao": ["Frango com Requeijão"],
  marguerita: ["Margherita"],
  "quatro-queijos": ["Quatro Queijos"],
  "qualquer-uma": ["Bacon com Milho"],
  banana: ["Banana com Canela"],
  "coca-cola-1l": ["Coca Cola 1L"],
};

function photoFields(key: string, prior?: Product) {
  if (prior?.image || prior?.cutoutImage || prior?.model3dUrl) return {};
  return { image: photos[key] || "", cutoutImage: photos[key] || "" };
}

export function mergeCiaPizzaCatalog(existing: Product[]) {
  const used = new Set<string>();
  const match = (key: string, name: string, category: Product["category"], sku: string) => {
    const names = [name, ...(formerNames[key] || [])].map(normalized);
    const candidates = existing.filter(
      (product) =>
        !used.has(product.id) &&
        !product.combo &&
        product.pizza?.menuPlacement !== "builder" &&
        product.category === category,
    );
    const found =
      candidates.find((product) => product.sku === sku) ||
      candidates.find((product) => names.includes(normalized(product.name)));
    if (found) used.add(found.id);
    return found;
  };
  const sizes = ciaPizzaSizes.map(([id, name, slices, fixedPriceCents, maxFlavors]) => ({
    id,
    name,
    slices,
    fixedPriceCents,
    maxFlavors,
    allowedFlavorCounts: Array.from({ length: maxFlavors }, (_, i) => i + 1),
    available: true,
  }));
  const pizza: PizzaConfig = {
    pricing: "fixed",
    menuPlacement: "builder",
    allowMixedKinds: true,
    sizes,
    flavors: [],
    doughs: [{ id: "traditional", name: "Tradicional", available: true, priceCents: 0 }],
    edges: [{ id: "plain", name: "Sem recheio", available: true, priceCents: 0 }],
  };
  const minimum = sizes[0].fixedPriceCents;
  const individual = ciaPizzaFlavors.map(([key, name, ingredients, sweet]) => {
    const sku = `CIA-PIZZA-${key.toUpperCase()}`;
    const previous = match(key, name, "Pizza", sku);
    const id = previous?.id || `cia-pizza-${key}`;
    const flavor = {
      id: `cia-flavor-${key}`,
      name,
      available: true,
      prices: {},
      sourceProductId: id,
      kind: sweet ? ("sweet" as const) : ("savory" as const),
      ingredients: [...ingredients],
      previewImage: previous?.cutoutImage || photos[key],
    };
    pizza.flavors.push(flavor);
    return productSchema.parse({
      ...previous,
      ...photoFields(key, previous),
      id,
      sku: previous?.sku || sku,
      name,
      category: "Pizza",
      status: "Disponível",
      description: ingredients.join(", ") + ".",
      ingredients,
      priceCents: minimum,
      extras: (previous?.extras || []).map((extra) => ({ ...extra, available: false })),
      pizza: {
        ...pizza,
        menuPlacement: "catalog",
        sizes: sizes.map((size) => ({ ...size, maxFlavors: 1, allowedFlavorCounts: [1] })),
        flavors: [flavor],
      },
    });
  });
  const previousBuilder = existing.find(
    (product) =>
      product.sku === builderSku ||
      product.id === "cia-local-pizza-builder" ||
      (product.pizza?.menuPlacement === "builder" && normalized(product.name) === "montesuapizza"),
  );
  if (previousBuilder) used.add(previousBuilder.id);
  const builder = productSchema.parse({
    ...previousBuilder,
    id: previousBuilder?.id || "cia-local-pizza-builder",
    sku: builderSku,
    name: "Monte sua pizza",
    description: "Escolha o tamanho e combine seus sabores favoritos.",
    category: "Pizza",
    status: "Disponível",
    priceCents: minimum,
    extras: [],
    pizza,
  });
  const extrasFor = (key: string, names: string[]) =>
    names.map((name) => ({ id: `cia-${key}-${normalized(name)}`, name, priceCents: 0 }));
  const entries = (
    rows: ReadonlyArray<readonly [string, string, number]>,
    category: "Porção" | "Bebida",
  ) =>
    rows.map(([key, name, priceCents]) => {
      const sku = `CIA-${key.toUpperCase()}`;
      const previous = match(key, name, category, sku);
      const pastel = key === "pastel-6";
      const juice = key.startsWith("suco-frutas-");
      return productSchema.parse({
        ...previous,
        ...photoFields(key, previous),
        id: previous?.id || `cia-${key}`,
        sku: previous?.sku || sku,
        name,
        category,
        status: "Disponível",
        priceCents,
        description: pastel
          ? "Escolha os recheios para suas seis unidades."
          : juice
            ? "Escolha um sabor de fruta."
            : "",
        ...(pastel || juice
          ? {
              extras: extrasFor(key, pastel ? ciaPastelFlavors : ciaJuiceFlavors),
              extraSelection: pastel
                ? { label: "Escolha os recheios dos 6 pastéis", min: 6, max: 6 }
                : { label: "Escolha o sabor", min: 1, max: 1 },
            }
          : {}),
      });
    });
  const sides = entries(ciaPizzaSides, "Porção");
  const drinks = entries(ciaPizzaDrinks, "Bebida");
  const catalog = [...individual, ...sides, ...drinks, builder];
  const importedById = new Map(individual.map((item) => [item.id, item]));
  const priorById = new Map(existing.map((item) => [item.id, item]));
  const carried = existing
    .filter((product) => !used.has(product.id))
    .map((product) => {
      if (!product.combo) return product;
      return {
        ...product,
        combo: {
          ...product.combo,
          groups: product.combo.groups.map((group) => ({
            ...group,
            options: group.options.map((option) => {
              if (!importedById.has(option.productId)) return option;
              const prior = priorById
                .get(option.productId)
                ?.pizza?.sizes.find((size) => size.id === option.sizeId);
              const sameSize = sizes.find(
                (size) =>
                  size.id === option.sizeId ||
                  (prior && normalized(size.name) === normalized(prior.name)),
              );
              return { ...option, sizeId: sameSize?.id || option.sizeId || "medium" };
            }),
          })),
        },
      };
    });
  return [...catalog, ...carried];
}

function refreshCiaMenuPhoto(product: Product): Product {
  const latest = (src: string) => {
    const key = /^\/images\/cia-da-pizza\/([a-z0-9-]+)-480-[a-f0-9]{10}\.webp$/.exec(src)?.[1];
    return (key && photos[key]) || src;
  };
  const image = latest(product.image);
  const cutoutImage = latest(product.cutoutImage);
  const flavors = product.pizza?.flavors.map((flavor) => {
    if (!flavor.previewImage) return flavor;
    const previewImage = latest(flavor.previewImage);
    return previewImage === flavor.previewImage ? flavor : { ...flavor, previewImage };
  });
  const changedFlavors = flavors?.some((flavor, index) => flavor !== product.pizza!.flavors[index]);
  return image === product.image && cutoutImage === product.cutoutImage && !changedFlavors
    ? product
    : {
        ...product,
        image,
        cutoutImage,
        pizza: product.pizza && flavors ? { ...product.pizza, flavors } : product.pizza,
      };
}

/** Explicit local preview only. Apply once to the selected Cia tenant. */
export async function importLocalCiaMenu(
  repo: WorkspaceRepository,
  auth: { identity(state: Workspace): Identity | null },
  storeId: string,
) {
  if (!ciaMenuPhotosReady) return false;
  const target = (state: Workspace) =>
    state.companies.some((c) => c.id === storeId && c.slug === "cia-da-pizza" && !c.archived)
      ? state.tenants[storeId]
      : undefined;
  const snapshot = repo.getSnapshot();
  requirePermission(auth.identity(snapshot), "catalog", storeId);
  const current = target(snapshot);
  if (!current) return false;
  const next = (products: Product[]) =>
    products.some((product) => product.sku === builderSku)
      ? products.map(refreshCiaMenuPhoto)
      : mergeCiaPizzaCatalog(products);
  if (!next(current.products).some((product, index) => product !== current.products[index]))
    return false;
  return repo.transact((state) => {
    requirePermission(auth.identity(state), "catalog", storeId);
    const tenant = target(state);
    if (!tenant) return false;
    const products = next(tenant.products);
    if (!products.some((product, index) => product !== tenant.products[index])) return false;
    tenant.products = products;
    return true;
  });
}
