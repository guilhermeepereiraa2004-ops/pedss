// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ProductCutout from "../src/components/ProductCutout";
import { isBundledPizzaPhoto, pizzaIllustration } from "../src/lib/pizzaPhotography";
import photos from "../src/lib/pizzaPhotos.json";
import { product } from "./fixtures.ts";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function alphaCanvas() {
  const pixels = new Uint8ClampedArray(64 * 64 * 4).fill(255);
  for (let i = 3; i < pixels.length / 2; i += 4) pixels[i] = 0;
  return vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage() {},
    getImageData: () => ({ data: pixels }),
  });
}
it("PHOTO-LOAD-01 recorte já carregado no cache aparece mesmo sem receber load", async () => {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(768);
  alphaCanvas();
  render(<ProductCutout product={{ ...product, cutoutImage: "/own-alpha.webp" }} motion />);
  await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("data-verified", "true"));
  expect(screen.getByRole("img").closest(".product-artwork")).toHaveAttribute("data-motion", "on");
  expect(screen.queryByText("Carregando foto…")).not.toBeInTheDocument();
});
it("PHOTO-LOAD-02 restauração da página recupera uma foto concluída sem load", async () => {
  let complete = false;
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockImplementation(() => complete);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(768);
  alphaCanvas();
  render(<ProductCutout product={{ ...product, cutoutImage: "/restore-alpha.webp" }} />);
  expect(screen.getByRole("img")).toHaveAttribute("data-verified", "false");
  complete = true;
  fireEvent(window, new Event("pageshow"));
  await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("data-verified", "true"));
});
it("PHOTO-LOAD-03 todas as ilustrações versionadas de pizza ficam visíveis após carregar sem depender de canvas", async () => {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(768);
  const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  render(
    <>
      {Object.values(photos).map((photo, i) => (
        <ProductCutout
          key={photo.src}
          product={{ ...product, id: `pizza-${i}`, category: "Pizza", cutoutImage: photo.src }}
          motion
        />
      ))}
    </>,
  );
  await waitFor(() => {
    for (const image of screen.getAllByRole("img")) {
      expect(image).toHaveAttribute("data-verified", "true");
      expect(image.closest(".product-artwork")).toHaveAttribute("data-motion", "on");
    }
  });
  expect(canvas).not.toHaveBeenCalled();
  const path = pizzaIllustration({ name: "Pepperoni" });
  expect(isBundledPizzaPhoto(path)).toBe(true);
  expect(isBundledPizzaPhoto(`https://example.com${path}`)).toBe(false);
  expect(isBundledPizzaPhoto("/images/pizzas/own-photo.webp")).toBe(false);
});
it("PHOTO-LOAD-04 erro em cache não deixa círculo vazio e troca de foto recupera o produto", async () => {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(0);
  const view = render(<ProductCutout product={{ ...product, cutoutImage: "/broken.webp" }} />);
  await waitFor(() => expect(screen.queryByRole("img")).not.toBeInTheDocument());
  expect(screen.getByRole("status")).toHaveTextContent("Foto sem fundo");
  vi.restoreAllMocks();
  view.rerender(<ProductCutout product={{ ...product, cutoutImage: "/new.webp" }} />);
  expect(screen.getByRole("img")).toHaveAttribute("src", "/new.webp");
});
it("PHOTO-LOAD-05 foto própria opaca em cache continua recusada sem expor o fundo", async () => {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(768);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage() {},
    getImageData: () => ({ data: new Uint8ClampedArray(64 * 64 * 4).fill(255) }),
  });
  render(<ProductCutout product={{ ...product, cutoutImage: "/opaque.webp" }} />);
  await waitFor(() => expect(screen.queryByRole("img")).not.toBeInTheDocument());
  expect(screen.getByRole("status")).toHaveTextContent("Foto sem fundo");
});

it("PHOTO-LOAD-06 foto versionada só anima depois da decodificação, sem confundir arquivo confiável com imagem carregada", async () => {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(768);
  let finish;
  const decode = vi.fn(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  Object.defineProperty(HTMLImageElement.prototype, "decode", {
    configurable: true,
    value: decode,
  });
  try {
    render(
      <ProductCutout
        product={{ ...product, category: "Pizza", cutoutImage: photos.vegetariana.src }}
        motion
      />,
    );
    const image = screen.getByRole("img");
    await waitFor(() => expect(decode).toHaveBeenCalledOnce());
    expect(image).toHaveAttribute("data-verified", "false");
    expect(image.closest(".product-artwork")).toHaveAttribute("data-motion", "off");
    expect(image.closest(".product-artwork")).toHaveAttribute("aria-busy", "true");
    await act(async () => finish());
    await waitFor(() => expect(image).toHaveAttribute("data-verified", "true"));
    expect(image.closest(".product-artwork")).toHaveAttribute("data-motion", "on");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  } finally {
    delete HTMLImageElement.prototype.decode;
  }
});

it("PHOTO-LOAD-07 rolagem recupera foto lazy concluída sem load e antecipa o carregamento próximo do card", async () => {
  let complete = false,
    intersect;
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockImplementation(() => complete);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(768);
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback) {
        intersect = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  render(
    <ProductCutout
      product={{ ...product, category: "Pizza", cutoutImage: photos.vegetariana.src }}
      motion
    />,
  );
  const image = screen.getByRole("img");
  expect(image.closest(".product-artwork")).toHaveAttribute("data-motion", "off");
  complete = true;
  await act(async () => intersect([{ isIntersecting: true }]));
  await waitFor(() => expect(image).toHaveAttribute("data-verified", "true"));
  expect(image.loading).toBe("eager");
  expect(disconnect).toHaveBeenCalled();
});

it("PHOTO-LOAD-08 decodificação antiga não libera uma nova foto e falha não deixa círculo vazio", async () => {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(768);
  const pending = [];
  Object.defineProperty(HTMLImageElement.prototype, "decode", {
    configurable: true,
    value: vi.fn(() => new Promise((resolve, reject) => pending.push({ resolve, reject }))),
  });
  try {
    const view = render(
      <ProductCutout product={{ ...product, cutoutImage: photos.vegetariana.src }} motion />,
    );
    await waitFor(() => expect(pending).toHaveLength(1));
    view.rerender(<ProductCutout product={{ ...product, cutoutImage: photos.atum.src }} motion />);
    await waitFor(() => expect(pending).toHaveLength(2));
    await act(async () => pending[0].resolve());
    expect(screen.getByRole("img")).toHaveAttribute("data-verified", "false");
    await act(async () => pending[1].reject(new Error("decode failed")));
    await waitFor(() => expect(screen.queryByRole("img")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Foto sem fundo");
  } finally {
    delete HTMLImageElement.prototype.decode;
  }
});
