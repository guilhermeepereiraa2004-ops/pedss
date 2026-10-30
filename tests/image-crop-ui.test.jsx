// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import * as editing from "../src/application/imageEditing";
import { readImageFile, renderImageCrop, loadImageSource } from "../src/adapters/imageEditing.js";
import { DomainError } from "../src/core/errors.ts";
import ImageField from "../src/components/ImageField";
import ProductEditor from "../src/components/ProductEditor";
import SettingsEditor from "../src/components/SettingsEditor";
import { fixture, company, product } from "./fixtures.ts";
const source = { src: "data:image/png;base64,AAAA", width: 1600, height: 900 };
const file = () => new File(["test-image"], "foto.png", { type: "image/png" });
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it.each([
  "Hamburguer",
  "Porção",
  "Bebida",
  "Sobremesa",
  "Pizza",
  "Açaí",
  "Sorvete",
  "Salgado",
  "Pastel",
])(
  "BG-UI-01 %s: upload gera capa e recorte do original, bloqueando gravação até concluir",
  async (category) => {
    vi.spyOn(editing, "prepareImageFile").mockResolvedValue(source);
    vi.spyOn(editing, "applyImageCrop").mockResolvedValue("data:image/webp;base64,CAPA");
    let complete;
    const remove = vi.spyOn(editing, "createProductCutout").mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const save = vi.fn();
    render(
      <ProductEditor
        product={{
          ...product,
          category,
          image: "/capa-antiga.jpg",
          cutoutImage: "/recorte-antigo.png",
        }}
        onSave={save}
        onClose={vi.fn()}
      />,
    );
    await userEvent.upload(
      screen.getByLabelText("Escolher arquivo para Foto do produto"),
      new File(["jpeg"], "foto.jpg", { type: "image/jpeg" }),
    );
    await userEvent.click(await screen.findByRole("button", { name: "Aplicar recorte" }));
    expect(screen.getByRole("button", { name: "Salvar produto" })).toBeDisabled();
    expect(screen.getByLabelText("Escolher arquivo para Foto sem fundo do produto")).toBeDisabled();
    expect(screen.getByAltText("Prévia de Foto do produto")).toHaveAttribute(
      "src",
      "/capa-antiga.jpg",
    );
    expect(remove).toHaveBeenCalledWith(source.src, expect.any(AbortSignal), expect.any(Function));
    complete("data:image/webp;base64,SEM_FUNDO");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Salvar produto" })).toBeEnabled(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Salvar produto" }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        image: "data:image/webp;base64,CAPA",
        cutoutImage: "data:image/webp;base64,SEM_FUNDO",
      }),
    );
  },
);

