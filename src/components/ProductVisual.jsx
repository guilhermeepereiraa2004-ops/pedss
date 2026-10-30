import { useEffect, useRef, useState } from "react";
import { loadModelViewer } from "../application/productModels";
import ProductCutout from "./ProductCutout";
import { DETAIL_IMAGE_SIZES, PRODUCT_IMAGE_SIZES } from "../lib/storeImages";
import "./ProductVisual.css";

function Model({ product, className, motion, interactive, priority, sizes }) {
  const ref = useRef(null);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    const element = ref.current;
    let alive = true;
    const loaded = () => {
      if (alive) setStatus("ready");
    };
    const failed = () => {
      if (alive) setStatus("failed");
    };
    element.addEventListener("load", loaded);
    element.addEventListener("error", failed);
    loadModelViewer().catch(failed);
    return () => {
      alive = false;
      element.removeEventListener("load", loaded);
      element.removeEventListener("error", failed);
    };
  }, []);
  return (
    <div className={`product-model ${className}`} data-status={status}>
      <model-viewer
        ref={ref}
        src={product.model3dUrl}
        alt={`Modelo 3D de ${product.name}`}
        auto-rotate={motion ? "" : undefined}
        auto-rotate-delay="0"
        rotation-per-second="30deg"
        camera-controls={interactive ? "" : undefined}
        disable-zoom=""
        touch-action="pan-y"
        shadow-intensity="0.5"
        exposure="1"
        loading="lazy"
        interaction-prompt="none"
      />
      {status !== "ready" && (
        <div className="product-model-poster">
          <ProductCutout product={product} motion={motion} priority={priority} sizes={sizes} />
        </div>
      )}
    </div>
  );
}

export default function ProductVisual({
  product,
  className = "",
  motion = false,
  interactive = false,
  priority = false,
  sizes = interactive ? DETAIL_IMAGE_SIZES : PRODUCT_IMAGE_SIZES,
}) {
  return product.model3dUrl ? (
    <Model
      key={`${product.id}:${product.model3dUrl}`}
      product={product}
      className={className}
      motion={motion}
      interactive={interactive}
      priority={priority}
      sizes={sizes}
    />
  ) : (
    <ProductCutout
      product={product}
      className={className}
      motion={motion}
      priority={priority}
      sizes={sizes}
    />
  );
}
