// @vitest-environment jsdom
import React from "react";
import { pizzaIllustration } from "../src/lib/pizzaPhotography";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { webcrypto } from "node:crypto";
import StoreHero from "../src/components/StoreHero";
import ProductCutout from "../src/components/ProductCutout";
import ProductVisual from "../src/components/ProductVisual";
import { loadModelViewer } from "../src/application/productModels";
import SettingsEditor from "../src/components/SettingsEditor";
import ApplicationProvider from "../src/components/ApplicationProvider";
import Storefront from "../src/pages/Storefront";
import DigitalMenu from "../src/pages/DigitalMenu";
import { company, fixture, product } from "./fixtures.ts";
import { defaultsSettings } from "../src/core/domain.ts";
import { settingsSchema } from "../src/core/model.ts";
import { storefrontTemplates } from "../src/lib/storefrontTemplates";
import { burgerPhoto, foodPhotos } from "../src/lib/data";
import { hasProductMotion } from "../src/lib/productPhotography";
import { storeImage, HERO_IMAGE_SIZES } from "../src/lib/storeImages";
vi.stubGlobal("crypto", webcrypto);
vi.mock("../src/application/productModels", () => ({ loadModelViewer: vi.fn(async () => {}) }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("HERO-01 hero ilustrativa independe de fotos e usa o menor preço disponível", () => {
  const products = [
    product,
    { ...product, id: "drink", category: "Bebida", priceCents: 500 },
    { ...product, id: "hidden", status: "Indisponível", priceCents: 100 },
    { ...product, id: "second", priceCents: 3290 },
  ];
  const view = render(<StoreHero products={products} description="Descrição da loja" />);
  expect(screen.getByRole("heading", { name: "Deu fome?" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /animação da imagem/ })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Hambúrgueres a partir de R$ 29,90")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Escolher meu burger" })).toHaveAttribute(
    "href",
    "#cardapio",
  );
  view.rerender(<StoreHero products={products.filter((p) => p.category === "Bebida")} />);
  expect(screen.queryByText("A PARTIR DE")).not.toBeInTheDocument();
});

it("HERO-02 configuração preserva capa legada e aplica fundo e cor na loja pelo caso de uso autorizado", async () => {
  const f = await fixture();
  const previous = { ...defaultsSettings(true), banner: "https://example.com/cover.png" };
  const saved = vi.fn(async (settings, branding) =>
    f.services.configureStore(company.id, settings, branding),
  );
  const editor = render(<SettingsEditor company={company} settings={previous} onSave={saved} />);
  await userEvent.selectOptions(screen.getByLabelText("Segmento da loja"), "pizza");
  expect(
    screen.getByRole("img", { name: "Prévia ilustrativa do modelo de pizzaria" }),
  ).toHaveAttribute("src", "/images/hero-pizza-v3.png");
  await userEvent.clear(screen.getByLabelText("Cor em hexadecimal"));
  await userEvent.type(screen.getByLabelText("Cor em hexadecimal"), "#ff6825");
  await userEvent.click(screen.getByRole("radio", { name: "Cor da marca (suave)" }));
  await userEvent.click(screen.getByRole("button", { name: "Salvar configuração" }));
  await waitFor(() =>
    expect(f.repo.getSnapshot().tenants[company.id].settings.heroBackground).toBe("brand"),
  );
  expect(f.repo.getSnapshot().tenants[company.id].settings.banner).toBe(previous.banner);
  editor.unmount();
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter>
        <Storefront manualStoreId="demo" />
      </MemoryRouter>
    </ApplicationProvider>,
  );
  const heading = await screen.findByRole("heading", {
    name: storefrontTemplates.pizza.title.join(" "),
  });
  expect(f.repo.getSnapshot().tenants[company.id].settings.heroSegment).toBe("pizza");
  expect(screen.getByRole("link", { name: "Escolher minha pizza" })).toBeInTheDocument();
  expect(screen.getByText(storefrontTemplates.pizza.description)).toBeInTheDocument();
  expect(heading.closest(".store-page")).toHaveAttribute("data-hero-background", "brand");
  expect(heading.closest(".store-page").style.getPropertyValue("--store-accent")).toBe("#ff6825");
});

