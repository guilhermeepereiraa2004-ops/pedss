import { DomainError } from "../core/errors.ts";
import {
  distanceFee,
  shippingRuleKey,
  type ShippingGateway,
  type ShippingQuote,
} from "../core/shipping.ts";
export function createLocalShippingGateway(fetcher: typeof fetch = fetch): ShippingGateway {
  const quotes = new Map<string, ShippingQuote>();
  return {
    async quote(storeId, settings, postalCode) {
      if (!/^\d{8}$/.test(postalCode)) throw new DomainError("Informe o CEP com 8 dígitos.");
      const r = await fetcher("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: settings.shipping?.originPostalCode,
          destination: postalCode,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new DomainError(data.error || "Não foi possível calcular o percurso.");
      const token = `${storeId}:${crypto.randomUUID()}`;
      const quote = {
        token,
        postalCode,
        distanceMeters: data.distanceMeters,
        feeCents: distanceFee(settings, data.distanceMeters),
        address: data.address,
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        ruleKey: shippingRuleKey(settings),
      };
      if (quotes.size > 500) quotes.clear();
      quotes.set(token, quote);
      return quote;
    },
    verify(token, storeId) {
      const quote = quotes.get(token);
      if (!quote || !token.startsWith(storeId + ":"))
        throw new DomainError("Calcule o frete novamente.");
      return quote;
    },
  };
}