it("BG-UI-02 falha/cancelamento preserva ambas as fotos e permite nova tentativa", async () => {
  vi.spyOn(editing, "prepareImageFile").mockResolvedValue(source);
  vi.spyOn(editing, "applyImageCrop").mockResolvedValue("data:image/webp;base64,CAPA");
  vi.spyOn(editing, "createProductCutout").mockRejectedValue(
    new DomainError("Modelo indisponível. Tente novamente."),
  );
  const save = vi.fn();
  render(
    <ProductEditor
      product={{ ...product, image: "/capa-antiga.jpg", cutoutImage: "/recorte-antigo.png" }}
      onSave={save}
      onClose={vi.fn()}
    />,
  );
  await userEvent.upload(screen.getByLabelText("Escolher arquivo para Foto do produto"), file());
  await userEvent.click(await screen.findByRole("button", { name: "Aplicar recorte" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Modelo indisponível");
  expect(screen.getByRole("button", { name: "Salvar produto" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Cancelar recorte" }));
  await userEvent.click(screen.getByRole("button", { name: "Salvar produto" }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ image: "/capa-antiga.jpg", cutoutImage: "/recorte-antigo.png" }),
  );
});
it("CUTOUT-01 mantém toda a foto no enquadramento inicial e salva sem substituir a capa", async () => {
  vi.spyOn(editing, "prepareCutoutFile").mockResolvedValue(source);
  const apply = vi
    .spyOn(editing, "applyImageCrop")
    .mockResolvedValue("data:image/webp;base64,RECORTE");
  const f = await fixture();
  const save = vi.fn((value) => f.services.saveProduct(company.id, value));
  render(
    <ProductEditor product={{ ...product, image: "/capa.jpg" }} onSave={save} onClose={vi.fn()} />,
  );
  await userEvent.upload(
    screen.getByLabelText("Escolher arquivo para Foto sem fundo do produto"),
    file(),
  );
  await screen.findByRole("region", { name: "Recortar Foto sem fundo do produto" });
  expect(screen.getByRole("button", { name: "Salvar produto" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Aplicar recorte" }));
  expect(apply).toHaveBeenCalledWith(source.src, { x: 0, y: 0, width: 1600, height: 900 }, 1600);
  await userEvent.click(screen.getByRole("button", { name: "Salvar produto" }));
  await waitFor(() =>
    expect(f.repo.getSnapshot().tenants[company.id].products[0]).toMatchObject({
      image: "/capa.jpg",
      cutoutImage: "data:image/webp;base64,RECORTE",
    }),
  );
});
it("CROP-UI-01 mostra prévia, permite zoom e só altera o campo ao aplicar", async () => {
  vi.spyOn(editing, "prepareImageFile").mockResolvedValue(source);
  const apply = vi
    .spyOn(editing, "applyImageCrop")
    .mockResolvedValue("data:image/webp;base64,RESULTADO");
  const change = vi.fn(),
    status = vi.fn();
  render(
    <ImageField
      label="Foto de teste"
      value="/anterior.png"
      onChange={change}
      onEditingChange={status}
    />,
  );
  await userEvent.upload(screen.getByLabelText("Escolher arquivo para Foto de teste"), file());
  expect(await screen.findByRole("region", { name: "Recortar Foto de teste" })).toBeInTheDocument();
  expect(change).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole("slider", { name: /Zoom/ }), { target: { value: "2" } });
  fireEvent.change(screen.getByRole("slider", { name: "Posição horizontal" }), {
    target: { value: "0" },
  });
  fireEvent.change(screen.getByRole("slider", { name: "Posição vertical" }), {
    target: { value: "100" },
  });
  await userEvent.click(screen.getByRole("button", { name: "Aplicar recorte" }));
  await waitFor(() => expect(change).toHaveBeenCalledWith("data:image/webp;base64,RESULTADO"));
  expect(apply).toHaveBeenCalledWith(source.src, { x: 0, y: 450, width: 600, height: 450 }, 1200);
  expect(status).toHaveBeenLastCalledWith(false);
});
it("CROP-UI-02 cancelar mantém imagem e formulário não salva enquanto o recorte está pendente", async () => {
  vi.spyOn(editing, "prepareImageFile").mockResolvedValue(source);
  const save = vi.fn();
  render(
    <ProductEditor
      product={{ ...product, image: "/anterior.png" }}
      onSave={save}
      onClose={vi.fn()}
      busy={false}
      error=""
    />,
  );
  await userEvent.upload(screen.getByLabelText("Escolher arquivo para Foto do produto"), file());
  await screen.findByRole("region", { name: "Recortar Foto do produto" });
  expect(screen.getByRole("button", { name: "Salvar produto" })).toBeDisabled();
  fireEvent.submit(screen.getByLabelText("Nome do produto").closest("form"));
  expect(save).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Cancelar recorte" }));
  expect(screen.getByAltText("Prévia de Foto do produto")).toHaveAttribute("src", "/anterior.png");
  await userEvent.click(screen.getByRole("button", { name: "Salvar produto" }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ image: "/anterior.png" }));
});
it("CROP-UI-03 erro de recorte preserva original e redefinir restaura o enquadramento", async () => {
  vi.spyOn(editing, "prepareCropSource").mockResolvedValue(source);
  vi.spyOn(editing, "applyImageCrop").mockRejectedValue(
    new DomainError("Não foi possível recortar esse link."),
  );
  const change = vi.fn();
  render(<ImageField label="Foto" value="https://example.com/foto.png" onChange={change} />);
  await userEvent.click(screen.getByRole("button", { name: "Ajustar enquadramento" }));
  fireEvent.change(await screen.findByRole("slider", { name: /Zoom/ }), { target: { value: "2" } });
  await userEvent.click(screen.getByRole("button", { name: "Redefinir" }));
  expect(screen.getByRole("slider", { name: /Zoom/ })).toHaveValue("1");
  await userEvent.click(screen.getByRole("button", { name: "Aplicar recorte" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível recortar");
  expect(change).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Cancelar recorte" }));
  expect(screen.getByAltText("Prévia de Foto")).toHaveAttribute(
    "src",
    "https://example.com/foto.png",
  );
});
it("CROP-UI-04 logo e capa usam formatos próprios e bloqueiam salvar configurações", async () => {
  vi.spyOn(editing, "prepareImageFile").mockResolvedValue(source);
  const apply = vi.spyOn(editing, "applyImageCrop").mockResolvedValue("data:image/webp;base64,OK");
  const f = await fixture();
  const save = vi.fn();
  render(
    <SettingsEditor
      company={company}
      settings={f.repo.getSnapshot().tenants[company.id].settings}
      onSave={save}
      busy={false}
      error=""
    />,
  );
  await userEvent.upload(screen.getByLabelText("Escolher arquivo para Logo da loja"), file());
  await screen.findByRole("region", { name: "Recortar Logo da loja" });
  expect(screen.getByRole("button", { name: "Salvar configuração" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "Aplicar recorte" }));
  expect(apply).toHaveBeenLastCalledWith(
    source.src,
    { x: 350, y: 0, width: 900, height: 900 },
    512,
  );
  await userEvent.upload(screen.getByLabelText("Escolher arquivo para Capa da loja"), file());
  await screen.findByRole("region", { name: "Recortar Capa da loja" });
  await userEvent.click(screen.getByRole("button", { name: "Aplicar recorte" }));
  expect(apply).toHaveBeenLastCalledWith(
    source.src,
    { x: 0, y: 0, width: 1600, height: 900 },
    1600,
  );
  await userEvent.click(screen.getByRole("button", { name: "Salvar configuração" }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ banner: "data:image/webp;base64,OK" }),
    expect.objectContaining({ logo: "data:image/webp;base64,OK" }),
  );
});
it("CROP-02 valida tipo/tamanho, aplica a área do canvas e reduz o arquivo final", async () => {
  expect(() => readImageFile({ type: "image/svg+xml", size: 10 })).toThrow(/PNG/);
  expect(() => readImageFile({ type: "image/png", size: 11 * 1024 * 1024 })).toThrow(/10 MB/);
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = 1600;
      naturalHeight = 900;
      set src(value) {
        if (value) queueMicrotask(() => this.onload?.());
      }
    },
  );
  const draw = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: draw });
  const canvas = vi
    .spyOn(HTMLCanvasElement.prototype, "toBlob")
    .mockImplementationOnce((callback) =>
      callback(new Blob([new Uint8Array(600_000)], { type: "image/webp" })),
    )
    .mockImplementation((callback) =>
      callback(new Blob([new Uint8Array(100)], { type: "image/webp" })),
    );
  const result = await renderImageCrop(
    "/imagem.png",
    { x: 100, y: 50, width: 800, height: 600 },
    1200,
  );
  expect(result).toMatch(/^data:image\/webp;base64,/);
  expect(canvas).toHaveBeenCalledTimes(2);
  expect(draw.mock.calls[0].slice(1)).toEqual([100, 50, 800, 600, 0, 0, 800, 600]);
  expect(draw.mock.calls[1].slice(-2)).toEqual([600, 450]);
});
it("CROP-03 falhas de leitura, dimensão e permissão não geram imagem inválida", async () => {
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = 10000;
      naturalHeight = 10000;
      set src(value) {
        if (value) queueMicrotask(() => this.onload?.());
      }
    },
  );
  await expect(loadImageSource("/enorme.png")).rejects.toThrow(/40 megapixels/);
  vi.stubGlobal(
    "Image",
    class {
      set src(value) {
        if (value) queueMicrotask(() => this.onerror?.());
      }
    },
  );
  await expect(loadImageSource("https://example.com/bloqueada.png")).rejects.toThrow(
    /baixe a imagem/,
  );
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = 100;
      naturalHeight = 100;
      set src(value) {
        if (value) queueMicrotask(() => this.onload?.());
      }
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() });
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(() => {
    throw new DOMException("Tainted canvas", "SecurityError");
  });
  await expect(
    renderImageCrop("/foto.png", { x: 0, y: 0, width: 100, height: 100 }, 512),
  ).rejects.toThrow(/não permite recortar/);
});
