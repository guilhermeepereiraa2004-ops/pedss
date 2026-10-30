// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { webcrypto } from "node:crypto";
import ProductOptions from "../src/components/ProductOptions";
import ProductEditor from "../src/components/ProductEditor";
import { pizzaProduct } from "./pizza-fixture.ts";
import { fireEvent } from "@testing-library/react";
import PizzaPreview from "../src/components/PizzaPreview";
import { pizzaIllustration } from "../src/lib/pizzaPhotography";
vi.stubGlobal("crypto", webcrypto);
afterEach(cleanup);
it("PIZZA-UI-03 prévia divide três sabores, exige completar e mantém retorno ao cardápio", async () => {
  const add = vi.fn(),
    back = vi.fn();
  const { container } = render(<ProductOptions product={pizzaProduct} onAdd={add} onBack={back} />);
  await userEvent.click(screen.getByRole("radio", { name: /Grande/ }));
  await userEvent.click(screen.getByRole("radio", { name: "3 sabores", exact: true }));
  expect(container.querySelectorAll("[data-pizza-sector]")).toHaveLength(3);
  await userEvent.click(screen.getByRole("checkbox", { name: /Mussarela/ }));
  await userEvent.click(screen.getByRole("checkbox", { name: /Calabresa/ }));
  expect(screen.getByRole("button", { name: /Adicionar/ })).toBeDisabled();
  await userEvent.click(screen.getByRole("checkbox", { name: /Frango/ }));
  expect(screen.getByRole("img", { name: /Pizza Grande/ })).toHaveAccessibleName(
    /1\/3: Mussarela; 1\/3: Calabresa; 1\/3: Frango/,
  );
  expect(screen.getByRole("checkbox", { name: /Bacon/ })).toBeDisabled();
  expect(container.querySelectorAll(".pizza-live-preview image")).toHaveLength(3);
  expect(
    new Set(
      [...container.querySelectorAll(".pizza-live-preview image")].map((image) =>
        image.getAttribute("href"),
      ),
    ).size,
  ).toBe(3);
  expect(container.querySelector(".pizza-live-preview ellipse")).toBeNull();
  expect(screen.getByRole("button", { name: /Adicionar/ })).toBeEnabled();
  await userEvent.click(screen.getByRole("radio", { name: "2 sabores", exact: true }));
  expect(container.querySelectorAll("[data-pizza-sector]")).toHaveLength(2);
  expect(screen.getByRole("checkbox", { name: /Frango/ })).not.toBeChecked();
  await userEvent.click(screen.getByRole("button", { name: /Voltar ao cardápio/ }));
  expect(back).toHaveBeenCalledOnce();
});
it("PIZZA-UI-04 foto por sabor usa recorte e volta à ilustração se falhar", () => {
  const config = structuredClone(pizzaProduct.pizza);
  config.flavors[0].previewImage = "https://example.com/top.jpg";
  const { container } = render(
    <PizzaPreview
      config={config}
      value={{
        sizeId: "medium",
        flavorIds: ["cheese"],
        flavorCount: 1,
        doughId: "classic",
        edgeId: "plain",
      }}
    />,
  );
  const photo = container.querySelector("image");
  expect(photo).toHaveAttribute("href", "https://example.com/top.jpg");
  fireEvent.error(photo);
  expect(container.querySelector("image")).toHaveAttribute(
    "href",
    pizzaIllustration({ name: "Mussarela" }),
  );
  fireEvent.error(container.querySelector("image"));
  expect(container.querySelector("image")).toBeNull();
  expect(screen.getByRole("img")).toHaveAccessibleName(/Mussarela/);
});
it("PIZZA-UI-01 cliente monta pizza com preço e reinicia sabores ao trocar tamanho", async () => {
  const add = vi.fn();
  render(<ProductOptions product={pizzaProduct} onAdd={add} />);
  expect(screen.getByRole("button", { name: /Adicionar/ })).toBeDisabled();
  await userEvent.click(screen.getByRole("radio", { name: "2 sabores", exact: true }));
  await userEvent.click(screen.getByRole("checkbox", { name: /Mussarela/ }));
  await userEvent.click(screen.getByRole("checkbox", { name: /Calabresa/ }));
  await userEvent.click(screen.getByRole("radio", { name: /Fina/ }));
  await userEvent.click(screen.getByRole("radio", { name: /Requeijão/ }));
  expect(screen.getByRole("button", { name: /Adicionar/ })).toHaveTextContent(/50,01/);
  await userEvent.click(screen.getByRole("button", { name: /Adicionar/ }));
  expect(add).toHaveBeenCalledWith(
    expect.objectContaining({
      pizza: {
        sizeId: "medium",
        flavorIds: ["cheese", "pepper"],
        flavorCount: 2,
        doughId: "thin",
        edgeId: "cream",
      },
    }),
  );
  await userEvent.click(screen.getByRole("radio", { name: /Grande/ }));
  expect(screen.getByRole("checkbox", { name: /Mussarela/ })).not.toBeChecked();
  expect(screen.getByRole("button", { name: /Adicionar/ })).toBeDisabled();
});
it("PIZZA-UI-02 admin configura e salva regras de pizza pelo editor", async () => {
  const save = vi.fn();
  render(
    <ProductEditor
      product={{ ...pizzaProduct, pizza: undefined }}
      onSave={save}
      onClose={() => {}}
    />,
  );
  await userEvent.click(screen.getByRole("checkbox", { name: /Ativar montador/ }));
  await userEvent.click(screen.getByRole("radio", { name: /^Média dos sabores/ }));
  await userEvent.click(screen.getByRole("button", { name: "Adicionar massa" }));
  expect(screen.getAllByRole("textbox", { name: "Nome da massa" })).toHaveLength(2);
  await userEvent.click(screen.getByRole("button", { name: /Salvar/ }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      pizza: expect.objectContaining({ pricing: "average", doughs: expect.any(Array) }),
    }),
  );
});
