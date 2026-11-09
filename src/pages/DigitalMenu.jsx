import { useState } from "react";
import { comboStartingPrice } from "../core/restaurant.ts";
import ComboMenuCard, { ComboArtwork, ComboContents } from "../components/ComboPresentation";
import { Link, useParams } from "react-router-dom";
import {
  Search,
  Flame,
  UtensilsCrossed,
  MapPin,
  Clock3,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import LandingBrand from "../components/LandingBrand";
import StoreLogo from "../components/StoreLogo";
import ProductVisual from "../components/ProductVisual";
import { storeColors } from "../lib/storeColors";
import Modal from "../components/Modal";
import { useStore } from "../hooks/useApplication";
import { categories, money } from "../lib/data";
import { matchesMenuSearch } from "../lib/menu";
import { storeHref } from "../application/storeAddress";
import { isIllustrativeProductPhoto } from "../lib/productPhotography";
import { pizzaPricingLabels, pizzaFlavorAvailable, pizzaFlavorCounts } from "../core/pizza.ts";
import { pizzaFormatLabel } from "../application/productSelections";
import "./DigitalMenu.css";
const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export default function DigitalMenu({ manualStoreId }) {
  const { storeId } = useParams(),
    { company, tenant } = useStore(manualStoreId || storeId);
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("Todos"),
    [selectedId, setSelectedId] = useState(null);
  if (!company || !tenant)
    return (
      <main className="store-not-found">
        <LandingBrand />
        <Flame size={45} />
        <h1>Cardápio não encontrado.</h1>
        <p>Confira o QR code ou procure a equipe do estabelecimento.</p>
      </main>
    );
  const products = tenant.products.filter(
      (p) =>
        p.status === "Disponível" && (!p.combo || comboStartingPrice(p, tenant.products) !== null),
    ),
    filtered = products.filter(
      (p) => (category === "Todos" || p.category === category) && matchesMenuSearch(p, search),
    ),
    selected = products.find((p) => p.id === selectedId);
  const colors = storeColors(company.primaryColor);
  return (
    <div
      className="digital-menu-page"
      style={{
        "--store-accent": colors.accent,
        "--store-on-accent": colors.onAccent,
        "--store-accent-ink": colors.headline,
        "--store-accent-text": colors.text,
      }}
    >
      <div className="digital-topline">
        <span>
          <UtensilsCrossed size={12} />
          Cardápio presencial
        </span>
        <LandingBrand />
      </div>
      <header className="digital-header">
        <Link to={storeHref(company.slug, "menu")} className="digital-brand">
          <StoreLogo company={company} />
          <div>
            <strong>{company.name}</strong>
            <small>{tenant.settings.description || "Conheça os sabores da casa."}</small>
          </div>
        </Link>
        <span className="digital-service-note">
          <UtensilsCrossed size={16} /> Pedidos com a equipe
        </span>
      </header>
      <main className="digital-container">
        <section id="sabores" className="digital-catalog">
          <div className="digital-section-head">
            <div>
              <h1>
                O cardápio <em>da casa.</em>
              </h1>
              <p>Veja os sabores. Para pedir, fale com a nossa equipe.</p>
            </div>
            <label className="search-field">
              <Search size={17} />
              <input
                type="search"
                aria-label="Buscar no cardápio presencial"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busque seu favorito"
              />
            </label>
          </div>
          <nav className="digital-categories" aria-label="Categorias do cardápio presencial">
            {categories
              .filter(([value]) => value === "Todos" || products.some((p) => p.category === value))
              .map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={category === value}
                  onClick={() => setCategory(value)}
                >
                  {value === "Todos" && <UtensilsCrossed size={14} />} {label}
                  <span>
                    {products.filter((p) => value === "Todos" || p.category === value).length}
                  </span>
                </button>
              ))}
          </nav>
          <p className="digital-results" role="status">
            {filtered.length} {filtered.length === 1 ? "opção disponível" : "opções disponíveis"}
          </p>
          <div className="digital-products">
            {filtered.map((p, index) =>
              p.combo ? (
                <ComboMenuCard
                  key={p.id}
                  product={p}
                  products={tenant.products}
                  priority={index < 2}
                  readOnly
                  onOpen={() => setSelectedId(p.id)}
                />
              ) : (
                <article key={p.id} className="digital-product" data-category={p.category}>
                  <button
                    type="button"
                    aria-label={`Ver detalhes de ${p.name}`}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <div className="digital-product-photo">
                      <span className="digital-product-category">
                        {categories.find(([v]) => v === p.category)?.[1]}
                      </span>
                      <ProductVisual
                        product={p}
                        motion
                        priority={index < 2}
                        sizes="(max-width: 700px) 100vw, (max-width: 1296px) 50vw, 600px"
                      />
                      {p.featured && (
                        <span className="digital-featured">
                          <Flame size={12} />
                          Da casa
                        </span>
                      )}
                    </div>
                    <div className="digital-product-info">
                      <h3>{p.name}</h3>
                      <p>{p.description}</p>
                      <footer>
                        <strong>
                          {p.pizza && <small>A partir de </small>}
                          {money(comboStartingPrice(p, tenant.products) / 100)}
                        </strong>
                        <span className="digital-detail-icon">
                          Ver detalhes{" "}
                          <span>
                            <ArrowUpRight size={19} />
                          </span>
                        </span>
                      </footer>
                    </div>
                  </button>
                </article>
              ),
            )}
          </div>
          {!filtered.length && (
            <div className="empty-state">
              <Search size={30} />
              <h3>
                {products.length ? "Não encontramos esse sabor." : "Estamos preparando o cardápio."}
              </h3>
              <p>
                {products.length
                  ? "Experimente outra busca ou categoria."
                  : "Fale com a equipe para conhecer as opções da casa."}
              </p>
              {products.length > 0 && (
                <button
                  className="button button-outline button-small"
                  onClick={() => {
                    setSearch("");
                    setCategory("Todos");
                  }}
                >
                  Ver todas as opções
                </button>
              )}
            </div>
          )}
        </section>
        <section className="digital-visit">
          <details>
            <summary>
              Informações da casa <ChevronDown size={16} />
            </summary>
            {tenant.settings.address && (
              <p>
                <MapPin size={14} />
                {tenant.settings.address}
              </p>
            )}
            {tenant.settings.scheduleEnabled && (
              <div className="digital-hours">
                <h3>
                  <Clock3 size={14} />
                  Horários de atendimento
                </h3>
                {tenant.settings.hours.map((h) => (
                  <p key={h.day}>
                    <span>{days[h.day]}</span>
                    <strong>
                      {h.enabled
                        ? `${h.open}–${h.close}${h.close < h.open ? " (+1 dia)" : ""}`
                        : "Fechado"}
                    </strong>
                  </p>
                ))}
              </div>
            )}
            <p>Precisa de alguma adaptação no preparo? Consulte nossa equipe antes de pedir.</p>
          </details>
        </section>
      </main>
      <footer className="digital-footer">
        <LandingBrand />
        <span>O sabor de {company.name}. A comodidade de escolher.</span>
        <small>Cardápio para consulta. Faça seu pedido com a equipe da loja.</small>
      </footer>
      {selected && (
        <Modal title={selected.name} onClose={() => setSelectedId(null)}>
          <div className="digital-product-detail">
            {selected.combo ? (
              <>
                <ComboArtwork product={selected} products={tenant.products} priority />
                <ComboContents product={selected} products={tenant.products} />
              </>
            ) : (
              <>
                <ProductVisual product={selected} motion interactive priority />
                <small className="muted product-photo-note">
                  {!selected.model3dUrl && isIllustrativeProductPhoto(selected)
                    ? "Imagem ilustrativa da categoria. A aparência do produto pode variar."
                    : "Foto do produto base. Adicionais e retiradas não alteram a foto."}
                </small>
              </>
            )}
            <strong>
              {(selected.pizza || selected.combo) && "A partir de "}
              {money(comboStartingPrice(selected, tenant.products) / 100)}
            </strong>
            <p>{selected.description}</p>
            {selected.ingredients.length > 0 && (
              <p>Ingredientes: {selected.ingredients.join(", ")}</p>
            )}
            {selected.allergens?.length > 0 && (
              <p className="notice">
                Contém: {selected.allergens.join(", ")}. Consulte a equipe sobre contaminação
                cruzada.
              </p>
            )}
            {selected.pizza && (
              <section>
                <h3>Monte com a equipe</h3>
                <p>
                  {pizzaPricingLabels[selected.pizza.pricing]}.{" "}
                  {selected.pizza.allowUnequalParts
                    ? "Permite metades e quartos, somando uma pizza inteira."
                    : "Sabores divididos em partes iguais."}
                </p>
                {selected.pizza.sizes
                  .filter((s) => s.available)
                  .map((size) => {
                    const counts = pizzaFlavorCounts(size);
                    const countPrices = Object.entries(
                      size.flavorCountPricing?.prices || {},
                    ).filter(([count]) => counts.includes(Number(count)));
                    return (
                      <section key={size.id}>
                        <h4>
                          {size.name}
                          {size.diameterCm ? ` · ${size.diameterCm} cm` : ""} · {size.slices} fatias
                          ·{" "}
                          {size.allowedFlavorCounts
                            ? counts.map(pizzaFormatLabel).join(" / ")
                            : `até ${size.maxFlavors} sabores`}
                        </h4>
                        {selected.pizza.pricing === "fixed" && (
                          <div>
                            <span>Preço fixo da pizza inteira</span>
                            <strong>{money(size.fixedPriceCents / 100)}</strong>
                          </div>
                        )}
                        {countPrices.length > 0 && (
                          <div className="notice">
                            {countPrices.map(([count, price]) => (
                              <div key={count}>
                                <span>
                                  {pizzaFormatLabel(Number(count))} ·{" "}
                                  {size.flavorCountPricing.mode === "fixed"
                                    ? "Preço fixo da pizza"
                                    : "Acréscimo à regra dos sabores"}
                                </span>
                                <strong>
                                  {size.flavorCountPricing.mode === "extra" ? "+ " : ""}
                                  {money(price / 100)}
                                </strong>
                              </div>
                            ))}
                            <small>
                              Massa, borda e adicionais à parte. Combinações sem valor específico
                              seguem a regra dos sabores.
                            </small>
                          </div>
                        )}
                        {selected.pizza.flavors
                          .filter((f) => pizzaFlavorAvailable(selected.pizza, f, size.id))
                          .map((f) => (
                            <div key={f.id}>
                              <span>{f.name}</span>
                              <strong>
                                {selected.pizza.pricing === "fixed"
                                  ? "Incluído"
                                  : money(f.prices[size.id] / 100)}
                              </strong>
                            </div>
                          ))}
                      </section>
                    );
                  })}
                {[
                  ["doughs", "Massas"],
                  ["edges", "Bordas"],
                ].map(([key, title]) => (
                  <section key={key}>
                    <h4>{title}</h4>
                    {selected.pizza[key]
                      .filter((v) => v.available)
                      .map((v) => (
                        <div key={v.id}>
                          <span>{v.name}</span>
                          <strong>
                            {v.priceCents ? `+ ${money(v.priceCents / 100)}` : "Inclusa"}
                          </strong>
                        </div>
                      ))}
                  </section>
                ))}
              </section>
            )}
            {selected.extras.some((e) => e.available) && (
              <section>
                <h3>Adicionais disponíveis</h3>
                {selected.extras
                  .filter((e) => e.available)
                  .map((e) => (
                    <div key={e.id}>
                      <span>{e.name}</span>
                      <strong>+ {money(e.priceCents / 100)}</strong>
                    </div>
                  ))}
              </section>
            )}
            {selected.ingredients.length > 0 && (
              <section>
                <h3>Pode ser preparado sem</h3>
                <p>{selected.ingredients.join(", ")}.</p>
              </section>
            )}
            <p className="notice">
              Para pedir ou informar uma preferência, fale com a equipe da loja.
            </p>
            <button className="button button-dark button-full" onClick={() => setSelectedId(null)}>
              Continuar escolhendo
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
