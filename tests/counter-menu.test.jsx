// @vitest-environment jsdom
import React from "react";
import { it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import ApplicationProvider from "../src/components/ApplicationProvider";
import Dashboard from "../src/pages/Dashboard";
import { fixture, company, product } from "./fixtures.ts";
import { pizzaProduct } from "./pizza-fixture.ts";

afterEach(cleanup);

async function setup() {
  const f = await fixture();
  await f.services.saveProduct(company.id, {
    ...pizzaProduct,
    pizza: { ...pizzaProduct.pizza, menuPlacement: "builder" },
    extras: product.extras,
  });
  await f.services.saveProduct(company.id, {
    ...product,
    id: "drink",
    name: "Suco de uva",
    description: "Bebida integral",
    category: "Bebida",
    priceCents: 500,
    extras: [],
    ingredients: [],
  });
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter initialEntries={["/dashboard?store=demo&tab=counter"]}>
        <Dashboard />
      </MemoryRouter>
    </ApplicationProvider>,
  );
  await screen.findByRole("button", { name: "Monte sua pizza", exact: true });
  return f;
}

it.each(["counter", "phone"])(
  "COUNTER-MENU-01 %s monta, edita e registra pizza completa com bebida, sem alterar a sacola pública",
  async (channel) => {
    const f = await setup(),
      user = userEvent.setup();
    await user.selectOptions(screen.getByRole("combobox", { name: "Origem do pedido" }), channel);
    await user.click(screen.getByRole("button", { name: "Monte sua pizza", exact: true }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByRole("region", { name: "Prévia da sua pizza" })).toBeInTheDocument();
    await user.click(dialog.getByRole("radio", { name: /^Grande/ }));
    await user.click(dialog.getByRole("radio", { name: "3 sabores", exact: true }));
    for (const name of ["Mussarela", "Calabresa", "Frango"])
      await user.click(dialog.getByRole("checkbox", { name: new RegExp("^" + name) }));
    await user.click(dialog.getByRole("radio", { name: /^Fina/ }));
    await user.click(dialog.getByRole("radio", { name: /^Requeijão/ }));
    await user.click(dialog.getByRole("checkbox", { name: /^Queijo/ }));
    await user.click(dialog.getByRole("button", { name: /Adicionar ao atendimento/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(/Grande.*Mussarela.*Calabresa.*Frango/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Editar Monte sua pizza" }));
    const editing = within(screen.getByRole("dialog"));
    expect(editing.getByRole("radio", { name: /^Grande/ })).toBeChecked();
    expect(editing.getByRole("radio", { name: /^Requeijão/ })).toBeChecked();
    await user.click(editing.getByRole("radio", { name: /^Tradicional/ }));
    await user.click(editing.getByRole("button", { name: /Salvar alterações/ }));
    await user.click(screen.getByRole("button", { name: "Bebidas", exact: true }));
    await user.click(screen.getByRole("button", { name: "Escolher Suco de uva" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: /Adicionar ao atendimento/ }),
    );
    if (channel === "phone") {
      await user.click(screen.getByRole("radio", { name: "Retirada", exact: true }));
      await user.type(
        screen.getByRole("textbox", { name: /Como podemos chamar você/ }),
        "Cliente fictício",
      );
      await user.type(screen.getByRole("textbox", { name: /Telefone com DDD/ }), "71999999999");
    }
    await user.click(screen.getByRole("button", { name: "Confirmar pedido local" }));
    await waitFor(() => expect(f.repo.getSnapshot().tenants[company.id].orders).toHaveLength(1));
    const tenant = f.repo.getSnapshot().tenants[company.id],
      order = tenant.orders[0];
    expect(order.channel).toBe(channel);
    expect(order.paymentStatus).toBe("Pendente");
    expect(order.totalCents).toBe(7700);
    expect(order.lines).toHaveLength(2);
    expect(order.lines[0].selection.pizza).toMatchObject({
      sizeId: "large",
      flavorCount: 3,
      flavorIds: ["cheese", "pepper", "chicken"],
      doughId: "classic",
      edgeId: "cream",
    });
    expect(order.lines[0].selection.extraIds).toEqual(["cheese"]);
    expect(tenant.cart.lines).toEqual([]);
  },
);

it("COUNTER-MENU-02 busca e categorias preservam o acesso ao montador e oferecem combos completos", async () => {
  const f = await setup(),
    user = userEvent.setup();
  await f.services.saveProduct(company.id, {
    ...product,
    id: "combo",
    name: "Combo lanche e bebida",
    extras: [],
    ingredients: [],
    combo: {
      groups: [
        {
          id: "burger",
          name: "Lanche",
          quantity: 1,
          options: [{ productId: product.id, surchargeCents: 0 }],
        },
        {
          id: "drink",
          name: "Bebida",
          quantity: 1,
          options: [{ productId: "drink", surchargeCents: 0 }],
        },
      ],
    },
  });
  await f.services.saveProduct(company.id, {
    ...product,
    id: "hidden",
    name: "Indisponível",
    status: "Indisponível",
  });
  expect(screen.queryByRole("button", { name: "Escolher Indisponível" })).toBeNull();
  await user.type(screen.getByRole("searchbox", { name: "Buscar produto" }), "integral");
  expect(screen.getByRole("button", { name: "Escolher Suco de uva" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: `Escolher ${product.name}` })).toBeNull();
  expect(screen.getByRole("button", { name: "Monte sua pizza", exact: true })).toBeInTheDocument();
  await user.clear(screen.getByRole("searchbox", { name: "Buscar produto" }));
  await user.click(screen.getByRole("button", { name: "Escolher Combo lanche e bebida" }));
  const dialog = within(screen.getByRole("dialog"));
  const contents = dialog.getByRole("list", { name: "O que vem em Combo lanche e bebida" });
  expect(contents).toHaveTextContent(product.name);
  expect(contents).toHaveTextContent("Suco de uva");
  await user.click(dialog.getByRole("button", { name: /Adicionar ao atendimento/ }));
  expect(screen.getByRole("button", { name: "Editar Combo lanche e bebida" })).toBeInTheDocument();
  await f.services.saveProduct(company.id, {
    ...pizzaProduct,
    status: "Indisponível",
    pizza: { ...pizzaProduct.pizza, menuPlacement: "builder" },
  });
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Monte sua pizza", exact: true })).toBeNull(),
  );
});
