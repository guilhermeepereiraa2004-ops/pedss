import { useState } from "react";
import { couponIsCurrent } from "../core/coupons.ts";
import { useAction } from "../hooks/useApplication";
import { money } from "../lib/data";
import "./Business.css";
export default function CouponOffers({ tenant, now }) {
  const offers = tenant.coupons.filter(
      (c) => c.advertised && couponIsCurrent(c, tenant.orders, now),
    ),
    action = useAction(),
    [message, setMessage] = useState("");
  if (!offers.length) return null;
  return (
    <section aria-label="Cupons disponíveis">
      <div className="coupon-offers">
        {offers.map((c) => (
          <article className="coupon-offer" key={c.id}>
            <strong>
              {c.kind === "percent" ? `${c.value}%` : money(c.value / 100)} de desconto na sua
              sacola
            </strong>
            <button
              className="text-link"
              onClick={() =>
                action.run(
                  () => navigator.clipboard.writeText(c.code),
                  () => setMessage(`Código ${c.code} copiado. Aplique na sacola.`),
                )
              }
            >
              Copiar {c.code}
            </button>
            <small>
              {c.description} Mínimo {money(c.minSubtotalCents / 100)} em produtos. Válido até{" "}
              {c.validUntil.split("-").reverse().join("/")}.
              {c.perCustomerLimit ? ` Até ${c.perCustomerLimit} uso(s) por telefone.` : ""}
            </small>
          </article>
        ))}
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {action.error && (
        <p role="alert" className="form-error">
          {action.error}
        </p>
      )}
    </section>
  );
}
