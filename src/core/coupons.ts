import type { Coupon, Order, Tenant } from "./model.ts";
import { DomainError } from "./errors.ts";
import { localDay } from "./calendar.ts";
export const couponUses = (couponId: string, orders: Order[]) =>
  orders.filter((o) => o.coupon?.id === couponId && o.status !== "Cancelado");
export function couponIsCurrent(coupon: Coupon, orders: Order[], now = new Date()) {
  const day = localDay(now);
  return (
    coupon.active &&
    coupon.validFrom <= day &&
    coupon.validUntil >= day &&
    (coupon.usageLimit === null || couponUses(coupon.id, orders).length < coupon.usageLimit)
  );
}
export function applyCoupon(
  tenant: Pick<Tenant, "coupons" | "orders">,
  code: string,
  subtotalCents: number,
  phone: string,
  now = new Date(),
) {
  if (!code.trim()) return null;
  const coupon = tenant.coupons.find((c) => c.code === code.trim().toUpperCase());
  if (!coupon || !couponIsCurrent(coupon, tenant.orders, now))
    throw new DomainError("Cupom inválido, inativo, expirado ou esgotado.");
  if (subtotalCents < coupon.minSubtotalCents)
    throw new DomainError(
      `Este cupom exige pelo menos R$ ${(coupon.minSubtotalCents / 100).toFixed(2).replace(".", ",")} em produtos.`,
    );
  const normalized = phone.replace(/\D/g, "");
  if (
    coupon.perCustomerLimit !== null &&
    normalized &&
    couponUses(coupon.id, tenant.orders).filter((o) => o.customer.phone === normalized).length >=
      coupon.perCustomerLimit
  )
    throw new DomainError("Você já atingiu o limite de uso deste cupom.");
  const discountCents = Math.min(
    subtotalCents,
    coupon.kind === "percent" ? Math.round((subtotalCents * coupon.value) / 100) : coupon.value,
  );
  return {
    id: coupon.id,
    code: coupon.code,
    kind: coupon.kind,
    value: coupon.value,
    discountCents,
    minSubtotalCents: coupon.minSubtotalCents,
  };
}
