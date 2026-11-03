import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  ShoppingBag,
  ShoppingCart,
  Search,
  Clock3,
  Bike,
  Flame,
  UtensilsCrossed,
  Sandwich,
  Pizza,
  IceCreamBowl,
  IceCreamCone,
  Croissant,
  CookingPot,
  CupSoda,
  CakeSlice,
  Leaf,
  SlidersHorizontal,
} from "lucide-react";
import LandingBrand from "../components/LandingBrand";
import StoreLogo from "../components/StoreLogo";
import ProductVisual from "../components/ProductVisual";
import ComboMenuCard from "../components/ComboPresentation";
import Modal from "../components/Modal";
import ProductOptions from "../components/ProductOptions";
import Checkout from "../components/Checkout";
import CouponOffers from "../components/CouponOffers";
import StoreHero from "../components/StoreHero";
import { useStore, useAction } from "../hooks/useApplication";
import { DEFAULT_STORE_DESCRIPTION } from "../core/domain.ts";
import { pizzaFlavorAvailable } from "../core/pizza.ts";
import { comboStartingPrice } from "../core/restaurant.ts";
import { shippingMode } from "../core/shipping.ts";
import useToast from "../hooks/useToast";
import { categories, money } from "../lib/data";
import { storeColors } from "../lib/storeColors";
import { storeHref } from "../application/storeAddress";
import { getStorefrontTemplate } from "../lib/storefrontTemplates";
import "./Storefront.css";
import "./Operations.css";
import "./StorefrontBody.css";