it("HERO-03 lojas anteriores recebem fundo branco e valores fora do modelo são rejeitados", () => {
  const legacy = defaultsSettings();
  delete legacy.heroBackground;
  delete legacy.heroSegment;
  expect(settingsSchema.parse(legacy).heroBackground).toBe("white");
  expect(settingsSchema.parse(legacy).heroSegment).toBe("burger");
  expect(settingsSchema.safeParse({ ...legacy, heroBackground: "invalid" }).success).toBe(false);
  expect(settingsSchema.safeParse({ ...legacy, heroSegment: "invalid" }).success).toBe(false);
});

it.each(Object.entries(storefrontTemplates))(
  "HERO-04 %s exibe imagem/texto próprios e preço apenas da categoria correspondente",
  (segment, template) => {
    const products = [
      { ...product, category: template.category, priceCents: 2000 },
      { ...product, id: "second", category: template.category, priceCents: 2500 },
      {
        ...product,
        id: "hidden",
        category: template.category,
        priceCents: 100,
        status: "Indisponível",
      },
      { ...product, id: "drink", category: "Bebida", priceCents: 200 },
    ];
    const view = render(<StoreHero segment={segment} products={products} />);
    expect(screen.getByRole("heading", { name: template.title.join(" ") })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: template.alt })).toHaveAttribute(
      "src",
      storeImage(template.image).src,
    );
    expect(screen.getByRole("img", { name: template.alt })).toHaveAttribute(
      "srcset",
      storeImage(template.image).srcSet,
    );
    expect(screen.getByRole("img", { name: template.alt })).toHaveAttribute(
      "sizes",
      HERO_IMAGE_SIZES,
    );
    expect(screen.getByRole("img", { name: template.alt })).toHaveAttribute("loading", "eager");
    expect(screen.getByRole("img", { name: template.alt })).toHaveAttribute(
      "fetchpriority",
      "high",
    );
    expect(screen.getByRole("img", { name: template.alt }).closest(".burger-hero")).toHaveAttribute(
      "data-motion",
      "on",
    );
    expect(screen.queryByRole("button", { name: /animação da imagem/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: template.cta })).toHaveAttribute("href", "#cardapio");
    expect(screen.getByLabelText(`${template.plural} a partir de R$ 20,00`)).toBeInTheDocument();
    view.rerender(<StoreHero segment={segment} products={[{ ...product, category: "Bebida" }]} />);
    expect(screen.queryByText("A PARTIR DE")).not.toBeInTheDocument();
  },
);

it("BURGER-01 erro de recorte não volta à foto com fundo e nova foto recupera a exibição", () => {
  const burger = { ...product, image: "/original.jpg", cutoutImage: "/sem-fundo.png" };
  const view = render(<ProductCutout product={burger} motion />);
  expect(screen.getByRole("img")).toHaveAttribute("src", "/sem-fundo.png");
  expect(screen.getByRole("img").closest(".product-artwork")).toHaveAttribute(
    "data-cutout",
    "true",
  );
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Foto sem fundo de Nome oficial em preparação",
  );
  view.rerender(<ProductCutout product={{ ...burger, cutoutImage: "/nova.png" }} />);
  expect(screen.getByRole("img")).toHaveAttribute("src", "/nova.png");
});

it("BURGER-02 foto original desconhecida não é confundida com recorte e hero continua independente", () => {
  render(
    <>
      <StoreHero products={[product]} />
      <ProductCutout product={{ ...product, image: "/original.jpg" }} />
    </>,
  );
  expect(screen.getByRole("img", { name: storefrontTemplates.burger.alt })).toHaveAttribute(
    "src",
    storeImage(storefrontTemplates.burger.image).src,
  );
  expect(screen.queryByRole("img", { name: "Foto de Nome oficial" })).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Foto sem fundo de Nome oficial em preparação",
  );
  expect(screen.queryByRole("group", { name: "Escolha seu hambúrguer" })).not.toBeInTheDocument();
});

