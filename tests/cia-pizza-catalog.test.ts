import { expect, it } from "vitest";
import { fixture } from "./fixtures.ts";
import { importLocalCiaMenu, mergeCiaPizzaCatalog } from "../src/application/ciaPizzaCatalog.ts";
import { LOCAL_CIA_ID, prepareLocalPizzaPreview } from "../src/application/localPizzaPreview.ts";
import { priceLine } from "../src/core/domain.ts";
import { pizzaFormatPrices } from "../src/core/pizza.ts";
import { productSchema } from "../src/core/model.ts";
import { localPizzaCatalog } from "../src/adapters/localPizzaCatalog.ts";

const line = (productId: string, extraIds: string[] = []) => ({
  key: "cia-line",
  productId,
  extraIds,
  quantity: 1,
  removedIngredients: [],
  notes: "",
});

it("imports the original sizes and all 73 products with fixed prices and linked flavors", () => {
  const products = mergeCiaPizzaCatalog([]);
  expect(products).toHaveLength(74);
  expect(products.filter((product) => product.image && product.cutoutImage)).toHaveLength(73);
  expect(products.filter((product) => product.category === "Porção")).toHaveLength(7);
  expect(products.filter((product) => product.category === "Bebida")).toHaveLength(15);
  const builder = products.find((product) => product.sku === "CIA-MONTADOR")!;
  expect(builder.pizza!.flavors).toHaveLength(51);
  expect(
    builder.pizza!.flavors.every((flavor) => products.some((p) => p.id === flavor.sourceProductId)),
  ).toBe(true);
  expect(
    pizzaFormatPrices(builder.pizza!).map(({ size, formats }) => [
      size.name,
      size.slices,
      formats.map((format) => [format.count, format.priceCents]),
    ]),
  ).toEqual([
    [
      "Pequena",
      4,
      [
        [1, 6500],
        [2, 6500],
      ],
    ],
    [
      "Média",
      6,
      [
        [1, 7500],
        [2, 7500],
        [3, 7500],
      ],
    ],
    [
      "Grande",
      8,
      [
        [1, 8500],
        [2, 8500],
        [3, 8500],
      ],
    ],
    [
      "Família",
      10,
      [
        [1, 9500],
        [2, 9500],
        [3, 9500],
      ],
    ],
  ]);
  const priced = priceLine(
    {
      ...line(builder.id),
      pizza: {
        sizeId: "family",
        flavorIds: ["cia-flavor-abobrinha", "cia-flavor-brigadeiro", "cia-flavor-quatro-queijos"],
        doughId: "traditional",
        edgeId: "plain",
      },
    },
    products,
  );
  expect(priced.totalCents).toBe(9500);
  expect(priced.pizzaSummary).not.toContain("undefined");
});

it("enforces six pastéis and one juice flavor per item at checkout", () => {
  const products = mergeCiaPizzaCatalog([]);
  const pastel = products.find((p) => p.id === "cia-pastel-6")!;
  const juice = products.find((p) => p.id === "cia-suco-frutas-jarra")!;
  const [cod, beef] = pastel.extras;
  const ids = [cod.id, cod.id, beef.id, beef.id, beef.id, beef.id];
  expect(priceLine(line(pastel.id, ids), products).extras.map((e) => e.name)).toEqual([
    "2 × Bacalhau",
    "4 × Carne",
  ]);
  expect(priceLine(line(pastel.id, ids), products).totalCents).toBe(4000);
  expect(() => priceLine(line(pastel.id, ids.slice(1)), products)).toThrow(/selecione 6/);
  expect(() => priceLine(line(pastel.id, [...ids, beef.id]), products)).toThrow(/selecione 6/);
  expect(juice.extras).toHaveLength(12);
  expect(() => priceLine(line(juice.id), products)).toThrow(/selecione 1/);
  expect(priceLine(line(juice.id, [juice.extras[0].id]), products).totalCents).toBe(2000);
});

it("applies once to Cia da Pizza, keeps matched product IDs and other stores", async () => {
  const f = await fixture("admin");
  await prepareLocalPizzaPreview(f.repo, f.auth);
  await f.repo.transact((state) => {
    state.tenants[LOCAL_CIA_ID].products = localPizzaCatalog.map((item) =>
      productSchema.parse(item),
    );
  });
  const before = structuredClone(f.repo.getSnapshot());
  const old = before.tenants[LOCAL_CIA_ID].products.find((p) => p.name === "Calabresa");
  expect(await importLocalCiaMenu(f.repo, f.auth, LOCAL_CIA_ID)).toBe(true);
  const after = structuredClone(f.repo.getSnapshot());
  expect(after.tenants[LOCAL_CIA_ID].products.find((p) => p.name === "Calabresa")?.id).toBe(
    old?.id,
  );
  expect(after.tenants[LOCAL_CIA_ID].orders).toEqual(before.tenants[LOCAL_CIA_ID].orders);
  for (const [id, tenant] of Object.entries(before.tenants))
    if (id !== LOCAL_CIA_ID) expect(after.tenants[id]).toEqual(tenant);
  expect(await importLocalCiaMenu(f.repo, f.auth, LOCAL_CIA_ID)).toBe(false);
  expect(f.repo.getSnapshot()).toEqual(after);
  const priorPhoto = after.tenants[LOCAL_CIA_ID].products.find(
    (p) => p.id === "cia-pastel-6",
  )!.image;
  await f.repo.transact((state) => {
    const pastel = state.tenants[LOCAL_CIA_ID].products.find((p) => p.id === "cia-pastel-6")!;
    pastel.image = "/images/cia-da-pizza/pastel-6-480-0000000000.webp";
    pastel.cutoutImage = "/images/foto-da-loja.webp";
    pastel.priceCents = 3900;
  });
  expect(await importLocalCiaMenu(f.repo, f.auth, LOCAL_CIA_ID)).toBe(true);
  const refreshed = f.repo
    .getSnapshot()
    .tenants[LOCAL_CIA_ID].products.find((p) => p.id === "cia-pastel-6");
  expect(refreshed).toMatchObject({
    image: priorPhoto,
    cutoutImage: "/images/foto-da-loja.webp",
    priceCents: 3900,
  });
});
