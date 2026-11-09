import { useId, useState } from "react";
import { pizzaFlavorSources } from "../lib/pizzaPhotography";

function wedge(index, count, weights, radius = 151) {
  if (count === 1)
    return `M 160 ${160 - radius} A ${radius} ${radius} 0 1 1 160 ${160 + radius} A ${radius} ${radius} 0 1 1 160 ${160 - radius}`;
  const total = weights.reduce((s, n) => s + n, 0) || count;
  const start =
      -Math.PI / 2 + (weights.slice(0, index).reduce((s, n) => s + n, 0) * 2 * Math.PI) / total,
    end = start + (2 * Math.PI * weights[index]) / total;
  return `M160 160 L${160 + radius * Math.cos(start)} ${160 + radius * Math.sin(start)} A${radius} ${radius} 0 ${end - start > Math.PI ? 1 : 0} 1 ${160 + radius * Math.cos(end)} ${160 + radius * Math.sin(end)} Z`;
}
function FlavorSurface({ flavor }) {
  const sources = pizzaFlavorSources(flavor);
  const [failed, setFailed] = useState(0);
  return sources[failed] ? (
    <image
      href={sources[failed]}
      x="0"
      y="0"
      width="320"
      height="320"
      preserveAspectRatio="xMidYMid slice"
      onError={() => setFailed((index) => index + 1)}
    />
  ) : (
    <circle cx="160" cy="160" r="151" fill="#eee4cf" />
  );
}
export default function PizzaPreview({ config, value, compact = false, doughBase = false }) {
  const uid = `pizza${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const size = config.sizes.find((s) => s.id === value.sizeId);
  const count = value.flavorCount || Math.max(1, value.flavorIds.length);
  const weights =
    value.portions?.length === count
      ? value.portions.map((v) => Math.max(1, v || 1))
      : Array(count).fill(1);
  const totalParts = weights.reduce((s, n) => s + n, 0);
  const flavors = value.flavorIds.map((id) => config.flavors.find((f) => f.id === id));
  const edge = config.edges.find((e) => e.id === value.edgeId),
    dough = config.doughs.find((e) => e.id === value.doughId);
  const description = Array.from(
    { length: count },
    (_, i) =>
      `${count > 1 ? `${weights[i]}/${totalParts}` : "Inteira"}: ${flavors[i]?.name || (doughBase ? "só massa" : "escolha um sabor")}`,
  ).join("; ");
  return (
    <section className="pizza-live-preview" aria-label="Prévia da sua pizza">
      {!compact && (
        <div className="pizza-preview-heading">
          <span>SUA PIZZA, DO SEU JEITO</span>
          <strong>
            {size?.name} {size?.diameterCm && <small>{size.diameterCm} cm</small>}
          </strong>
        </div>
      )}
      <svg
        viewBox="0 0 320 320"
        role="img"
        aria-label={`Pizza ${size?.name || ""}: ${description}`}
      >
        <defs>
          {doughBase && (
            <>
              <radialGradient id={`${uid}rim`} cx="43%" cy="35%" r="62%">
                <stop offset="72%" stopColor="#f7dfac" />
                <stop offset="88%" stopColor="#e9bf7d" />
                <stop offset="97%" stopColor="#d6a46c" />
                <stop offset="100%" stopColor="#b97d4d" />
              </radialGradient>
              <radialGradient id={`${uid}dough`} cx="40%" cy="36%" r="63%">
                <stop stopColor="#fff0cc" />
                <stop offset="79%" stopColor="#f8dfb0" />
                <stop offset="100%" stopColor="#f2d49f" />
              </radialGradient>
              <pattern id={`${uid}pores`} width="39" height="31" patternUnits="userSpaceOnUse">
                <circle cx="7" cy="11" r="1.1" fill="#b9854d" opacity=".19" />
                <circle cx="29" cy="20" r=".8" fill="#a36e40" opacity=".2" />
                <path
                  d="M17 5q2-2 4 0M14 26q3-2 5 0"
                  fill="none"
                  stroke="#fff8df"
                  strokeWidth="1.3"
                />
              </pattern>
            </>
          )}
          <pattern id={`${uid}empty`} width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="#f3e9d7" />
            <path d="M0 12 12 0" stroke="#e5d6bd" strokeWidth="1" />
          </pattern>
          {Array.from({ length: count }, (_, i) => (
            <clipPath id={`${uid}slice${i}`} key={i}>
              <path d={wedge(i, count, weights)} />
            </clipPath>
          ))}
        </defs>
        {doughBase && (
          <g aria-hidden="true">
            <circle cx="160" cy="160" r="151" fill={`url(#${uid}rim)`} />
            <circle cx="160" cy="160" r="135" fill={`url(#${uid}dough)`} />
            <circle cx="160" cy="160" r="143" fill={`url(#${uid}pores)`} />
          </g>
        )}
        {Array.from({ length: count }, (_, i) => {
          const flavor = flavors[i],
            a =
              -Math.PI / 2 +
              ((weights.slice(0, i).reduce((s, n) => s + n, 0) + weights[i] / 2) * 2 * Math.PI) /
                totalParts;
          return (
            <g
              key={`${i}-${flavor?.id || "empty"}`}
              data-pizza-sector={i + 1}
              data-flavor={flavor?.name || ""}
              className="pizza-preview-sector"
            >
              <g clipPath={`url(#${uid}slice${i})`}>
                {!doughBase && <circle cx="160" cy="160" r="151" fill={`url(#${uid}empty)`} />}
                {flavor && (
                  <FlavorSurface
                    key={`${flavor.id}-${flavor.previewImage || ""}`}
                    flavor={flavor}
                  />
                )}
              </g>
              {count > 1 && (
                <path d={wedge(i, count, weights)} fill="none" stroke="#fffaf0" strokeWidth="1.5" />
              )}
              {!doughBase && (
                <>
                  <circle
                    cx={160 + (count === 1 ? 0 : 83) * Math.cos(a)}
                    cy={160 + (count === 1 ? 0 : 83) * Math.sin(a)}
                    r="12"
                    fill={flavor ? "#fffdf5" : "#eee4cf"}
                    stroke="#e1d0ae"
                  />
                  <text
                    x={160 + (count === 1 ? 0 : 83) * Math.cos(a)}
                    y={164 + (count === 1 ? 0 : 83) * Math.sin(a)}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="750"
                    fill="#433527"
                  >
                    {flavor ? i + 1 : "?"}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      {!compact && (
        <>
          <ol className="pizza-preview-legend">
            {Array.from({ length: count }, (_, i) => (
              <li key={i}>
                <b>{i + 1}</b>
                <span>{flavors[i]?.name || (doughBase ? "Só massa" : "Escolha um sabor")}</span>
                <small>{count === 1 ? "Inteira" : `${weights[i]}/${totalParts}`}</small>
              </li>
            ))}
          </ol>
          <div className="pizza-preview-details">
            <span>
              Massa <strong>{dough?.name}</strong>
            </span>
            <span>
              Borda <strong>{edge?.name}</strong>
            </span>
          </div>
          <small className="pizza-preview-caption">
            Composição ilustrativa. A aparência do produto pode variar.
          </small>
        </>
      )}
    </section>
  );
}