it("BURGER-03 foto do cardápio abre o produto correto sem trocar a hero e calcula a sacola", async () => {
  const f = await fixture();
  await f.services.saveProduct(company.id, {
    ...product,
    id: "second",
    name: "Bacon da casa",
    cutoutImage: "/bacon.png",
    priceCents: 3890,
  });
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter>
        <Storefront manualStoreId="demo" />
      </MemoryRouter>
    </ApplicationProvider>,
  );
  const choose = await screen.findByRole("button", { name: "Ver Bacon da casa" });
  const hero = screen.getByRole("img", { name: storefrontTemplates.burger.alt });
  const heroSrc = hero.getAttribute("src");
  const card = choose.closest("article");
  expect(within(card).getByRole("img", { name: "Foto de Bacon da casa" })).toHaveAttribute(
    "src",
    "/bacon.png",
  );
  await userEvent.click(choose);
  expect(hero).toHaveAttribute("src", heroSrc);
  const modal = screen.getByRole("dialog");
  expect(within(modal).getByRole("img", { name: "Foto de Bacon da casa" })).toHaveAttribute(
    "src",
    "/bacon.png",
  );
  await userEvent.click(within(modal).getByRole("checkbox", { name: /Queijo/ }));
  await userEvent.click(within(modal).getByRole("button", { name: /Adicionar.*42,90/ }));
  await waitFor(() =>
    expect(f.repo.getSnapshot().tenants[company.id].cart.lines[0]).toMatchObject({
      productId: "second",
      extraIds: ["cheese"],
      quantity: 1,
    }),
  );
});

it.each([
  [undefined, "demo"],
  ["local", "demo"],
  ["remote", "demo"],
  ["local", "burger-da-praca"],
  ["remote", "burger-da-praca"],
  ["local", "loja-de-porcoes", "Porção"],
  ["remote", "loja-de-bebidas", "Bebida"],
  ["local", "loja-de-doces", "Sobremesa"],
])(
  "BURGER-04 %s/%s: movimento permanente na lista e detalhes, sem controle de pausa",
  async (mode, slug, category = "Hamburguer") => {
    const previous = window.matchMedia;
    window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
    try {
      const alpha = new Uint8ClampedArray(64 * 64 * 4).fill(255);
      for (let i = 3; i < alpha.length / 2; i += 4) alpha[i] = 0;
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
        drawImage() {},
        getImageData: () => ({ data: alpha }),
      });
      const f = await fixture();
      await f.repo.transact((state) => {
        state.companies.find((item) => item.id === company.id).slug = slug;
      });
      await f.services.saveProduct(company.id, {
        ...product,
        cutoutImage: "/burger.png",
        category,
      });
      await f.services.setOnline(company.id, false);
      render(
        <ApplicationProvider runtime={{ ...f, repository: f.repo, mode }}>
          <MemoryRouter>
            <Storefront manualStoreId={slug} />
          </MemoryRouter>
        </ApplicationProvider>,
      );
      const photo = await screen.findByRole("img", { name: "Foto de Nome oficial" });
      fireEvent.load(photo);
      expect(photo.closest(".product-artwork")).toHaveAttribute("data-motion", "on");
      const hero = screen.getByRole("img", { name: storefrontTemplates.burger.alt });
      const heroSrc = hero.getAttribute("src");
      expect(photo.closest(".product-artwork")).toHaveAttribute("data-motion", "on");
      expect(hero).toHaveAttribute("src", heroSrc);
      expect(hero.closest(".burger-hero")).toHaveAttribute("data-motion", "on");
      expect(screen.queryByRole("button", { name: /animação da imagem/ })).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Pausar movimento|Animar fotos/i }),
      ).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Ver Nome oficial" }));
      const modal = screen.getByRole("dialog");
      const detailPhoto = within(modal).getByRole("img", { name: "Foto de Nome oficial" });
      fireEvent.load(detailPhoto);
      expect(detailPhoto.closest(".product-artwork")).toHaveAttribute("data-motion", "on");
      expect(
        within(modal).getByRole("button", { name: "Loja fechada para pedidos" }),
      ).toBeDisabled();
      expect(
        screen.queryByRole("button", { name: /Pausar movimento|Animar fotos/i }),
      ).not.toBeInTheDocument();
      expect(photo.closest(".product-artwork")).toHaveAttribute("data-motion", "on");
      expect(detailPhoto.closest(".product-artwork")).toHaveAttribute("data-motion", "on");
      expect(hero.closest(".burger-hero")).toHaveAttribute("data-motion", "on");
    } finally {
      window.matchMedia = previous;
    }
  },
);

