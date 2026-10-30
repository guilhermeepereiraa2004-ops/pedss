import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Sandwich } from "lucide-react";
import { isIllustrativeProductPhoto, productCutoutSources } from "../lib/productPhotography";
import { hasImageTransparency } from "../application/imageEditing";
import { PRODUCT_IMAGE_SIZES, storeImage } from "../lib/storeImages";
import { isBundledPizzaPhoto } from "../lib/pizzaPhotography";
import "./ProductCutout.css";

function Photo({ product, className, motion, priority, sizes }) {
  const [failed, setFailed] = useState([]);
  const [verified, setVerified] = useState("");
  const src = productCutoutSources(product).find((candidate) => !failed.includes(candidate));
  const illustrative = isIllustrativeProductPhoto(product);
  const artwork = useRef(null);
  const image = useRef(null);
  const bundled = isBundledPizzaPhoto(src);
  const ready = !!src && (bundled || verified === src);
  const rejectSource = useCallback(() => {
    setFailed((previous) => (previous.includes(src) ? previous : [...previous, src]));
  }, [src]);
  const verifyImage = useCallback(
    (element) => {
      if (element !== image.current) return;
      if (bundled || hasImageTransparency(element)) setVerified(src);
      else rejectSource();
    },
    [bundled, src, rejectSource],
  );
  useEffect(() => {
    let active = true;
    const element = image.current;
    const checkCachedImage = () => {
      if (!active || !element?.complete) return;
      if (element.naturalWidth > 0) verifyImage(element);
      else rejectSource();
    };
    // A cached image can finish before React receives load. Also recheck a restored page.
    queueMicrotask(checkCachedImage);
    window.addEventListener("pageshow", checkCachedImage);
    return () => {
      active = false;
      window.removeEventListener("pageshow", checkCachedImage);
    };
  }, [src, verifyImage, rejectSource]);
  useLayoutEffect(() => {
    if (!motion || !ready) return;
    // Use the document timeline origin so late images and reopened details share the same phase.
    for (const animation of artwork.current?.getAnimations?.({ subtree: true }) || []) {
      animation.startTime = 0;
    }
  }, [motion, src, ready]);
  return (
    <div
      ref={artwork}
      className={`product-artwork ${className}`}
      data-cutout={!!src}
      data-ready={ready}
      data-motion={motion && ready ? "on" : "off"}
      aria-busy={!!src && verified !== src}
    >
      {src ? (
        <>
          <img
            key={src}
            ref={image}
            className="product-cutout"
            {...storeImage(src)}
            sizes={sizes}
            alt={
              illustrative
                ? `Imagem ilustrativa da categoria ${product.category}`
                : `Foto de ${product.name}`
            }
            width="1200"
            height="1200"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            crossOrigin="anonymous"
            data-verified={ready}
            onLoad={(event) => verifyImage(event.currentTarget)}
            onError={rejectSource}
          />
          {verified !== src && (
            <span className="product-photo-loading" role="status">
              Carregando foto…
            </span>
          )}
        </>
      ) : (
        <div className="product-cutout-empty" role="status">
          <Sandwich size={56} strokeWidth={1} aria-hidden="true" />
          <span>Foto sem fundo de {product.name} em preparação</span>
        </div>
      )}
    </div>
  );
}

export default function ProductCutout({
  product,
  className = "",
  motion = false,
  priority = false,
  sizes = PRODUCT_IMAGE_SIZES,
}) {
  return (
    <Photo
      key={`${product.id}:${product.cutoutImage}:${product.image}`}
      product={product}
      className={className}
      motion={motion}
      priority={priority}
      sizes={sizes}
    />
  );
}
