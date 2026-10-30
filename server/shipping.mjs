import { createHmac, timingSafeEqual } from "node:crypto";
import { DomainError } from "../src/core/errors.ts";
import { distanceFee, shippingRuleKey } from "../src/core/shipping.ts";
import { createPostalRouting } from "./routing.mjs";
export function createShippingGateway({
  route = createPostalRouting(),
  secret = () => process.env.PEDSS_QUOTE_SECRET || process.env.DATABASE_URL,
} = {}) {
  const sign = (raw) => {
    if (!secret()) throw new DomainError("Frete por km indisponível.");
    return createHmac("sha256", secret()).update(raw).digest("base64url");
  };
  return {
    async quote(storeId, settings, postalCode) {
      const result = await route(settings.shipping?.originPostalCode, postalCode);
      const value = {
        storeId,
        postalCode,
        distanceMeters: result.distanceMeters,
        feeCents: distanceFee(settings, result.distanceMeters),
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        ruleKey: shippingRuleKey(settings),
        address: result.address,
      };
      const raw = Buffer.from(JSON.stringify(value)).toString("base64url");
      return { ...value, token: raw + "." + sign(raw) };
    },
    verify(token, storeId, settings, postalCode) {
      try {
        const [raw, signature, ...extra] = token.split(".");
        const expected = sign(raw);
        if (
          extra.length ||
          signature?.length !== expected.length ||
          !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
        )
          throw Error();
        const v = JSON.parse(Buffer.from(raw, "base64url").toString());
        if (
          v.storeId !== storeId ||
          v.postalCode !== postalCode ||
          v.ruleKey !== shippingRuleKey(settings) ||
          !(Date.parse(v.expiresAt) > Date.now())
        )
          throw Error();
        return { ...v, token };
      } catch {
        throw new DomainError("Calcule o frete novamente. A cotação expirou ou foi alterada.");
      }
    },
  };
}
