import { DomainError } from "../core/errors.ts";

// Retry only reads. A failed POST may already have committed on the server.
export async function remoteRead(fetcher, url, options, { timeout = 12000, delay = 750 } = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetcher(url, { ...options, signal: controller.signal });
      if (attempt === 0 && [408, 502, 503, 504].includes(response.status)) {
        await response.body?.cancel();
      } else return response;
    } catch (error) {
      if (!(error instanceof TypeError) && error.name !== "AbortError") throw error;
      if (attempt === 1)
        throw new DomainError(
          "Não foi possível conectar ao servidor. Tente novamente em instantes.",
        );
    } finally {
      clearTimeout(timer);
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
