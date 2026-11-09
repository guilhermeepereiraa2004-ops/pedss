import { DomainError } from "../src/core/errors.ts";
// The provider deprecated the old host, with retirement scheduled for November 2026.
const directionsUrl = "https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson";
const unavailable = "O serviço de CEP ou rotas está indisponível. Tente novamente.";

export function createPostalRouting({
  fetcher = fetch,
  key = () => process.env.OPENROUTESERVICE_API_KEY,
} = {}) {
  const cache = new Map(),
    postalCache = new Map(),
    pending = new Map();
  // Bounded per-process caches; no customer data or database writes. In-flight
  // requests also share the lookup instead of spending the shared API quota twice.
  async function cached(map, cacheKey, ttl, operation) {
    const found = map.get(cacheKey);
    if (found?.until > Date.now()) return found.value;
    if (pending.has(cacheKey)) return pending.get(cacheKey);
    const request = (async () => {
      const value = await operation();
      if (map.size >= 500) map.delete(map.keys().next().value);
      map.set(cacheKey, { until: Date.now() + ttl, value });
      return value;
    })();
    pending.set(cacheKey, request);
    try {
      return await request;
    } finally {
      pending.delete(cacheKey);
    }
  }
  async function json(url, options = {}, postal = false) {
    try {
      const r = await fetcher(url, { ...options, signal: AbortSignal.timeout(7000) });
      if (postal && r.status === 404)
        throw new DomainError("CEP não encontrado. Confira os 8 dígitos e tente novamente.");
      if (r.status === 429)
        throw new DomainError(
          "O cálculo de frete está com muitas consultas. Aguarde e tente novamente.",
        );
      if (!postal && (r.status === 401 || r.status === 403))
        throw new DomainError(
          "O cálculo de frete precisa ser verificado pela central. Fale com a loja ou escolha retirada.",
        );
      if (!r.ok) throw new DomainError(unavailable);
      return await r.json();
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new DomainError(unavailable);
    }
  }
  async function locate(cep) {
    return cached(postalCache, `cep:${cep}`, 24 * 60 * 60_000, async () => {
      const v = await json(`https://brasilapi.com.br/api/cep/v2/${cep}`, {}, true);
      const c = v?.location?.coordinates;
      const lat = Number(c?.latitude),
        lon = Number(c?.longitude);
      if (
        !c?.latitude ||
        !c?.longitude ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -34 ||
        lat > 6 ||
        lon < -74 ||
        lon > -34
      )
        throw new DomainError(
          "Este CEP não possui localização suficiente para calcular a rota. Confirme outro CEP com a loja.",
        );
      return {
        point: [lon, lat],
        address: {
          street: v.street || "",
          neighborhood: v.neighborhood || "",
          city: v.city || "",
          state: v.state || "",
        },
      };
    });
  }
  return async function route(origin, destination) {
    if (!/^\d{8}$/.test(origin || "") || !/^\d{8}$/.test(destination || ""))
      throw new DomainError("Informe CEPs com 8 dígitos.");
    const apiKey = key()?.trim();
    if (!apiKey)
      throw new DomainError(
        "O frete por quilômetro está indisponível no momento. Fale com a loja ou escolha retirada.",
      );
    return cached(cache, `route:${origin}:${destination}`, 15 * 60_000, async () => {
      const [a, b] = await Promise.all([locate(origin), locate(destination)]);
      const r = await json(directionsUrl, {
        method: "POST",
        headers: { Authorization: apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: [a.point, b.point], instructions: false }),
      });
      const meters = r?.features?.[0]?.properties?.summary?.distance;
      if (typeof meters !== "number" || !Number.isFinite(meters) || meters < 0)
        throw new DomainError("Não encontramos um percurso pelas ruas entre estes CEPs.");
      return { distanceMeters: Math.ceil(meters), address: b.address };
    });
  };
}
