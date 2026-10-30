// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Auth from "../src/pages/Auth";
import ApplicationProvider from "../src/components/ApplicationProvider";
import { fixture } from "./fixtures.ts";
afterEach(cleanup);

it("LOGIN-LOCAL-01 distingue conta de produção e permite demonstração sem senha com recuperação acessível", async () => {
  const f = await fixture();
  await f.auth.signOut();
  render(
    <ApplicationProvider runtime={{ ...f, repository: f.repo }}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/super-admin" element={<h1>Central de teste</h1>} />
        </Routes>
      </MemoryRouter>
    </ApplicationProvider>,
  );
  expect(
    await screen.findByText(/contas e senhas são independentes da produção/),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Esqueci minha senha" })).toHaveAttribute(
    "href",
    "/recuperar",
  );
  await userEvent.click(screen.getByRole("button", { name: "Administrador da plataforma" }));
  expect(await screen.findByRole("heading", { name: "Central de teste" })).toBeInTheDocument();
  expect(f.auth.current()).toMatchObject({ role: "admin", demo: true });
});