const categoryIcons = {
  Todos: UtensilsCrossed,
  Hamburguer: Sandwich,
  Pizza,
  Açaí: IceCreamBowl,
  Sorvete: IceCreamCone,
  Salgado: Croissant,
  Pastel: CookingPot,
  Porção: CookingPot,
  Bebida: CupSoda,
  Sobremesa: CakeSlice,
  Salada: Leaf,
};
export default function Storefront({ manualStoreId }) {
  const { storeId } = useParams();
  return (
    <StoreExperience key={manualStoreId || storeId} slug={manualStoreId || storeId || "demo"} />
  );
}
function StoreExperience({ slug }) {
  const { company, tenant, availability, services, now, mode } = useStore(slug),
    action = useAction(),
    navigate = useNavigate();
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("Todos"),
    [cartOpen, setCartOpen] = useState(false),
    [productId, setProductId] = useState(null);
  const [editingCartKey, setEditingCartKey] = useState(null);
  const [toast, notify] = useToast();
  if (!company || !tenant)
    return (
      <div className="store-not-found">
        <LandingBrand />
        <Flame size={60} />
        <h1>Essa brasa ainda não acendeu.</h1>
        <p>Estabelecimento não encontrado.</p>
        <Link className="button button-dark" to="/store/demo">
          Conhecer a loja demo <ArrowUpRight size={15} />
        </Link>
      </div>
    );
  const settings = tenant.settings,
    availableProducts = tenant.products.filter(
      (p) =>
        p.status === "Disponível" && (!p.combo || comboStartingPrice(p, tenant.products) !== null),
    ),
    products = availableProducts.filter((p) => p.pizza?.menuPlacement !== "builder"),
    pizzaBuilders = availableProducts.filter(
      (p) =>
        p.category === "Pizza" &&
        p.pizza?.sizes.some(
          (size) =>
            size.available &&
            size.maxFlavors > 1 &&
            p.pizza.flavors.filter((f) => pizzaFlavorAvailable(p.pizza, f, size.id)).length > 1,
        ),
    ),
    filtered = products.filter(
      (p) =>
        (category === "Todos" || p.category === category) &&
        `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()),
    );
  const count = tenant.cart.lines.reduce((s, l) => s + l.quantity, 0);
  const selected = availableProducts.find((p) => p.id === productId);
  const canBuild = Boolean(availability.open || availability.canSchedule);
  const closeProduct = () => {
    setProductId(null);
    if (editingCartKey) setCartOpen(true);
    setEditingCartKey(null);
  };
  const colors = storeColors(company.primaryColor);
  const template = getStorefrontTemplate(settings.heroSegment);
  return (
    <div
      className={`store-page${count ? " has-cart" : ""}`}
      data-hero-background={settings.heroBackground || "white"}
      style={{
        "--store-accent": colors.accent,
        "--store-on-accent": colors.onAccent,
        "--store-accent-ink": colors.headline,
        "--store-accent-text": colors.text,
      }}
    >
      <header className="store-header store-container">
        <Link className="store-logo" to={storeHref(company.slug)}>
          <StoreLogo company={company} />
          <div>
            {company.name}
            <small>{template.tagline}</small>
          </div>
        </Link>
        <nav className="store-hero-nav" aria-label="Navegação da loja">
          <a href="#cardapio">{template.navigation}</a>
          <a href="#como-pedir">Como pedir</a>
        </nav>
        <div className="store-header-actions">
          <button
            className="store-bag button button-outline"
            onClick={() => {
              action.setError("");
              setCartOpen(true);
            }}
          >
            <ShoppingBag size={17} /> Meu pedido <b>{count}</b>
          </button>
        </div>
      </header>
      <main className="store-container">
        <StoreHero
          products={products}
          description={
            settings.description === DEFAULT_STORE_DESCRIPTION ? undefined : settings.description
          }
          segment={settings.heroSegment}
        />
        <section className="store-facts" aria-label="Informações do estabelecimento">
          <div className={`store-fact-status ${availability.open ? "" : "closed"}`}>
            <span className="store-fact-icon">
              <Flame size={21} />
            </span>
            <span>
              <small>
                Atendimento <i aria-hidden="true" />
              </small>
              <strong>{availability.open ? "Aberto agora" : "Fechado agora"}</strong>
            </span>
          </div>
          <div>
            <span className="store-fact-icon">
              <Clock3 size={21} />
            </span>
            <span>
              <small>Tempo estimado</small>
              <strong>{settings.deliveryTime}</strong>
            </span>
          </div>
          {settings.deliveryEnabled && (
            <div>
              <span className="store-fact-icon">
                <Bike size={21} />
              </span>
              <span>
                <small>Taxa de entrega</small>
                <strong>
                  {shippingMode(settings) === "fixed"
                    ? money(settings.shipping.fixedFeeCents / 100)
                    : shippingMode(settings) === "distance"
                      ? "Calculado pelo CEP"
                      : settings.areas.length
                        ? `A partir de ${money(Math.min(...settings.areas.map((a) => a.feeCents)) / 100)}`
                        : "Em configuração"}
                </strong>
              </span>
            </div>
          )}
          {settings.pickupEnabled && (
            <div>
              <span className="store-fact-icon">
                <ShoppingBag size={21} />
              </span>
              <span>
                <small>Prefere passar aqui?</small>
                <strong>Retirada na loja</strong>
              </span>
            </div>
          )}
        </section>
        {!availability.open && (
          <div className="notice store-closed">
            {availability.reason}{" "}
            {availability.canSchedule
              ? "Você pode montar seu pedido e agendar para um horário de atendimento."
              : "Você pode explorar o cardápio."}
          </div>
        )}
        <section className="store-menu" id="cardapio">
          <CouponOffers tenant={tenant} now={now} />
          <div className="store-section-head">
            <div>
              <span className="eyebrow">O CARDÁPIO DA CASA</span>
              <h2>
                <span className="store-menu-title-intro">Escolha o seu</span>{" "}
                <span className="store-menu-title-focus">
                  próximo <span className="store-menu-title-highlight">favorito.</span>
                </span>
              </h2>
              <p>Um cardápio cheio de possibilidades. Qual combina com a sua vontade de hoje?</p>
            </div>
            <label className="search-field">
              <Search size={16} />
              <input
                type="search"
                aria-label="Buscar no cardápio"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="O que deu vontade?"
              />
            </label>
          </div>
          {pizzaBuilders.length > 0 && (
            <aside
              className="store-pizza-invitation"
              aria-label="Monte uma pizza com vários sabores"
            >
              <div>
                <strong>Quer mais de um sabor?</strong>
                <p>Combine seus favoritos em uma pizza do seu jeito.</p>
              </div>
              <div className="store-pizza-invitation-actions">
                {pizzaBuilders.map((builder) => (
                  <button
                    type="button"
                    className="button button-dark"
                    key={builder.id}
                    disabled={!canBuild}
                    onClick={() => {
                      action.setError("");
                      setProductId(builder.id);
                    }}
                  >
                    {pizzaBuilders.length === 1 ? "Monte sua pizza" : `Montar ${builder.name}`}{" "}
                    <ArrowUpRight size={17} />
                  </button>
                ))}
              </div>
            </aside>
          )}
          <div className="store-menu-layout">
            <div className="store-menu-categories">
              <nav className="store-categories" aria-label="Categorias do cardápio">
                {categories
                  .filter(
                    ([value]) => value === "Todos" || products.some((p) => p.category === value),
                  )
                  .map(([value, label]) => {
                    const CategoryIcon = categoryIcons[value] || UtensilsCrossed;
                    return (
                      <button
                        key={value}
                        className={category === value ? "active" : ""}
                        aria-pressed={category === value}
                        onClick={() => setCategory(value)}
                      >
                        <span className="store-category-icon" aria-hidden="true">
                          <CategoryIcon size={23} />
                        </span>
                        <span className="store-category-name">{label}</span>
                        <span className="store-category-count">
                          {value === "Todos"
                            ? products.length
                            : products.filter((p) => p.category === value).length}
                        </span>
                      </button>
                    );
                  })}
              </nav>
            </div>
            <div className="store-menu-list">
              <div className="catalog-photo-controls">
                <p role="status">
                  <strong>{filtered.length}</strong>{" "}
                  {filtered.length === 1 ? "sabor para escolher" : "sabores para escolher"}
                </p>
              </div>
              <div className="store-products">
                {filtered.map((product, index) =>
                  product.combo ? (
                    <ComboMenuCard
                      key={product.id}
                      product={product}
                      products={tenant.products}
                      priority={index < 2}
                      canOrder={canBuild}
                      onOpen={() => {
                        action.setError("");
                        setProductId(product.id);
                      }}
                    />
                  ) : (
                    <article
                      className="store-product"
                      data-category={product.category}
                      key={product.id}
                    >
                      <div className="store-product-photo">
                        <button
                          type="button"
                          className="product-photo-button"
                          aria-label={`Ver ${product.name}`}
                          onClick={() => {
                            action.setError("");
                            setProductId(product.id);
                          }}
                        >
                          <ProductVisual product={product} motion priority={index < 2} />
                        </button>
                        {product.featured && (
                          <span className="product-featured">
                            <Flame size={11} /> FAVORITO DA CASA
                          </span>
                        )}
                      </div>
                      <div className="store-product-body">
                        <span className="product-category">
                          {categories.find(([v]) => v === product.category)?.[1]}
                        </span>
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <div className="product-actions">
                          <strong>
                            {(product.pizza || product.combo) && <small>A partir de </small>}
                            {money(comboStartingPrice(product, tenant.products) / 100)}
                          </strong>
                          <button
                            type="button"
                            className="product-add"
                            disabled={!canBuild}
                            aria-label={`Escolher ${product.name}`}
                            onClick={() => {
                              action.setError("");
                              setProductId(product.id);
                            }}
                          >
                            <span>Escolher</span> <ArrowUpRight size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ),
                )}
              </div>
              {!filtered.length && (
                <div className="empty-state">
                  <Search size={30} />
                  <h3>Nenhum sabor encontrado.</h3>
                  <p>
                    {products.length
                      ? "Experimente outra busca ou categoria."
                      : "O cardápio está sendo preparado."}
                  </p>
                  <button
                    className="button button-outline button-small"
                    style={{ marginTop: 15 }}
                    onClick={() => {
                      setSearch("");
                      setCategory("Todos");
                    }}
                  >
                    Ver todo o cardápio
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="store-how" id="como-pedir" aria-labelledby="store-how-title">
          <div className="store-how-heading">
            <span className="eyebrow">BATEU A VONTADE?</span>
            <h2 id="store-how-title">
              Seu pedido.
              <br /> <span>Sem complicar.</span>
            </h2>
            <a href="#cardapio">
              Explorar o cardápio <ArrowUpRight size={18} />
            </a>
          </div>
          <ol>
            <li>
              <span className="store-step-number">01</span>
              <UtensilsCrossed size={26} aria-hidden="true" />
              <h3>Encontre seu favorito</h3>
              <p>Explore as categorias e veja cada sabor de perto.</p>
            </li>
            <li>
              <span className="store-step-number">02</span>
              <SlidersHorizontal size={26} aria-hidden="true" />
              <h3>Deixe do seu jeito</h3>
              <p>Escolha os adicionais e as opções disponíveis no produto.</p>
            </li>
            <li>
              <span className="store-step-number">03</span>
              <ShoppingBag size={26} aria-hidden="true" />
              <h3>Confirme e acompanhe</h3>
              <p>Revise sua sacola e acompanhe pelo link do pedido.</p>
            </li>
          </ol>
        </section>
      </main>
      <footer className="store-footer store-container">
        <LandingBrand />
        <span>Uma loja com o sabor de {company.name}.</span>
        <Link className="text-link" to="/acompanhar">
          Acompanhar pedido <ArrowUpRight size={12} />
        </Link>
        <Link className="text-link" to={storeHref(company.slug, "dashboard")}>
          Painel da loja <ArrowUpRight size={12} />
        </Link>
        <p>
          {mode === "remote"
            ? "Pedidos enviados diretamente ao estabelecimento. Pagamento conferido pela loja."
            : "Demonstração local. Pedidos e acompanhamento funcionam neste navegador e origem."}
        </p>
      </footer>
      {selected && (
        <Modal
          title={selected.name}
          className={selected.pizza || selected.combo ? "pizza-builder-modal" : ""}
          onClose={closeProduct}
        >
          <ProductOptions
            products={tenant.products}
            key={selected.id}
            product={selected}
            initialLine={tenant.cart.lines.find((l) => l.key === editingCartKey)}
            onBack={closeProduct}
            canOrder={canBuild}
            busy={action.busy}
            error={action.error}
            onAdd={(line) =>
              action.run(
                () =>
                  editingCartKey
                    ? services.updateCartLine(company.id, editingCartKey, line)
                    : services.addToCart(company.id, line),
                () => {
                  closeProduct();
                  notify(
                    editingCartKey ? "Item atualizado na sacola." : "Adicionado à sua sacola.",
                  );
                },
              )
            }
          />
        </Modal>
      )}
      {cartOpen && (
        <Modal title="Coisa boa na sua sacola." onClose={() => setCartOpen(false)}>
          <Checkout
            onEditLine={
              services.updateCartLine
                ? (key) => {
                    const line = tenant.cart.lines.find((l) => l.key === key);
                    setEditingCartKey(key);
                    setProductId(line.productId);
                    setCartOpen(false);
                  }
                : undefined
            }
            now={now}
            onQuoteShipping={(cep) => services.quoteShipping(company.id, cep)}
            mode={mode}
            onValidateCoupon={(code, phone) =>
              services.validateCoupon(company.id, tenant.cart, code, phone)
            }
            tenant={tenant}
            availability={availability}
            busy={action.busy}
            error={action.error}
            onQuantity={(key, q) => action.run(() => services.changeCart(company.id, key, q))}
            onSubmit={(input) =>
              action.run(
                () => services.checkout(company.id, tenant.cart.requestId, input),
                (order) => navigate(`/pedido/${order.trackingToken}`),
              )
            }
          />
        </Modal>
      )}
      {!cartOpen && count > 0 && (
        <button
          className="store-floating-cart"
          onClick={() => {
            action.setError("");
            setCartOpen(true);
          }}
          aria-label={`Abrir sacola com ${count} ${count === 1 ? "item" : "itens"}`}
          aria-haspopup="dialog"
        >
          <span className="floating-cart-icon" aria-hidden="true">
            <ShoppingCart size={29} strokeWidth={1.8} />
            <b>{count}</b>
          </span>
        </button>
      )}
      {toast && (
        <div className="toast store-cart-feedback" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
