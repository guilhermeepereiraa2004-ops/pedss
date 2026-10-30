import variants from "./storeImageVariants.json";

export const HERO_IMAGE_SIZES = "(max-width: 700px) 100vw, (max-width: 1050px) 65vw, 700px";
export const PRODUCT_IMAGE_SIZES = "(max-width: 800px) 50vw, 320px";
export const DETAIL_IMAGE_SIZES = "(max-width: 700px) 90vw, 600px";

// Only bundled, reviewed assets have variants. Uploaded/remote photos retain their exact URL.
export function storeImage(src) {
  const images = variants[src];
  if (!images) return { src };
  return {
    src: images.at(-1).src,
    srcSet: images.map((image) => `${image.src} ${image.width}w`).join(", "),
  };
}