it("BURGER-05 catálogo legado sem cutout usa recortes da mesma foto, sem depender do navegador", () => {
  const view = render(
    <ProductCutout product={{ ...product, image: burgerPhoto, cutoutImage: "" }} />,
  );
  expect(screen.getByRole("img")).toHaveAttribute(
    "src",
    storeImage("/images/menu-brasa-only.webp").src,
  );
  view.rerender(
    <ProductCutout product={{ ...product, image: foodPhotos.Hamburguer, cutoutImage: "" }} />,
  );
  expect(screen.getByRole("img")).toHaveAttribute("src", "/images/menu-house-burger.webp");
  for (const [category, asset] of [
    ["Porção", "fries"],
    ["Bebida", "drink"],
    ["Sobremesa", "dessert"],
  ]) {
    view.rerender(
      <ProductCutout
        product={{ ...product, category, image: foodPhotos[category], cutoutImage: "" }}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      storeImage(`/images/menu-${asset}-cutout.webp`).src,
    );
    view.rerender(
      <ProductCutout
        product={{ ...product, category, image: "/foto-propria.jpg", cutoutImage: "" }}
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  }
  view.rerender(
    <ProductCutout
      product={{ ...product, image: burgerPhoto, cutoutImage: "/images/menu-brasa-original.webp" }}
    />,
  );
  expect(screen.getByRole("img")).toHaveAttribute(
    "src",
    storeImage("/images/menu-brasa-only.webp").src,
  );
});

it("BURGER-06 arquivo opaco no campo sem fundo não aparece no cardápio", () => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage() {},
    getImageData() {
      return { data: new Uint8ClampedArray(64 * 64 * 4).fill(255) };
    },
  });
  render(
    <ProductCutout product={{ ...product, image: "/original.jpg", cutoutImage: "/opaca.jpg" }} />,
  );
  const photo = screen.getByRole("img");
  expect(photo).toHaveAttribute("data-verified", "false");
  fireEvent.load(photo);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Foto sem fundo");
});

it("BURGER-07 recorte com alpha só aparece e se movimenta depois da verificação", () => {
  const data = new Uint8ClampedArray(64 * 64 * 4).fill(255);
  for (let i = 3; i < data.length / 2; i += 4) data[i] = 0;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage() {},
    getImageData() {
      return { data };
    },
  });
  render(<ProductCutout product={{ ...product, cutoutImage: "/burger-alpha.webp" }} motion />);
  const photo = screen.getByRole("img");
  expect(photo.closest(".product-artwork")).toHaveAttribute("data-motion", "off");
  fireEvent.load(photo);
  expect(photo).toHaveAttribute("data-verified", "true");
  expect(photo.closest(".product-artwork")).toHaveAttribute("data-motion", "on");
});

it("PHOTO-SYNC-01 fotos verificadas em momentos diferentes e retomadas usam a mesma fase", () => {
  const data = new Uint8ClampedArray(64 * 64 * 4).fill(255);
  for (let i = 3; i < data.length / 2; i += 4) data[i] = 0;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage() {},
    getImageData: () => ({ data }),
  });
  const items = [
    { ...product, id: "first", cutoutImage: "/first.webp" },
    { ...product, id: "later", cutoutImage: "/later.webp" },
  ];
  const photos = (motion) =>
    items.map((item) => <ProductCutout key={item.id} product={item} motion={motion} />);
  const view = render(<>{photos(true)}</>);
  const images = screen.getAllByRole("img");
  const animations = images.map((img, index) => {
    const running = [{ startTime: 1000 + index * 2000 }, { startTime: 1500 + index * 2000 }];
    const getAnimations = vi.fn(() => running);
    Object.defineProperty(img.closest(".product-artwork"), "getAnimations", {
      value: getAnimations,
    });
    return { running, getAnimations };
  });
  fireEvent.load(images[0]);
  expect(animations[0].running.map((animation) => animation.startTime)).toEqual([0, 0]);
  expect(animations[1].getAnimations).not.toHaveBeenCalled();
  fireEvent.load(images[1]);
  for (const { running, getAnimations } of animations) {
    expect(getAnimations).toHaveBeenCalledWith({ subtree: true });
    expect(running.map((animation) => animation.startTime)).toEqual([0, 0]);
    running.forEach((animation) => {
      animation.startTime = 9999;
    });
  }
  view.rerender(<>{photos(false)}</>);
  expect(images.every((img) => img.closest(".product-artwork").dataset.motion === "off")).toBe(
    true,
  );
  view.rerender(<>{photos(true)}</>);
  for (const { running } of animations) {
    expect(running.map((animation) => animation.startTime)).toEqual([0, 0]);
  }
});

it("MODEL-01 fotos sem modelo usam o componente de foto sem carregar renderizador 3D", () => {
  vi.mocked(loadModelViewer).mockClear();
  const view = render(
    <ProductVisual product={{ ...product, cutoutImage: "/produto.webp" }} motion />,
  );
  expect(view.container.querySelector("model-viewer")).toBeNull();
  expect(loadModelViewer).not.toHaveBeenCalled();
  expect(screen.getByRole("img").closest(".product-artwork")).toHaveAttribute("data-motion", "off");
});

