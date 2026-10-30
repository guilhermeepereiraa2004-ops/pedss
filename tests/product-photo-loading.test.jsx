// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ProductCutout from "../src/components/ProductCutout";
import { isBundledPizzaPhoto, pizzaIllustration } from "../src/lib/pizzaPhotography";
import photos from "../src/lib/pizzaPhotos.json";
import { product } from "./fixtures.ts";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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
it("PHOTO-LOAD-03 todas as ilustrações versionadas de pizza ficam visíveis sem depender de canvas", () => {
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
  for (const image of screen.getAllByRole("img")) {
    expect(image).toHaveAttribute("data-verified", "true");
    expect(image.closest(".product-artwork")).toHaveAttribute("data-motion", "on");
  }
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
