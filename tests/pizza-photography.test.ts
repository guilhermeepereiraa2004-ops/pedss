import fs from "node:fs";
import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import photos from "../src/lib/pizzaPhotos.json";
import { pizzaIllustration, pizzaFlavorSources } from "../src/lib/pizzaPhotography.js";
import { productCutoutSources, isIllustrativeProductPhoto } from "../src/lib/productPhotography.js";

it("PIZZA-PHOTO-01 quatorze sabores possuem imagens próprias otimizadas e publicáveis", () => {
  const names = [
    "Mussarela",
    "Calabresa",
    "Frango com Requeijão",
    "Margherita",
    "Portuguesa",
    "Quatro Queijos",
    "Bacon com Milho",
    "Pepperoni",
    "Toscana",
    "Atum",
    "Carne Seca com Requeijão",
    "Vegetariana",
    "Chocolate com Morango",
    "Banana com Canela",
  ];
  const sources = names.map((name) => pizzaIllustration({ name }));
  expect(new Set(sources).size).toBe(14);
  expect(Object.keys(photos)).toHaveLength(14);
  for (const asset of Object.values(photos)) {
    const bytes = fs.readFileSync(`public${asset.src}`);
    expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
    expect(asset.src).toContain(createHash("sha256").update(bytes).digest("hex").slice(0, 12));
    expect(asset.width).toBe(768);
    expect(bytes.length).toBeLessThan(300_000);
    expect(sources).toContain(asset.src);
  }
});
it("PIZZA-PHOTO-02 fotos cadastradas têm prioridade e ilustrações não alteram cadastro", () => {
  const product = Object.freeze({
    id: "pizza",
    name: "Calabresa",
    category: "Pizza",
    image: "",
    cutoutImage: "",
  });
  expect(productCutoutSources(product)[0]).toBe(pizzaIllustration(product));
  expect(isIllustrativeProductPhoto(product)).toBe(true);
  expect(
    productCutoutSources({
      ...product,
      image: "https://loja.example/pizza.jpg",
      cutoutImage: "/minha-pizza.png",
    }),
  ).toEqual(["/minha-pizza.png"]);
  expect(isIllustrativeProductPhoto({ ...product, cutoutImage: "/minha-pizza.png" })).toBe(false);
  expect(pizzaFlavorSources({ ...product, previewImage: "https://loja.example/top.png" })[0]).toBe(
    "https://loja.example/top.png",
  );
  expect(pizzaIllustration({ name: "Calabresa", appearance: "chicken" })).toBe(
    photos["frango-requeijao"].src,
  );
});
