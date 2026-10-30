import { burgerPhoto, foodPhotos } from "./data";
import { pizzaIllustration } from "./pizzaPhotography";

export function hasProductMotion(product) {
  return !!product.model3dUrl || productCutoutSources(product).length > 0;
}

// Only exact bundled photo origins resolve prepared demo cutouts. Custom photos stay independent.
const demoCutouts = new Map([
  [burgerPhoto, "/images/menu-brasa-only.webp"],
  [foodPhotos.Hamburguer, "/images/menu-house-burger.webp"],
  [foodPhotos.Porção, "/images/menu-fries-cutout.webp"],
  [foodPhotos.Bebida, "/images/menu-drink-cutout.webp"],
  [foodPhotos.Sobremesa, "/images/menu-dessert-cutout.webp"],
]);
const categoryIllustrations = new Map([
  ["Hamburguer", "/images/menu-house-burger.webp"],
  ["Porção", "/images/menu-fries-cutout.webp"],
  ["Bebida", "/images/menu-drink-cutout.webp"],
  ["Sobremesa", "/images/menu-dessert-cutout.webp"],
  ["Pizza", foodPhotos.Pizza],
  ["Açaí", foodPhotos.Açaí],
  ["Sorvete", foodPhotos.Sorvete],
  ["Salgado", foodPhotos.Salgado],
  ["Pastel", foodPhotos.Pastel],
]);

export function isIllustrativeProductPhoto(product) {
  return (
    (!product.image || (product.category === "Pizza" && product.image === foodPhotos.Pizza)) &&
    !product.cutoutImage &&
    categoryIllustrations.has(product.category)
  );
}

export function productCutoutSources(product) {
  const preparedDemo = demoCutouts.get(product.image);
  const selected =
    product.cutoutImage === "/images/menu-brasa-original.webp"
      ? "/images/menu-brasa-only.webp"
      : product.cutoutImage;
  const illustration = isIllustrativeProductPhoto(product)
    ? product.category === "Pizza"
      ? pizzaIllustration(product)
      : categoryIllustrations.get(product.category)
    : "";
  return [...new Set([selected, preparedDemo, illustration].filter(Boolean))];
}
