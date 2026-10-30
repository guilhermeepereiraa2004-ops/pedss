import { DomainError } from "../src/core/errors.ts";
export function createPostalRouting({
  fetcher = fetch,
  key = () => process.env.OPENROUTESERVICE_API_KEY,
} = {}) {
  const cache = new Map();
  async function json(url, options = {}) {
    const r = await fetcher(url, { ...options, signal: AbortSignal.timeout(7000) });
    if (!r.ok)
      throw new DomainError("O serviço de CEP ou rotas está indisponível. Tente novamente.");
    return r.json();
  }
  async function locate(cep) {
    const v = await json(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    const c = v.location?.coordinates;
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
  }
  return async function route(origin, destination) {
    if (!/^\d{8}$/.test(origin || "") || !/^\d{8}$/.test(destination || ""))
      throw new DomainError("Informe CEPs com 8 dígitos.");
    if (!key())
      throw new DomainError(
        "O frete por quilômetro está indisponível no momento. Fale com a loja ou escolha retirada.",
      );
    const cacheKey = `${origin}:${destination}`,
      found = cache.get(cacheKey);
    if (found?.until > Date.now()) return found.value;
    const [a, b] = await Promise.all([locate(origin), locate(destination)]);
    const r = await json("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: { Authorization: key(), "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: [a.point, b.point], instructions: false }),
    });
    const meters = r.features?.[0]?.properties?.summary?.distance;
    if (typeof meters !== "number" || !Number.isFinite(meters) || meters < 0)
      throw new DomainError("Não encontramos um percurso pelas ruas entre estes CEPs.");
    const value = { distanceMeters: Math.ceil(meters), address: b.address };
    if (cache.size >= 500) cache.clear();
    cache.set(cacheKey, { until: Date.now() + 15 * 60_000, value });
    return value;
  };
}
