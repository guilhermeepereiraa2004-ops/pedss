// @vitest-environment jsdom
import { it, expect, vi } from "vitest";
import fs from "node:fs";
import { reloadNewVersion } from "../src/adapters/pageRecovery.js";
import { storage } from "./fixtures.ts";

const html = (file) =>
  `<!doctype html><html><head><script type="module" src="${file}"></script></head><body></body></html>`;
function setup(next = "/assets/index-new.js") {
  return {
    page: new DOMParser().parseFromString(html("/assets/index-old.js"), "text/html"),
    location: new URL("https://www.pedss.com.br/dashboard?store=cia-da-pizza"),
    storage: storage(),
    fetcher: vi.fn(async () => ({
      ok: true,
      headers: new Headers({ "content-type": "text/html" }),
      text: async () => html(next),
    })),
    reload: vi.fn(),
  };
}

it("VERSION-01 confirma uma versão nova antes de atualizar e bloqueia loop sem tocar nas sacolas", async () => {
  const config = setup();
  config.storage.setItem("pedss.carts.v1", "sacola preservada");
  expect(await reloadNewVersion(config)).toBe(true);
  expect(config.reload).toHaveBeenCalledTimes(1);
  expect(config.storage.getItem("pedss.carts.v1")).toBe("sacola preservada");
  expect(config.fetcher).toHaveBeenCalledWith("/", expect.objectContaining({ cache: "no-store" }));
  expect(await reloadNewVersion(config)).toBe(false);
  expect(config.reload).toHaveBeenCalledTimes(1);
});

it.each(["same", "offline", "external", "storage", "json"])(
  "VERSION-02 %s não causa atualização automática sem uma versão válida confirmada",
  async (caseName) => {
    const config = setup(
      caseName === "same"
        ? "/assets/index-old.js"
        : caseName === "external"
          ? "https://another.example/assets/new.js"
          : undefined,
    );
    if (caseName === "offline") config.fetcher.mockRejectedValue(new TypeError("Failed to fetch"));
    if (caseName === "storage")
      config.storage.setItem = () => {
        throw new Error("blocked");
      };
    if (caseName === "json")
      config.fetcher.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
      });
    expect(await reloadNewVersion(config)).toBe(false);
    expect(config.reload).not.toHaveBeenCalled();
  },
);

it("VERSION-03 arquivos JS ausentes não são reescritos para HTML; rotas da aplicação continuam atendidas", () => {
  const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
  const rewrite = new RegExp(`^${config.rewrites[0].source}$`);
  for (const path of ["/assets/old-route.js", "/assets/old-style.css", "/api/app", "/api/updates"])
    expect(rewrite.test(path)).toBe(false);
  for (const path of ["/", "/store/cia-da-pizza", "/dashboard", "/pedido/opaque"])
    expect(rewrite.test(path)).toBe(true);
});
