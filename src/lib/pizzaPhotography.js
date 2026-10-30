import photos from "./pizzaPhotos.json";
import { pizzaAppearance } from "./pizzaAppearance";

const bundledPhotoSources = new Set(Object.values(photos).map((photo) => photo.src));
// These exact, versioned files ship with the app and were reviewed as alpha cutouts.
// Never trust an arbitrary /images/ URL or a merchant's upload based on its filename.
export function isBundledPizzaPhoto(src) {
  return bundledPhotoSources.has(src);
}

const normalize = (value) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const names = {
  mussarela: "mussarela",
  mucarela: "mussarela",
  mozzarella: "mussarela",
  queijo: "mussarela",
  calabresa: "calabresa",
  margherita: "margherita",
  marguerita: "margherita",
  portuguesa: "portuguesa",
  "frango com requeijao": "frango-requeijao",
  "frango com catupiry": "frango-requeijao",
  frango: "frango-requeijao",
  "quatro queijos": "quatro-queijos",
  "4 queijos": "quatro-queijos",
  "bacon com milho": "bacon-milho",
  pepperoni: "pepperoni",
  toscana: "toscana",
  atum: "atum",
  "carne seca com requeijao": "carne-seca-requeijao",
  "carne seca": "carne-seca-requeijao",
  vegetariana: "vegetariana",
  "chocolate com morango": "chocolate-morango",
  "banana com canela": "banana-canela",
};
const appearances = {
  cheese: "mussarela",
  calabresa: "calabresa",
  chicken: "frango-requeijao",
  vegetable: "vegetariana",
  chocolate: "chocolate-morango",
  banana: "banana-canela",
};
/** Bundled generated illustrations, never a replacement for a merchant's own photo. */
export function pizzaIllustration(flavor = {}) {
  const key =
    (flavor.appearance && flavor.appearance !== "auto"
      ? appearances[flavor.appearance]
      : names[normalize(flavor.name)]) ||
    appearances[pizzaAppearance(flavor)] ||
    "mussarela";
  return photos[key].src;
}
export function pizzaFlavorSources(flavor) {
  return [...new Set([flavor.previewImage, pizzaIllustration(flavor)].filter(Boolean))];
}