it.each([
  ["Hamburguer", "/images/menu-house-burger.webp"],
  ["Porção", "/images/menu-fries-cutout.webp"],
  ["Bebida", "/images/menu-drink-cutout.webp"],
  ["Sobremesa", "/images/menu-dessert-cutout.webp"],
  ["Pizza", pizzaIllustration({})],
  ["Açaí", "/images/hero-acai.png"],
  ["Sorvete", "/images/hero-icecream.png"],
  ["Salgado", "/images/hero-snacks.png"],
  ["Pastel", "/images/hero-pastel.png"],
])(
  "PHOTO-01 %s sem foto recebe ilustração identificada sem alterar o cadastro",
  (category, src) => {
    const item = Object.freeze({ ...product, category, image: "", cutoutImage: "" });
    render(<ProductCutout product={item} motion />);
    expect(
      screen.getByRole("img", { name: `Imagem ilustrativa da categoria ${category}` }),
    ).toHaveAttribute("src", storeImage(src).src);
    expect(screen.queryByText("Imagem ilustrativa")).not.toBeInTheDocument();
    expect(hasProductMotion(item)).toBe(true);
    expect(item.image).toBe("");
    expect(item.cutoutImage).toBe("");
  },
);

it("PHOTO-02 foto própria substitui ilustração e nunca é mascarada por foto genérica", () => {
  const missing = { ...product, image: "", cutoutImage: "" };
  const view = render(<ProductCutout product={missing} />);
  expect(screen.queryByText("Imagem ilustrativa")).not.toBeInTheDocument();
  view.rerender(
    <ProductCutout
      product={{ ...missing, image: "/original.jpg", cutoutImage: "/propria.webp" }}
    />,
  );
  expect(screen.getByRole("img", { name: `Foto de ${product.name}` })).toHaveAttribute(
    "src",
    "/propria.webp",
  );
  expect(screen.queryByText("Imagem ilustrativa")).not.toBeInTheDocument();
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.queryByText("Imagem ilustrativa")).not.toBeInTheDocument();
});

it.each([
  ["delivery", Storefront],
  ["QR", DigitalMenu],
])(
  "PHOTO-LOAD-01 %s antecipa a primeira linha e preserva carregamento sob demanda no restante",
  async (_, Page) => {
    const f = await fixture();
    for (let index = 0; index < 3; index++) {
      await f.services.saveProduct(company.id, {
        ...product,
        id: `photo-${index}`,
        name: `Produto ${index}`,
        cutoutImage: `/own-${index}.webp`,
      });
    }
    const view = render(
      <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
        <MemoryRouter initialEntries={["/store/demo"]}>
          <Routes>
            <Route path="/store/:storeId" element={<Page />} />
          </Routes>
        </MemoryRouter>
      </ApplicationProvider>,
    );
    await screen.findByRole("heading", { name: "Nome oficial" });
    const images = [...view.container.querySelectorAll(".product-cutout")];
    expect(images.map((image) => image.getAttribute("loading"))).toEqual([
      "eager",
      "eager",
      "lazy",
      "lazy",
    ]);
    expect(images.at(-1)).toHaveAttribute("src", "/own-2.webp");
    expect(images.at(-1)).not.toHaveAttribute("srcset");
  },
);
it("MODEL-02 modelo GLB real aceita rotação e controles e erro retorna ao recorte", () => {
  const item = { ...product, model3dUrl: "/produto.glb", cutoutImage: "/recorte.webp" };
  const view = render(<ProductVisual product={item} motion interactive />);
  const viewer = view.container.querySelector("model-viewer");
  expect(viewer).toHaveAttribute("src", "/produto.glb");
  expect(viewer).toHaveAttribute("auto-rotate");
  expect(viewer).toHaveAttribute("camera-controls");
  fireEvent(viewer, new Event("load"));
  expect(view.container.querySelector(".product-model")).toHaveAttribute("data-status", "ready");
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  view.rerender(<ProductVisual product={item} interactive motion={false} />);
  expect(viewer).not.toHaveAttribute("auto-rotate");
  fireEvent(viewer, new Event("error"));
  expect(screen.getByRole("img")).toHaveAttribute("src", "/recorte.webp");
});
