import { ArrowDown, ArrowLeft } from "lucide-react";
import { money } from "../lib/data";
import { pizzaFormatLabel } from "../application/productSelections";
import { pizzaIllustration } from "../lib/pizzaPhotography";
import "./PizzaFormatMenu.css";

export default function PizzaFormatMenu({ groups, canOrder, onChoose, headingRef }) {
  const SizeHeading = groups.length > 1 ? "h4" : "h3";
  return (
    <section className="pizza-formats" id="tamanhos-pizza" aria-labelledby="pizza-formats-title">
      <header className="pizza-formats-heading">
        <div>
          <span className="eyebrow">ETAPA 1 DE 2</span>
          <h2 id="pizza-formats-title" ref={headingRef} tabIndex={-1}>
            Qual vai ser o tamanho?
          </h2>
          <p>Escolha o tamanho e a divisão para ver os sabores disponíveis.</p>
        </div>
      </header>
      {!canOrder && (
        <p className="small-copy muted">
          Você pode ver os sabores. A loja está fechada para pedidos.
        </p>
      )}
      {groups.map(({ product, sizes }) => {
        const allHaveDiameter = sizes.every(({ size }) => size.diameterCm);
        const scale = (size) => (allHaveDiameter ? size.diameterCm : size.slices);
        const largest = Math.max(...sizes.map(({ size }) => scale(size)));
        return (
          <div className="pizza-format-group" key={product.id}>
            {groups.length > 1 && <h3>{product.name}</h3>}
            <div className="pizza-format-grid">
              {sizes.map(({ size, formats }) => {
                const minimum = Math.min(...formats.map(({ priceCents }) => priceCents));
                const photoSize = 76 + 24 * (scale(size) / largest);
                return (
                  <article className="pizza-format-card" key={size.id}>
                    <div className="pizza-format-card-intro">
                      <div className="pizza-format-card-info">
                        <SizeHeading className="pizza-format-size">{size.name}</SizeHeading>
                        <span className="pizza-format-slices">
                          {size.slices} fatias{size.diameterCm ? ` · ${size.diameterCm} cm` : ""}
                        </span>
                        <p className="pizza-format-price">
                          <span>A partir de</span> <strong>{money(minimum / 100)}</strong>
                        </p>
                      </div>
                      <div className="pizza-format-photo">
                        <img
                          src={pizzaIllustration()}
                          alt={`Foto ilustrativa de uma pizza tamanho ${size.name}`}
                          width={768}
                          height={768}
                          style={{ width: `${photoSize}%` }}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                    <div className="pizza-format-actions">
                      {formats.map(({ count }) => (
                        <button
                          type="button"
                          key={count}
                          aria-label={`${pizzaFormatLabel(count)} — ${size.name}`}
                          onClick={() => onChoose(product, size, count, minimum)}
                        >
                          <strong>{pizzaFormatLabel(count)}</strong>
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export function PizzaFormatCatalog({ format, headingRef, onBack, hasCatalog, children }) {
  return (
    <section className="pizza-format-catalog" id="cardapio" aria-labelledby="pizza-flavors-title">
      <header className="pizza-formats-heading">
        <div>
          <button className="pizza-format-back" type="button" onClick={onBack}>
            <ArrowLeft size={17} aria-hidden="true" /> Voltar aos tamanhos
          </button>
          <span className="eyebrow">ETAPA 2 DE 2</span>
          <h2 id="pizza-flavors-title" ref={headingRef} tabIndex={-1}>
            Cardápio de sabores
          </h2>
          <p>
            {format.sizeName} · {pizzaFormatLabel(format.count)}
          </p>
        </div>
        {hasCatalog && (
          <a href="#cardapio-completo">
            Ver cardápio completo <ArrowDown size={16} aria-hidden="true" />
          </a>
        )}
      </header>
      {children}
    </section>
  );
}
