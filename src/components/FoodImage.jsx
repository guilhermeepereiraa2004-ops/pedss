import { useState } from "react";
import { Flame } from "lucide-react";
import { foodPhotos } from "../lib/data";
import { pizzaIllustration } from "../lib/pizzaPhotography";
function Asset({ src, name, className, cutout }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className={`food-placeholder ${className}`}>
      <Flame size={42} />
    </div>
  ) : (
    <img
      className={className}
      src={src}
      alt={name}
      loading="lazy"
      style={cutout ? { objectFit: "contain", background: "#fffaf4" } : undefined}
      onError={() => setFailed(true)}
    />
  );
}
export default function FoodImage({ product, className = "" }) {
  const src =
    product.image ||
    product.cutoutImage ||
    (product.category === "Pizza" ? pizzaIllustration(product) : foodPhotos[product.category]) ||
    foodPhotos.Hamburguer;
  return (
    <Asset
      key={src}
      src={src}
      name={product.name}
      className={className}
      cutout={!product.image && !!product.cutoutImage}
    />
  );
}
