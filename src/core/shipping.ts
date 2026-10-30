import { DomainError } from "./errors.ts";
import type { Settings } from "./model.ts";
export type ShippingQuote = {
  token: string;
  postalCode: string;
  feeCents: number;
  distanceMeters: number;
  expiresAt: string;
  ruleKey: string;
  address: { street: string; neighborhood: string; city: string; state: string };
};
export type ShippingGateway = {
  quote(storeId: string, settings: Settings, postalCode: string): Promise<ShippingQuote>;
  verify(token: string, storeId: string, settings: Settings, postalCode: string): ShippingQuote;
};
export const shippingMode = (settings: Settings) => settings.shipping?.mode || "areas";
export const deliveryConfigured = (settings: Settings) =>
  settings.deliveryEnabled && (shippingMode(settings) !== "areas" || settings.areas.length > 0);
export const shippingRuleKey = (settings: Settings) => JSON.stringify(settings.shipping || null);
export function distanceFee(settings: Settings, meters: number) {
  const rule = settings.shipping;
  if (!rule || rule.mode !== "distance" || !Number.isFinite(meters) || meters < 0)
    throw new DomainError("Não foi possível calcular a distância.");
  if (meters > rule.maxDistanceKm * 1000)
    throw new DomainError("Este CEP está fora do limite de entrega da loja.");
  // Round only the final charge to cents, never multiply a rounded display distance.
  const fee = Math.max(
    rule.minimumFeeCents,
    rule.baseFeeCents + Math.round((meters * rule.perKmCents) / 1000),
  );
  if (!Number.isSafeInteger(fee) || fee > 100_000_000)
    throw new DomainError("Revise os valores do frete.");
  return fee;
}
export function deliveryFee(
  settings: Settings,
  areaId: string,
  postalCode = "",
  quote?: ShippingQuote,
  now = new Date(),
) {
  const mode = shippingMode(settings);
  if (mode === "fixed") return settings.shipping!.fixedFeeCents;
  if (mode === "areas") {
    const area = settings.areas.find((a) => a.id === areaId);
    if (!area) throw new DomainError("Selecione uma área atendida.");
    return area.feeCents;
  }
  if (
    !quote ||
    quote.postalCode !== postalCode ||
    quote.ruleKey !== shippingRuleKey(settings) ||
    !(Date.parse(quote.expiresAt) > now.getTime())
  )
    throw new DomainError("Calcule o frete novamente para este CEP.");
  const fee = distanceFee(settings, quote.distanceMeters);
  if (fee !== quote.feeCents) throw new DomainError("O valor do frete mudou. Calcule novamente.");
  return fee;
}
