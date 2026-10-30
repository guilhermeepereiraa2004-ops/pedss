import {
  ArrowRight,
  ChefHat,
  Heart,
  Sandwich,
  Pizza,
  IceCreamBowl,
  Croissant,
  CookingPot,
  UtensilsCrossed,
} from "lucide-react";
import { money } from "../lib/data";
import { getStorefrontTemplate } from "../lib/storefrontTemplates";
import { HERO_IMAGE_SIZES, storeImage } from "../lib/storeImages";
import "./StoreHero.css";

const icons = {
  burger: Sandwich,
  pizza: Pizza,
  bowl: IceCreamBowl,
  icecream: IceCreamBowl,
  snacks: Croissant,
  pastel: CookingPot,
};

export default function StoreHero({ products, description, segment = "burger" }) {
  const template = getStorefrontTemplate(segment);
  const Icon = icons[template.icon] || UtensilsCrossed;
  const eligible = products.filter(
    (p) => p.category === template.category && p.status === "Disponível",
  );
  const startingPrice = eligible.length ? Math.min(...eligible.map((p) => p.priceCents)) : null;
  const ctaContent = (
    <>
      <Icon size={21} />
      <span>{template.cta}</span>
      <span className="burger-cta-arrow">
        <ArrowRight size={22} />
      </span>
    </>
  );
  return (
    <section
      className="burger-hero"
      data-segment={segment}
      data-motion="on"
      aria-labelledby="burger-hero-title"
    >
      <div className="hero-topline">
        {template.eyebrow && <span className="burger-eyebrow">{template.eyebrow}</span>}
      </div>
      <h1 id="burger-hero-title" aria-label={template.title.join(" ")}>
        {template.title.map((line, index) => (
          <span key={line}>
            {index > 0 ? " " : ""}
            {line}
          </span>
        ))}
      </h1>
      <div className="hero-product-stage">
        <div className="burger-hero-copy">
          <span className="hero-copy-label">
            {template.sideTitle[0]}
            <br />
            {template.sideTitle[1]}
          </span>
          <p>{description || template.description}</p>
          <div className="burger-hero-perks">
            <span>
              <ChefHat size={17} />
              {template.perks[0]}
            </span>
            <span>
              <Heart size={17} />
              {template.perks[1]}
            </span>
          </div>
        </div>
        <div className="burger-hero-visual">
          <img
            className="burger-hero-photo"
            {...storeImage(template.image)}
            sizes={HERO_IMAGE_SIZES}
            alt={template.alt}
            width={template.width}
            height={template.height}
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />
          <small className="burger-image-note">Imagem ilustrativa</small>
        </div>
        <div className="hero-order-panel">
          {startingPrice !== null && (
            <div
              className="burger-price-badge"
              aria-label={`${template.plural} a partir de ${money(startingPrice / 100)}`}
            >
              <small>A PARTIR DE</small>
              <strong>{money(startingPrice / 100)}</strong>
            </div>
          )}
          <a className="burger-hero-cta" href="#cardapio">
            {ctaContent}
          </a>
          <a className="hero-explore" href="#cardapio">
            Encontre seu favorito <ArrowRight size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
